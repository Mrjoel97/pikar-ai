import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Record a win for a business
 */
export const recordWin = mutation({
  args: {
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.optional(v.string()),
    impact: v.optional(v.string()),
    timeSaved: v.optional(v.number()), // minutes
    category: v.optional(v.union(
      v.literal("automation"),
      v.literal("revenue"),
      v.literal("efficiency"),
      v.literal("customer"),
      v.literal("other")
    )),
  },
  handler: async (ctx, args) => {
    const winId = await ctx.db.insert("wins", {
      businessId: args.businessId,
      title: args.title,
      description: args.description,
      impact: args.impact,
      timeSaved: args.timeSaved || 0,
      category: args.category || "other",
      date: Date.now(),
    });

    return winId;
  },
});

/**
 * Get wins for a business
 */
export const getWins = query({
  args: {
    businessId: v.id("businesses"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const wins = await ctx.db
      .query("wins")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .take(args.limit || 50);

    return wins;
  },
});

/**
 * Get win streak (consecutive days with wins)
 */
export const getWinStreak = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const wins = await ctx.db
      .query("wins")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .collect();

    if (wins.length === 0) return { streak: 0, lastWinDate: null };

    const dayMs = 24 * 60 * 60 * 1000;
    const today = Math.floor(Date.now() / dayMs);
    
    let streak = 0;
    let currentDay = today;
    
    for (const win of wins) {
      const winDay = Math.floor(win.date / dayMs);
      
      if (winDay === currentDay || winDay === currentDay - 1) {
        if (winDay < currentDay) {
          currentDay = winDay;
        }
        streak++;
      } else {
        break;
      }
    }

    return {
      streak,
      lastWinDate: wins[0].date,
      totalWins: wins.length,
    };
  },
});

/**
 * Get total time saved from wins
 */
export const getTotalTimeSaved = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const wins = await ctx.db
      .query("wins")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const totalMinutes = wins.reduce((sum, win) => sum + (win.timeSaved || 0), 0);

    return {
      totalMinutes,
      totalHours: Math.floor(totalMinutes / 60),
      totalDays: Math.floor(totalMinutes / (60 * 24)),
    };
  },
});

/**
 * Delete a win
 */
export const deleteWin = mutation({
  args: {
    winId: v.id("wins"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.winId);
    return { success: true };
  },
});

/**
 * Clear all wins for a business
 */
export const clearAllWins = mutation({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const wins = await ctx.db
      .query("wins")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    for (const win of wins) {
      await ctx.db.delete(win._id);
    }

    return { deleted: wins.length };
  },
});

/**
 * Get wins analytics by category
 */
export const getWinsByCategory = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const wins = await ctx.db
      .query("wins")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const categoryStats: Record<string, { count: number; totalTimeSaved: number }> = {};

    for (const win of wins) {
      const category = win.category || "other";
      if (!categoryStats[category]) {
        categoryStats[category] = { count: 0, totalTimeSaved: 0 };
      }
      categoryStats[category].count++;
      categoryStats[category].totalTimeSaved += win.timeSaved || 0;
    }

    return Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      count: stats.count,
      totalTimeSaved: stats.totalTimeSaved,
      avgTimeSaved: stats.count > 0 ? Math.round(stats.totalTimeSaved / stats.count) : 0,
    }));
  },
});

/**
 * Get wins trend over time
 */
export const getWinsTrend = query({
  args: {
    businessId: v.id("businesses"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const wins = await ctx.db
      .query("wins")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .collect();

    const days = args.days || 30;
    const dayMs = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const cutoff = now - (days * dayMs);

    const trendData: Array<{ date: string; count: number; timeSaved: number }> = [];

    for (let i = 0; i < days; i++) {
      const dayStart = cutoff + (i * dayMs);
      const dayEnd = dayStart + dayMs;
      const dayWins = wins.filter((w) => w.date >= dayStart && w.date < dayEnd);

      trendData.push({
        date: new Date(dayStart).toISOString().split("T")[0],
        count: dayWins.length,
        timeSaved: dayWins.reduce((sum, w) => sum + (w.timeSaved || 0), 0),
      });
    }

    return trendData;
  },
});