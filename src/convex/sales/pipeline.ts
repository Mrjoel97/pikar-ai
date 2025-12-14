import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// Create a new deal in the pipeline
export const createDeal = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    value: v.number(),
    stage: v.string(),
    contactName: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    closeDate: v.optional(v.number()),
    probability: v.number(),
    ownerId: v.id("users"),
    description: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const dealId = await ctx.db.insert("crmDeals", {
      businessId: args.businessId,
      connectionId: undefined as any, // Optional for manual deals
      name: args.name,
      value: args.value,
      stage: args.stage,
      contactName: args.contactName,
      contactEmail: args.contactEmail,
      closeDate: args.closeDate,
      probability: args.probability,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Track activity
    await ctx.db.insert("activityFeed", {
      businessId: args.businessId,
      userId: args.ownerId,
      type: "deal_created",
      content: `Created deal: ${args.name}`,
      data: { dealId, value: args.value, stage: args.stage },
    });

    return dealId;
  },
});

// Update deal stage (move through pipeline)
export const updateDealStage = mutation({
  args: {
    dealId: v.id("crmDeals"),
    newStage: v.string(),
    probability: v.optional(v.number()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const deal = await ctx.db.get(args.dealId);
    if (!deal) throw new Error("Deal not found");

    const oldStage = deal.stage;
    
    await ctx.db.patch(args.dealId, {
      stage: args.newStage,
      probability: args.probability ?? deal.probability,
      updatedAt: Date.now(),
    });

    // Track stage change activity
    await ctx.db.insert("activityFeed", {
      businessId: deal.businessId,
      userId: args.userId,
      type: "deal_stage_changed",
      content: `Moved "${deal.name}" from ${oldStage} to ${args.newStage}`,
      data: { dealId: args.dealId, oldStage, newStage: args.newStage },
    });

    return { success: true };
  },
});

// Update deal details
export const updateDeal = mutation({
  args: {
    dealId: v.id("crmDeals"),
    name: v.optional(v.string()),
    value: v.optional(v.number()),
    contactName: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    closeDate: v.optional(v.number()),
    probability: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { dealId, ...updates } = args;
    
    await ctx.db.patch(dealId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Get all deals for a business grouped by stage
export const getPipelineDeals = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const deals = await ctx.db
      .query("crmDeals")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    // Group by stage
    const stages = ["Lead", "Qualified", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];
    const pipeline: Record<string, typeof deals> = {};
    
    stages.forEach(stage => {
      pipeline[stage] = deals.filter(d => d.stage === stage);
    });

    return {
      pipeline,
      totalDeals: deals.length,
      totalValue: deals.reduce((sum, d) => sum + (d.value || 0), 0),
      stages,
    };
  },
});

// Get deals by stage
export const getDealsByStage = query({
  args: {
    businessId: v.id("businesses"),
    stage: v.string(),
  },
  handler: async (ctx, args) => {
    const deals = await ctx.db
      .query("crmDeals")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.eq(q.field("stage"), args.stage))
      .collect();

    return deals;
  },
});

// Get single deal details
export const getDeal = query({
  args: { dealId: v.id("crmDeals") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.dealId);
  },
});

// Delete a deal
export const deleteDeal = mutation({
  args: {
    dealId: v.id("crmDeals"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const deal = await ctx.db.get(args.dealId);
    if (!deal) throw new Error("Deal not found");

    await ctx.db.delete(args.dealId);

    // Track deletion
    await ctx.db.insert("activityFeed", {
      businessId: deal.businessId,
      userId: args.userId,
      type: "deal_deleted",
      content: `Deleted deal: ${deal.name}`,
      data: { dealName: deal.name, value: deal.value },
    });

    return { success: true };
  },
});

// Get pipeline metrics
export const getPipelineMetrics = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const deals = await ctx.db
      .query("crmDeals")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const activeDeals = deals.filter(d => 
      d.stage !== "Closed Won" && d.stage !== "Closed Lost"
    );

    const wonDeals = deals.filter(d => d.stage === "Closed Won");
    const lostDeals = deals.filter(d => d.stage === "Closed Lost");

    const recentDeals = deals.filter(d => d.createdAt >= thirtyDaysAgo);

    return {
      totalActiveDeals: activeDeals.length,
      totalActivePipelineValue: activeDeals.reduce((sum, d) => sum + (d.value || 0), 0),
      weightedPipelineValue: activeDeals.reduce((sum, d) => 
        sum + ((d.value || 0) * (d.probability || 0) / 100), 0
      ),
      wonDealsCount: wonDeals.length,
      wonDealsValue: wonDeals.reduce((sum, d) => sum + (d.value || 0), 0),
      lostDealsCount: lostDeals.length,
      winRate: deals.length > 0 
        ? (wonDeals.length / (wonDeals.length + lostDeals.length)) * 100 
        : 0,
      avgDealSize: wonDeals.length > 0
        ? wonDeals.reduce((sum, d) => sum + (d.value || 0), 0) / wonDeals.length
        : 0,
      dealsCreatedLast30Days: recentDeals.length,
    };
  },
});