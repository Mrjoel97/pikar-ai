import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getComplianceStatus = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db
      .query("securityCompliance")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .first();
  },
});

export const updateComplianceStatus = mutation({
  args: {
    businessId: v.id("businesses"),
    framework: v.string(),
    overallScore: v.number(),
    controls: v.array(v.object({
      id: v.string(),
      name: v.string(),
      status: v.union(v.literal("compliant"), v.literal("non-compliant"), v.literal("partial")),
      score: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const { businessId, ...complianceData } = args;

    const existing = await ctx.db
      .query("securityCompliance")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...complianceData,
        lastAssessment: Date.now(),
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("securityCompliance", {
        businessId,
        ...complianceData,
        lastAssessment: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});
