import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

const JOURNEY_STAGES = ["awareness", "consideration", "decision", "retention", "advocacy"] as const;
type JourneyStage = typeof JOURNEY_STAGES[number];

/**
 * Get current journey stage for a contact
 */
export const getCurrentStage = query({
  args: {
    businessId: v.id("businesses"),
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const stages = await ctx.db
      .query("customerJourneyStages")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .filter((q) => q.eq(q.field("businessId"), args.businessId))
      .collect();

    const currentStage = stages.find((s) => !s.exitedAt);
    return currentStage || null;
  },
});

/**
 * Track journey stage for a contact
 */
export const trackStage = mutation({
  args: {
    businessId: v.id("businesses"),
    contactId: v.id("contacts"),
    stage: v.union(
      v.literal("awareness"),
      v.literal("consideration"),
      v.literal("decision"),
      v.literal("retention"),
      v.literal("advocacy")
    ),
    triggeredBy: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();

    // Get current stage
    const currentStages = await ctx.db
      .query("customerJourneyStages")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .filter((q) => q.eq(q.field("businessId"), args.businessId))
      .collect();

    const currentStage = currentStages.find((s) => !s.exitedAt);

    // If already in this stage, do nothing
    if (currentStage && currentStage.stage === args.stage) {
      return currentStage._id;
    }

    // Exit current stage
    if (currentStage) {
      await ctx.db.patch(currentStage._id, { exitedAt: now });

      // Record transition
      await ctx.db.insert("customerJourneyTransitions", {
        businessId: args.businessId,
        contactId: args.contactId,
        fromStage: currentStage.stage,
        toStage: args.stage,
        transitionedAt: now,
        triggeredBy: args.triggeredBy || "manual",
        metadata: args.metadata,
      });
    } else {
      // First stage entry
      await ctx.db.insert("customerJourneyTransitions", {
        businessId: args.businessId,
        contactId: args.contactId,
        fromStage: "none",
        toStage: args.stage,
        transitionedAt: now,
        triggeredBy: args.triggeredBy || "manual",
        metadata: args.metadata,
      });
    }

    // Enter new stage
    const stageId = await ctx.db.insert("customerJourneyStages", {
      businessId: args.businessId,
      contactId: args.contactId,
      stage: args.stage,
      enteredAt: now,
      metadata: args.metadata,
    });

    return stageId;
  },
});

/**
 * Get journey analytics for a business
 */
