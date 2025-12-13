import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * Create a department-specific channel
 */
export const createDepartmentChannel = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    department: v.string(),
    description: v.optional(v.string()),
    isPrivate: v.boolean(),
    isCrossDepartment: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();

    if (!user) throw new Error("User not found");

    const channelId = await ctx.db.insert("teamChannels", {
      businessId: args.businessId,
      name: args.name,
      description: args.description,
      isPrivate: args.isPrivate,
      createdBy: user._id,
      createdAt: Date.now(),
      department: args.department,
      isCrossDepartment: args.isCrossDepartment || false,
    });

    return channelId;
  },
});

/**
 * Get channels for a specific department
 */
export const getDepartmentChannels = query({
  args: {
    businessId: v.id("businesses"),
    department: v.string(),
  },
  handler: async (ctx, args) => {
    const channels = await ctx.db
      .query("teamChannels")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    return channels.filter((c) => c.department === args.department);
  },
});

/**
 * Get cross-department channels
 */
export const getCrossDepartmentChannels = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const channels = await ctx.db
      .query("teamChannels")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    return channels.filter((c) => c.isCrossDepartment === true);
  },
});

/**
 * Get all departments with channel counts
 */
export const getDepartmentSummary = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const channels = await ctx.db
      .query("teamChannels")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const departments = new Map<string, number>();
    
    channels.forEach((channel) => {
      if (channel.department) {
        departments.set(channel.department, (departments.get(channel.department) || 0) + 1);
      }
    });

    return Array.from(departments.entries()).map(([name, count]) => ({
      name,
      channelCount: count,
    }));
  },
});
