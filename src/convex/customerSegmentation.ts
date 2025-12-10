import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Track segment performance over time
 */
export const trackSegmentPerformance = query({
  args: {
    businessId: v.id("businesses"),
    segmentId: v.id("customerSegments"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const segment = await ctx.db.get(args.segmentId);
    if (!segment) return null;

    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    // Filter contacts matching segment criteria
    const matchingContacts = contacts.filter((contact) => {
      if (segment.criteria.engagement && contact.engagement !== segment.criteria.engagement) {
        return false;
      }
      if (segment.criteria.tags && segment.criteria.tags.length > 0) {
        const contactTags = contact.tags || [];
        if (!segment.criteria.tags.some((tag) => contactTags.includes(tag))) {
          return false;
        }
      }
      return true;
    });

    return {
      segmentId: args.segmentId,
      segmentName: segment.name,
      totalContacts: matchingContacts.length,
      growthRate: 0, // Calculate based on historical data
      engagementScore: matchingContacts.reduce((sum, c) => {
        const score = c.engagement === "active" ? 3 : c.engagement === "dormant" ? 2 : 1;
        return sum + score;
      }, 0) / Math.max(matchingContacts.length, 1),
    };
  },
});

/**
 * Auto-update segments based on contact behavior
 */
export const autoUpdateSegments = mutation({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const segments = await ctx.db
      .query("customerSegments")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    let updatedCount = 0;

    for (const segment of segments) {
      const matchingContacts = contacts.filter((contact) => {
        if (segment.criteria.engagement && contact.engagement !== segment.criteria.engagement) {
          return false;
        }
        return true;
      });

      await ctx.db.patch(segment._id, {
        contactCount: matchingContacts.length,
        lastUpdated: Date.now(),
      });
      updatedCount++;
    }

    return { updatedSegments: updatedCount };
  },
});