export const getJourneyAnalytics = query({
  args: {
    businessId: v.id("businesses"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    // Get all current stages
    const stages = await ctx.db
      .query("customerJourneyStages")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const currentStages = stages.filter((s) => !s.exitedAt);

    // Count by stage
    const stageDistribution: Record<string, number> = {
      awareness: 0,
      consideration: 0,
      decision: 0,
      retention: 0,
      advocacy: 0,
    };

    currentStages.forEach((s) => {
      stageDistribution[s.stage] = (stageDistribution[s.stage] || 0) + 1;
    });

    // Get recent transitions
    const transitions = await ctx.db
      .query("customerJourneyTransitions")
      .withIndex("by_business_and_date", (q) => 
        q.eq("businessId", args.businessId).gte("transitionedAt", cutoff)
      )
      .collect();

    // Calculate average time in each stage
    const stageDurations: Record<string, number[]> = {
      awareness: [],
      consideration: [],
      decision: [],
      retention: [],
      advocacy: [],
    };

    stages.forEach((s) => {
      if (s.exitedAt) {
        const duration = s.exitedAt - s.enteredAt;
        stageDurations[s.stage].push(duration);
      }
    });

    const averageDurations: Record<string, number> = {};
    Object.entries(stageDurations).forEach(([stage, durations]) => {
      if (durations.length > 0) {
        const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
        averageDurations[stage] = Math.round(avg / (1000 * 60 * 60 * 24)); // Convert to days
      } else {
        averageDurations[stage] = 0;
      }
    });

    // Transition flow (from -> to counts)
    const transitionFlow: Record<string, Record<string, number>> = {};
    transitions.forEach((t) => {
      if (!transitionFlow[t.fromStage]) {
        transitionFlow[t.fromStage] = {};
      }
      transitionFlow[t.fromStage][t.toStage] = 
        (transitionFlow[t.fromStage][t.toStage] || 0) + 1;
    });

    return {
      totalContacts: currentStages.length,
      stageDistribution,
      averageDurations,
      transitionFlow,
      recentTransitions: transitions.length,
    };
  },
});

/**
 * Get journey history for a contact
 */
export const getContactJourneyHistory = query({
  args: {
    businessId: v.id("businesses"),
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const transitions = await ctx.db
      .query("customerJourneyTransitions")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .filter((q) => q.eq(q.field("businessId"), args.businessId))
      .collect();

    return transitions.sort((a, b) => a.transitionedAt - b.transitionedAt);
  },
});

/**
 * Auto-advance contacts based on engagement
 */
export const autoAdvanceJourneys = internalMutation({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    let advanced = 0;

    for (const contact of contacts) {
      // Get current stage
      const stages = await ctx.db
        .query("customerJourneyStages")
        .withIndex("by_contact", (q) => q.eq("contactId", contact._id))
        .filter((q) => q.eq(q.field("businessId"), args.businessId))
        .collect();

      const currentStage = stages.find((s) => !s.exitedAt);

      // Auto-advance logic based on engagement
      const lastEngaged = contact.lastEngagedAt || contact.createdAt;
      
      if (!currentStage) {
        // New contact -> awareness
        await ctx.db.insert("customerJourneyStages", {
          businessId: args.businessId,
          contactId: contact._id,
          stage: "awareness",
          enteredAt: now,
        });
        
        await ctx.db.insert("customerJourneyTransitions", {
          businessId: args.businessId,
          contactId: contact._id,
          fromStage: "none",
          toStage: "awareness",
          transitionedAt: now,
          triggeredBy: "automation",
        });
        advanced++;
      } else if (currentStage.stage === "awareness" && lastEngaged > sevenDaysAgo) {
        // Engaged in last 7 days -> consideration
        await ctx.db.patch(currentStage._id, { exitedAt: now });
        
        await ctx.db.insert("customerJourneyStages", {
          businessId: args.businessId,
          contactId: contact._id,
          stage: "consideration",
          enteredAt: now,
        });
        
        await ctx.db.insert("customerJourneyTransitions", {
          businessId: args.businessId,
          contactId: contact._id,
          fromStage: "awareness",
          toStage: "consideration",
          transitionedAt: now,
          triggeredBy: "automation",
          metadata: { reason: "recent_engagement" },
        });
        advanced++;
      } else if (currentStage.stage === "consideration" && lastEngaged > sevenDaysAgo) {
        // Highly engaged -> decision
        await ctx.db.patch(currentStage._id, { exitedAt: now });
        
        await ctx.db.insert("customerJourneyStages", {
          businessId: args.businessId,
          contactId: contact._id,
          stage: "decision",
          enteredAt: now,
        });
        
        await ctx.db.insert("customerJourneyTransitions", {
          businessId: args.businessId,
          contactId: contact._id,
          fromStage: "consideration",
          toStage: "decision",
          transitionedAt: now,
          triggeredBy: "automation",
          metadata: { reason: "high_engagement" },
        });
        advanced++;
      }
    }

    return { advanced };
  },
});

/**
 * Get contacts by journey stage
 */
export const getContactsByStage = query({
  args: {
    businessId: v.id("businesses"),
    stage: v.union(
      v.literal("awareness"),
      v.literal("consideration"),
      v.literal("decision"),
      v.literal("retention"),
      v.literal("advocacy")
    ),
  },
  handler: async (ctx, args) => {
    const stages = await ctx.db
      .query("customerJourneyStages")
      .withIndex("by_business_and_stage", (q) => 
        q.eq("businessId", args.businessId).eq("stage", args.stage)
      )
      .collect();

    const currentStages = stages.filter((s) => !s.exitedAt);
    
    const contacts = await Promise.all(
      currentStages.map(async (s) => {
        const contact = await ctx.db.get(s.contactId);
        return contact ? { ...contact, stageEnteredAt: s.enteredAt } : null;
      })
    );

    return contacts.filter((c) => c !== null);
  },
});
