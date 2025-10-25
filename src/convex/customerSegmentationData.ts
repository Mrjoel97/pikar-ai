import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create a custom customer segment
 */
export const createSegment = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    criteria: v.object({
      engagement: v.optional(v.string()),
      status: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      minInteractions: v.optional(v.number()),
      daysSinceLastContact: v.optional(v.number()),
    }),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const segmentId = await ctx.db.insert("customerSegments", {
      businessId: args.businessId,
      name: args.name,
      description: args.description,
      criteria: args.criteria,
      color: args.color || "#3b82f6",
      createdBy: user._id,
      createdAt: Date.now(),
    });

    return segmentId;
  },
});

/**
 * Get insights for a specific segment
 */
export const getSegmentInsights = query({
  args: {
    businessId: v.id("businesses"),
    segmentId: v.id("customerSegments"),
  },
  handler: async (ctx, args) => {
    const segment = await ctx.db.get(args.segmentId);
    if (!segment) {
      throw new Error("Segment not found");
    }

    // Get all contacts matching segment criteria
    const allContacts = await ctx.db
      .query("contacts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const ninetyDays = 90 * 24 * 60 * 60 * 1000;

    // Filter contacts based on criteria
    let matchingContacts = allContacts;

    if (segment.criteria.engagement) {
      if (segment.criteria.engagement === "active") {
        matchingContacts = matchingContacts.filter(
          (c) => c.lastEngagedAt && now - c.lastEngagedAt < thirtyDays
        );
      } else if (segment.criteria.engagement === "dormant") {
        matchingContacts = matchingContacts.filter(
          (c) => c.lastEngagedAt && now - c.lastEngagedAt >= thirtyDays && now - c.lastEngagedAt < ninetyDays
        );
      } else if (segment.criteria.engagement === "inactive") {
        matchingContacts = matchingContacts.filter(
          (c) => !c.lastEngagedAt || now - c.lastEngagedAt >= ninetyDays
        );
      }
    }

    if (segment.criteria.status) {
      matchingContacts = matchingContacts.filter((c) => c.status === segment.criteria.status);
    }

    if (segment.criteria.tags && segment.criteria.tags.length > 0) {
      matchingContacts = matchingContacts.filter((c) =>
        segment.criteria.tags!.some((tag) => c.tags?.includes(tag))
      );
    }

    // Calculate metrics
    const totalValue = matchingContacts.length;
    const avgEngagement = matchingContacts.filter((c) => c.lastEngagedAt).length / totalValue || 0;
    const growthRate = 0; // Would need historical data

    return {
      segment,
      contactCount: matchingContacts.length,
      metrics: {
        totalValue,
        avgEngagement: Math.round(avgEngagement * 100),
        growthRate,
      },
      topContacts: matchingContacts.slice(0, 10),
    };
  },
});

/**
 * List all segments for a business
 */
export const listSegments = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("customerSegments")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();
  },
});

/**
 * Delete a segment
 */
export const deleteSegment = mutation({
  args: { segmentId: v.id("customerSegments") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await ctx.db.delete(args.segmentId);
  },
});
