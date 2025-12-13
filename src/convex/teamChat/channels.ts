import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// Get all channels for a business
export const getChannels = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const channels = await ctx.db
      .query("teamChannels")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();
    return channels;
  },
});

// Create a new channel
export const createChannel = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    isPrivate: v.boolean(),
    department: v.optional(v.string()),
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