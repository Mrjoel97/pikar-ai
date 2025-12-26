import { query } from "./_generated/server";
import { v } from "convex/values";

export const getFeaturedVideos = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("demoVideos")
      .withIndex("by_featured", (q) => q.eq("featured", true))
      .collect();
  },
});