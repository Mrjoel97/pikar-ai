import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export const listVersions = query({
  args: { apiId: v.id("customApis") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("apiVersions")
      .withIndex("by_api", (q) => q.eq("apiId", args.apiId))
      .order("desc")
      .collect();
  },
});

export const createVersion = mutation({
  args: {
    apiId: v.id("customApis"),
    version: v.string(),
    convexFunction: v.string(),
    changeNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const previousVersions = await ctx.db
      .query("apiVersions")
      .withIndex("by_api", (q) => q.eq("apiId", args.apiId))
      .collect();

    for (const version of previousVersions) {
      await ctx.db.patch(version._id, { isActive: false });
    }

    return await ctx.db.insert("apiVersions", {
      apiId: args.apiId,
      version: args.version,
      convexFunction: args.convexFunction,
      isActive: true,
      createdAt: Date.now(),
      changeNotes: args.changeNotes,
    });
  },
});

export const rollbackVersion = mutation({
  args: { versionId: v.id("apiVersions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const version = await ctx.db.get(args.versionId);
    if (!version) throw new Error("Version not found");

    const allVersions = await ctx.db
      .query("apiVersions")
      .withIndex("by_api", (q) => q.eq("apiId", version.apiId))
      .collect();

    for (const v of allVersions) {
      await ctx.db.patch(v._id, { isActive: v._id === args.versionId });
    }

    return { success: true };
  },
});
