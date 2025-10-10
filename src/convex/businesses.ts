import { v } from "convex/values";
import { query, internalQuery } from "./_generated/server";

export const getUserBusinesses = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) {
      return [];
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    
    if (!user) {
      return [];
    }
    
    // Get businesses where user is owner or team member
    const allBusinesses = await ctx.db.query("businesses").collect();
    return allBusinesses.filter(
      (business) =>
        business.ownerId === user._id ||
        business.teamMembers?.includes(user._id)
    );
  },
});

export const listAllBusinesses = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("businesses").collect();
  },
});