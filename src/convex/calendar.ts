import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Get content calendar aggregating schedule slots, social posts, and email campaigns
 */
export const getContentCalendar = query({
  args: {
    businessId: v.id("businesses"),
    userId: v.id("users"),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const { businessId, userId, startDate, endDate } = args;

    // Get schedule slots
    const scheduleSlots = await ctx.db
      .query("scheduleSlots")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), userId),
          q.gte(q.field("scheduledAt"), startDate),
          q.lte(q.field("scheduledAt"), endDate)
        )
      )
      .collect();

    // Get social posts (only those with scheduledAt defined)
    const allSocialPosts = await ctx.db
      .query("socialPosts")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .collect();
    
    const socialPosts = allSocialPosts.filter(
      (post) =>
        post.scheduledAt !== undefined &&
        post.scheduledAt >= startDate &&
        post.scheduledAt <= endDate
    );

    // Get email campaigns
    const emailCampaigns = await ctx.db
      .query("emails")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .filter((q) =>
        q.and(
          q.neq(q.field("scheduledAt"), undefined),
          q.gte(q.field("scheduledAt"), startDate),
          q.lte(q.field("scheduledAt"), endDate)
        )
      )
      .collect();

    // Transform to unified event format
    const events = [
      ...scheduleSlots.map((slot) => ({
        id: slot._id,
        type: "schedule" as const,
        title: slot.label,
        channel: slot.channel,
        scheduledAt: slot.scheduledAt,
        status: "scheduled" as const,
      })),
      ...socialPosts.map((post) => ({
        id: post._id,
        type: "social" as const,
        title: post.content.substring(0, 50) + (post.content.length > 50 ? "..." : ""),
        platforms: post.platforms,
        scheduledAt: post.scheduledAt,
        status: post.status,
      })),
      ...emailCampaigns.map((campaign) => ({
        id: campaign._id,
        type: "email" as const,
        title: campaign.subject || "Email Campaign",
        scheduledAt: campaign.scheduledAt!,
        status: campaign.status,
      })),
    ];

    return events.sort((a, b) => {
      const aTime = a.scheduledAt ?? 0;
      const bTime = b.scheduledAt ?? 0;
      return aTime - bTime;
    });
  },
});

/**
 * Bulk reschedule events
 */
export const bulkReschedule = mutation({
  args: {
    events: v.array(
      v.object({
        id: v.string(),
        type: v.union(v.literal("schedule"), v.literal("social"), v.literal("email")),
        newScheduledAt: v.number(),
      })
    ),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { events, userId } = args;

    for (const event of events) {
      try {
        if (event.type === "schedule") {
          await ctx.db.patch(event.id as any, {
            scheduledAt: event.newScheduledAt,
          });
        } else if (event.type === "social") {
          await ctx.db.patch(event.id as any, {
            scheduledAt: event.newScheduledAt,
          });
        } else if (event.type === "email") {
          await ctx.db.patch(event.id as any, {
            scheduledAt: event.newScheduledAt,
          });
        }
      } catch (error) {
        console.error(`Failed to reschedule ${event.type} event ${event.id}:`, error);
      }
    }

    return { success: true, rescheduled: events.length };
  },
});

/**
 * Bulk delete events
 */
export const bulkDelete = mutation({
  args: {
    events: v.array(
      v.object({
        id: v.string(),
        type: v.union(v.literal("schedule"), v.literal("social"), v.literal("email")),
      })
    ),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { events, userId } = args;

    for (const event of events) {
      try {
        if (event.type === "schedule") {
          await ctx.db.delete(event.id as any);
        } else if (event.type === "social") {
          await ctx.db.delete(event.id as any);
        } else if (event.type === "email") {
          // For emails, we might want to cancel instead of delete
          await ctx.db.patch(event.id as any, {
            status: "cancelled" as any,
          });
        }
      } catch (error) {
        console.error(`Failed to delete ${event.type} event ${event.id}:`, error);
      }
    }

    return { success: true, deleted: events.length };
  },
});
