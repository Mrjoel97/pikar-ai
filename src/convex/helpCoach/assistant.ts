import { v } from "convex/values";
import { query, mutation, internalMutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// Query to get contextual tips based on user's current page and tier
export const getContextualTips = query({
  args: {
    userId: v.optional(v.id("users")),
    currentPage: v.string(),
    tier: v.union(
      v.literal("solopreneur"),
      v.literal("startup"),
      v.literal("sme"),
      v.literal("enterprise")
    ),
  },
  handler: async (ctx, args) => {
    // Get user's dismissed tips
    let dismissedIds = new Set<string>();
    
    if (args.userId) {
      const dismissedTips = await ctx.db
        .query("dismissedTips")
        .withIndex("by_user", (q) => q.eq("userId", args.userId!))
        .collect();
      
      dismissedIds = new Set(dismissedTips.map(d => d.tipId));
    }

    // Get all tips for the current context
    const allTips = await ctx.db
      .query("helpTips")
      .withIndex("by_page_and_tier", (q) => 
        q.eq("page", args.currentPage).eq("tier", args.tier)
      )
      .collect();

    // Filter out dismissed tips and sort by priority
    return allTips
      .filter(tip => !dismissedIds.has(tip._id))
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .slice(0, 3); // Return top 3 tips
  },
});

// Query to get user's help progress
export const getHelpProgress = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("helpProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!progress) {
      return {
        completedTutorials: [],
        dismissedTips: [],
        lastActiveAt: Date.now(),
        helpScore: 0,
      };
    }

    return progress;
  },
});

// Mutation to dismiss a tip
export const dismissTip = mutation({
  args: {
    userId: v.id("users"),
    tipId: v.id("helpTips"),
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    // Check if already dismissed
    const existing = await ctx.db
      .query("dismissedTips")
      .withIndex("by_user_and_tip", (q) => 
        q.eq("userId", args.userId).eq("tipId", args.tipId)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    // Create dismissed record
    return await ctx.db.insert("dismissedTips", {
      userId: args.userId,
      tipId: args.tipId,
      businessId: args.businessId,
      dismissedAt: Date.now(),
    });
  },
});

// Mutation to track tip interaction
export const trackTipInteraction = mutation({
  args: {
    userId: v.id("users"),
    tipId: v.id("helpTips"),
    action: v.union(v.literal("viewed"), v.literal("clicked"), v.literal("dismissed")),
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tipInteractions", {
      userId: args.userId,
      tipId: args.tipId,
      action: args.action,
      businessId: args.businessId,
      timestamp: Date.now(),
    });
  },
});

// Query to get help analytics for admin
export const getHelpAnalytics = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const start = args.startDate || Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days ago
    const end = args.endDate || Date.now();

    const interactions = await ctx.db
      .query("tipInteractions")
      .filter((q) => 
        q.and(
          q.gte(q.field("timestamp"), start),
          q.lte(q.field("timestamp"), end)
        )
      )
      .collect();

    // Calculate metrics
    const totalViews = interactions.filter(i => i.action === "viewed").length;
    const totalClicks = interactions.filter(i => i.action === "clicked").length;
    const totalDismissals = interactions.filter(i => i.action === "dismissed").length;

    return {
      totalViews,
      totalClicks,
      totalDismissals,
      clickThroughRate: totalViews > 0 ? (totalClicks / totalViews) * 100 : 0,
      dismissalRate: totalViews > 0 ? (totalDismissals / totalViews) * 100 : 0,
    };
  },
});