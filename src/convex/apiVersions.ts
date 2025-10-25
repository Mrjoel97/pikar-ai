import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

export const getActiveVersion = query({
  args: { apiId: v.id("customApis") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("apiVersions")
      .withIndex("by_api", (q) => q.eq("apiId", args.apiId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
  },
});

export const activateVersion = mutation({
  args: { 
    versionId: v.id("apiVersions"),
  },
  handler: async (ctx, args) => {
    const version = await ctx.db.get(args.versionId);
    if (!version) throw new Error("Version not found");

    // Deactivate all other versions
    const allVersions = await ctx.db
      .query("apiVersions")
      .withIndex("by_api", (q) => q.eq("apiId", version.apiId))
      .collect();
    
    for (const v of allVersions) {
      await ctx.db.patch(v._id, { isActive: false });
    }

    // Activate this version
    await ctx.db.patch(args.versionId, { isActive: true });
  },
});
