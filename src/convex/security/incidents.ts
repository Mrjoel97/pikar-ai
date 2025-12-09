import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getIncidents = query({
  args: {
    businessId: v.id("businesses"),
    status: v.optional(v.union(v.literal("open"), v.literal("investigating"), v.literal("resolved"), v.literal("closed"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    let query = ctx.db
      .query("securityIncidents")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId));

    const incidents = await query.collect();

    let filtered = incidents;
    if (args.status) {
      filtered = incidents.filter((i) => i.status === args.status);
    }

    filtered.sort((a, b) => b.createdAt - a.createdAt);

    return args.limit ? filtered.slice(0, args.limit) : filtered;
  },
});

export const createIncident = mutation({
  args: {
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.string(),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    category: v.string(),
    affectedSystems: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    return await ctx.db.insert("securityIncidents", {
      ...args,
      status: "open",
      assignedTo: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      resolvedAt: null,
    });
  },
});

export const updateIncidentStatus = mutation({
  args: {
    incidentId: v.id("securityIncidents"),
    status: v.union(v.literal("open"), v.literal("investigating"), v.literal("resolved"), v.literal("closed")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const updateData: any = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.notes) {
      updateData.notes = args.notes;
    }

    if (args.status === "resolved" || args.status === "closed") {
      updateData.resolvedAt = Date.now();
    }

    await ctx.db.patch(args.incidentId, updateData);
  },
});
