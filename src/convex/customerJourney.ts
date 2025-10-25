import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
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
  args: { businessId: v.id("businesses"), days: v.number() },
  handler: async (ctx, args) => {
    const cutoff = Date.now() - args.days * 24 * 60 * 60 * 1000;

    // Get all current stages
    const stages = await ctx.db
      .query("customerJourneyStages")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.eq(q.field("exitedAt"), undefined))
      .collect();

    // Get recent transitions
    const transitions = await ctx.db
      .query("customerJourneyTransitions")
      .withIndex("by_business_and_date", (q) =>
        q.eq("businessId", args.businessId).gte("transitionedAt", cutoff)
      )
      .collect();

    // Calculate stage distribution
    const stageDistribution: Record<string, number> = {};
    for (const stage of stages) {
      stageDistribution[stage.stage] = (stageDistribution[stage.stage] || 0) + 1;
    }

    // Calculate average durations
    const stageDurations: Record<string, number[]> = {};
    for (const stage of stages) {
      const duration = Math.floor((Date.now() - stage.enteredAt) / (24 * 60 * 60 * 1000));
      if (!stageDurations[stage.stage]) stageDurations[stage.stage] = [];
      stageDurations[stage.stage].push(duration);
    }

    const averageDurations: Record<string, number> = {};
    for (const [stage, durations] of Object.entries(stageDurations)) {
      averageDurations[stage] = Math.round(
        durations.reduce((a, b) => a + b, 0) / durations.length
      );
    }

    // Calculate transition flow
    const transitionFlow: Record<string, Record<string, number>> = {};
    for (const transition of transitions) {
      if (!transitionFlow[transition.fromStage]) {
        transitionFlow[transition.fromStage] = {};
      }
      transitionFlow[transition.fromStage][transition.toStage] =
        (transitionFlow[transition.fromStage][transition.toStage] || 0) + 1;
    }

    return {
      stageDistribution,
      averageDurations,
      transitionFlow,
      totalContacts: stages.length,
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

// New: Get detailed touchpoint analytics
export const getTouchpointAnalytics = query({
  args: { businessId: v.id("businesses"), days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const touchpoints = await ctx.db
      .query("revenueTouchpoints")
      .withIndex("by_business_and_timestamp", (q) =>
        q.eq("businessId", args.businessId).gte("timestamp", cutoff)
      )
      .collect();

    // Channel distribution
    const channelCounts: Record<string, number> = {};
    const channelByStage: Record<string, Record<string, number>> = {};

    for (const touchpoint of touchpoints) {
      channelCounts[touchpoint.channel] = (channelCounts[touchpoint.channel] || 0) + 1;

      // Get contact's current stage
      const contact = await ctx.db.get(touchpoint.contactId);
      if (contact) {
        const currentStage = await ctx.db
          .query("customerJourneyStages")
          .withIndex("by_contact", (q) => q.eq("contactId", touchpoint.contactId))
          .filter((q) => q.eq(q.field("exitedAt"), undefined))
          .first();

        if (currentStage) {
          if (!channelByStage[currentStage.stage]) {
            channelByStage[currentStage.stage] = {};
          }
          channelByStage[currentStage.stage][touchpoint.channel] =
            (channelByStage[currentStage.stage][touchpoint.channel] || 0) + 1;
        }
      }
    }

    return {
      totalTouchpoints: touchpoints.length,
      channelDistribution: channelCounts,
      channelByStage,
      averageTouchpointsPerContact: touchpoints.length / (await ctx.db
        .query("contacts")
        .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
        .collect()).length || 0,
    };
  },
});

// New: Get conversion funnel analysis
export const getConversionFunnel = query({
  args: { businessId: v.id("businesses"), days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const stages = ["awareness", "consideration", "decision", "retention", "advocacy"];
    const funnelData: Array<{
      stage: string;
      count: number;
      dropoff: number;
      conversionRate: number;
    }> = [];

    let previousCount = 0;

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      
      // Count contacts who reached this stage
      const stageRecords = await ctx.db
        .query("customerJourneyStages")
        .withIndex("by_business_and_stage", (q) =>
          q.eq("businessId", args.businessId).eq("stage", stage as any)
        )
        .filter((q) => q.gte(q.field("enteredAt"), cutoff))
        .collect();

      const count = stageRecords.length;
      const dropoff = i > 0 ? previousCount - count : 0;
      const conversionRate = i > 0 && previousCount > 0 ? (count / previousCount) * 100 : 100;

      funnelData.push({
        stage,
        count,
        dropoff,
        conversionRate,
      });

      previousCount = count;
    }

    return {
      funnel: funnelData,
      overallConversionRate: funnelData.length > 0 && funnelData[0].count > 0
        ? ((funnelData[funnelData.length - 1].count / funnelData[0].count) * 100)
        : 0,
    };
  },
});

