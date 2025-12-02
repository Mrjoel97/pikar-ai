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
    criteria: v.any(), // Flexible criteria object
    color: v.optional(v.string()),
  },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const segmentId = await ctx.db.insert("customerSegments", {
      businessId: args.businessId,
      name: args.name,
      description: args.description,
      criteria: args.criteria,
      // color: args.color || "#3b82f6", // Removed as it's not in the schema
      contactCount: 0, // Initial count
      createdAt: Date.now(),
      updatedAt: Date.now(),
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
  handler: async (ctx: any, args) => {
    const segment = await ctx.db.get(args.segmentId);
    if (!segment) {
      throw new Error("Segment not found");
    }

    // Get all contacts matching segment criteria
    const allContacts = await ctx.db
      .query("contacts")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId))
      .collect();

    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const ninetyDays = 90 * 24 * 60 * 60 * 1000;

    // Filter contacts based on criteria
    let matchingContacts = allContacts;

    if (segment.criteria.engagement) {
      if (segment.criteria.engagement === "active") {
        matchingContacts = matchingContacts.filter(
          (c: any) => c.lastEngagedAt && now - c.lastEngagedAt < thirtyDays
        );
      } else if (segment.criteria.engagement === "dormant") {
        matchingContacts = matchingContacts.filter(
          (c: any) => c.lastEngagedAt && now - c.lastEngagedAt >= thirtyDays && now - c.lastEngagedAt < ninetyDays
        );
      } else if (segment.criteria.engagement === "inactive") {
        matchingContacts = matchingContacts.filter(
          (c: any) => !c.lastEngagedAt || now - c.lastEngagedAt >= ninetyDays
        );
      }
    }

    if (segment.criteria.status) {
      matchingContacts = matchingContacts.filter((c: any) => c.status === segment.criteria.status);
    }

    if (segment.criteria.tags && segment.criteria.tags.length > 0) {
      matchingContacts = matchingContacts.filter((c: any) =>
        segment.criteria.tags!.some((tag: any) => c.tags?.includes(tag))
      );
    }

    // Calculate metrics
    const totalValue = matchingContacts.length;
    const avgEngagement = matchingContacts.filter((c: any) => c.lastEngagedAt).length / totalValue || 0;
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
  handler: async (ctx: any, args) => {
    return await ctx.db
      .query("customerSegments")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId))
      .collect();
  },
});

/**
 * Delete a segment
 */
export const deleteSegment = mutation({
  args: { segmentId: v.id("customerSegments") },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await ctx.db.delete(args.segmentId);
  },
});

export const updateSegment = mutation({
  args: {
    segmentId: v.id("customerSegments"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    criteria: v.optional(v.any()),
    color: v.optional(v.string()),
  },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const segment = await ctx.db.get(args.segmentId);
    if (!segment) throw new Error("Segment not found");

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.criteria !== undefined) updates.criteria = args.criteria;
    // if (args.color !== undefined) updates.color = args.color; // Removed

    await ctx.db.patch(args.segmentId, updates);
  },
});

export const getSegmentContacts = query({
  args: {
    segmentId: v.id("customerSegments"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx: any, args) => {
    const segment = await ctx.db.get(args.segmentId);
    if (!segment) return [];

    // This is a simplified implementation. In a real app, this would use
    // complex filtering logic based on the criteria.
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_business", (q: any) => q.eq("businessId", segment.businessId))
      .take(100); // Fetch a batch to filter in memory

    // Simple in-memory filtering based on criteria
    const filtered = contacts.filter((c: any) => {
      if (segment.criteria.tags && segment.criteria.tags.length > 0) {
        if (!c.tags || !segment.criteria.tags!.some((tag: any) => c.tags?.includes(tag))) {
          return false;
        }
      }
      // Add more criteria checks here
      return true;
    });

    return filtered.slice(0, args.limit || 50);
  },
});