import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Track segment performance over time
 */
export const trackSegmentPerformance = query({
  args: {
    businessId: v.id("businesses"),
    segmentId: v.id("customerSegments"),
  },
  handler: async (ctx, args) => {
    const segment = await ctx.db.get(args.segmentId);
    if (!segment) return null;

    // Simulate performance tracking over time
    const history = [
      { date: "2023-10-01", size: 120, engagement: 45 },
      { date: "2023-11-01", size: 135, engagement: 48 },
      { date: "2023-12-01", size: 150, engagement: 52 },
    ];

    return {
      segmentName: segment.name,
      growthRate: 12.5, // %
      engagementTrend: "increasing",
      history,
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