// New: Detect drop-off points and bottlenecks
export const getDropoffAnalysis = query({
  args: { businessId: v.id("businesses"), days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const transitions = await ctx.db
      .query("customerJourneyTransitions")
      .withIndex("by_business_and_date", (q) =>
        q.eq("businessId", args.businessId).gte("transitionedAt", cutoff)
      )
      .collect();

    // Calculate transition success rates
    const transitionCounts: Record<string, { total: number; successful: number }> = {};
    
    for (const transition of transitions) {
      const key = `${transition.fromStage}_to_${transition.toStage}`;
      if (!transitionCounts[key]) {
        transitionCounts[key] = { total: 0, successful: 0 };
      }
      transitionCounts[key].total++;
      
      // Consider forward movement as successful
      const stageOrder = ["none", "awareness", "consideration", "decision", "retention", "advocacy"];
      const fromIndex = stageOrder.indexOf(transition.fromStage);
      const toIndex = stageOrder.indexOf(transition.toStage);
      if (toIndex > fromIndex) {
        transitionCounts[key].successful++;
      }
    }

    // Identify bottlenecks (low conversion rates)
    const bottlenecks = Object.entries(transitionCounts)
      .map(([key, data]) => ({
        transition: key,
        conversionRate: (data.successful / data.total) * 100,
        totalAttempts: data.total,
      }))
      .filter((b) => b.conversionRate < 50 && b.totalAttempts > 5)
      .sort((a, b) => a.conversionRate - b.conversionRate);

    return {
      bottlenecks,
      totalTransitions: transitions.length,
    };
  },
});

// New: Get optimization suggestions based on data
export const getOptimizationSuggestions = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const suggestions: Array<{
      type: "warning" | "info" | "success";
      title: string;
      description: string;
      priority: "high" | "medium" | "low";
    }> = [];

    // Analyze funnel data
    const funnelData = await ctx.db
      .query("customerJourneyStages")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const stageCounts: Record<string, number> = {};
    for (const stage of funnelData) {
      if (!stage.exitedAt) {
        stageCounts[stage.stage] = (stageCounts[stage.stage] || 0) + 1;
      }
    }

    // Check for awareness stage bottleneck
    const awarenessCount = stageCounts.awareness || 0;
    const considerationCount = stageCounts.consideration || 0;
    if (awarenessCount > 0 && considerationCount / awarenessCount < 0.3) {
      suggestions.push({
        type: "warning",
        title: "Low Awareness to Consideration Conversion",
        description: "Only " + Math.round((considerationCount / awarenessCount) * 100) + "% of aware contacts move to consideration. Consider improving your nurture campaigns.",
        priority: "high",
      });
    }

    // Check for decision stage bottleneck
    const decisionCount = stageCounts.decision || 0;
    if (considerationCount > 0 && decisionCount / considerationCount < 0.4) {
      suggestions.push({
        type: "warning",
        title: "Consideration to Decision Drop-off",
        description: "Many contacts stall at consideration stage. Try adding case studies or free trials.",
        priority: "high",
      });
    }

    // Check for retention issues
    const retentionCount = stageCounts.retention || 0;
    if (decisionCount > 0 && retentionCount / decisionCount < 0.6) {
      suggestions.push({
        type: "warning",
        title: "Low Customer Retention",
        description: "Focus on onboarding and customer success to improve retention rates.",
        priority: "medium",
      });
    }

    // Positive feedback
    const advocacyCount = stageCounts.advocacy || 0;
    if (retentionCount > 0 && advocacyCount / retentionCount > 0.2) {
      suggestions.push({
        type: "success",
        title: "Strong Advocacy Rate",
        description: "Great job! " + Math.round((advocacyCount / retentionCount) * 100) + "% of retained customers become advocates.",
        priority: "low",
      });
    }

    // Check touchpoint diversity
    const recentTouchpoints = await ctx.db
      .query("revenueTouchpoints")
      .withIndex("by_business_and_timestamp", (q) =>
        q.eq("businessId", args.businessId).gte("timestamp", Date.now() - 30 * 24 * 60 * 60 * 1000)
      )
      .collect();

    const uniqueChannels = new Set(recentTouchpoints.map((t) => t.channel));
    if (uniqueChannels.size < 3) {
      suggestions.push({
        type: "info",
        title: "Limited Channel Diversity",
        description: "You're only using " + uniqueChannels.size + " channels. Consider expanding to email, social, and paid ads.",
        priority: "medium",
      });
    }

    return suggestions;
  },
});

// New: Track a touchpoint
export const trackTouchpoint = mutation({
  args: {
    businessId: v.id("businesses"),
    contactId: v.id("contacts"),
    channel: v.string(),
    campaignId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("revenueTouchpoints", {
      businessId: args.businessId,
      contactId: args.contactId,
      channel: args.channel,
      campaignId: args.campaignId,
      metadata: args.metadata,
      timestamp: Date.now(),
    });
  },
});

// New: Move contact to a new stage
export const moveContactToStage = mutation({
  args: {
    businessId: v.id("businesses"),
    contactId: v.id("contacts"),
    newStage: v.union(
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
    // Get current stage
    const currentStage = await ctx.db
      .query("customerJourneyStages")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .filter((q) => q.eq(q.field("exitedAt"), undefined))
      .first();

    const fromStage = currentStage?.stage || "none";

    // Exit current stage if exists
    if (currentStage) {
      await ctx.db.patch(currentStage._id, {
        exitedAt: Date.now(),
      });
    }

    // Enter new stage
    await ctx.db.insert("customerJourneyStages", {
      businessId: args.businessId,
      contactId: args.contactId,
      stage: args.newStage,
      enteredAt: Date.now(),
      metadata: args.metadata,
    });

    // Record transition
    await ctx.db.insert("customerJourneyTransitions", {
      businessId: args.businessId,
      contactId: args.contactId,
      fromStage: fromStage as any,
      toStage: args.newStage,
      transitionedAt: Date.now(),
      triggeredBy: args.triggeredBy,
      metadata: args.metadata,
    });

    return { success: true, fromStage, toStage: args.newStage };
  },
});