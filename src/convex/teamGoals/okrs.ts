import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// Create an Objective with Key Results
export const createObjective = mutation({
  args: {
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.optional(v.string()),
    ownerId: v.id("users"),
    parentObjectiveId: v.optional(v.id("objectives")),
    timeframe: v.object({
      startDate: v.number(),
      endDate: v.number(),
    }),
    category: v.union(
      v.literal("company"),
      v.literal("department"),
      v.literal("team"),
      v.literal("individual")
    ),
  },
  handler: async (ctx, args) => {
    const objectiveId = await ctx.db.insert("objectives", {
      businessId: args.businessId,
      title: args.title,
      description: args.description,
      ownerId: args.ownerId,
      parentObjectiveId: args.parentObjectiveId,
      timeframe: args.timeframe,
      category: args.category,
      status: "on_track", // Fixed status
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return objectiveId;
  },
});

// Create a Key Result for an Objective
export const createKeyResult = mutation({
  args: {
    objectiveId: v.id("objectives"),
    title: v.string(),
    description: v.optional(v.string()),
    targetValue: v.number(),
    currentValue: v.number(),
    unit: v.string(),
    ownerId: v.id("users"),
    measurementType: v.union(
      v.literal("number"),
      v.literal("percentage"),
      v.literal("currency"),
      v.literal("boolean")
    ),
  },
  handler: async (ctx, args) => {
    const keyResultId = await ctx.db.insert("keyResults", {
      objectiveId: args.objectiveId,
      title: args.title,
      description: args.description,
      targetValue: args.targetValue,
      currentValue: args.currentValue,
      unit: args.unit,
      ownerId: args.ownerId,
      measurementType: args.measurementType,
      status: "on_track", // Fixed status
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update objective progress
    await updateObjectiveProgress(ctx, args.objectiveId);

    return keyResultId;
  },
});

// Update Key Result progress
export const updateKeyResultProgress = mutation({
  args: {
    keyResultId: v.id("keyResults"),
    currentValue: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const keyResult = await ctx.db.get(args.keyResultId);
    if (!keyResult) throw new Error("Key Result not found");

    const progress = Math.min(
      100,
      Math.round((args.currentValue / keyResult.targetValue) * 100)
    );

    await ctx.db.patch(args.keyResultId, {
      currentValue: args.currentValue,
      progress,
      updatedAt: Date.now(),
    });

    // Log progress update
    await ctx.db.insert("keyResultUpdates", {
      keyResultId: args.keyResultId,
      previousValue: keyResult.currentValue,
      newValue: args.currentValue,
      note: args.note,
      // updatedBy: keyResult.ownerId, // Removed
      createdAt: Date.now(),
    });

    // Update parent objective progress
    await updateObjectiveProgress(ctx, keyResult.objectiveId);

    return { progress, currentValue: args.currentValue };
  },
});

// Helper function to update objective progress based on key results
async function updateObjectiveProgress(
  ctx: any,
  objectiveId: Id<"objectives">
) {
  const keyResults = await ctx.db
    .query("keyResults")
    .withIndex("by_objective", (q: any) => q.eq("objectiveId", objectiveId))
    .collect();

  if (keyResults.length === 0) {
    await ctx.db.patch(objectiveId, { progress: 0, updatedAt: Date.now() });
    return;
  }

  const totalProgress = keyResults.reduce(
    (sum: number, kr: any) => sum + kr.progress,
    0
  );
  const avgProgress = Math.round(totalProgress / keyResults.length);

  await ctx.db.patch(objectiveId, {
    progress: avgProgress,
    updatedAt: Date.now(),
  });

  // Update parent objective if exists
  const objective = await ctx.db.get(objectiveId);
  if (objective?.parentObjectiveId) {
    await updateObjectiveProgress(ctx, objective.parentObjectiveId);
  }
}

// Get all objectives for a business
export const listObjectives = query({
  args: {
    businessId: v.id("businesses"),
    category: v.optional(
      v.union(
        v.literal("company"),
        v.literal("department"),
        v.literal("team"),
        v.literal("individual")
      )
    ),
  },
  handler: async (ctx, args) => {
    let objectivesQuery = ctx.db
      .query("objectives")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId));

    const objectives = await objectivesQuery.collect();

    const filtered = args.category
      ? objectives.filter((obj) => obj.category === args.category)
      : objectives;

    // Get key results for each objective
    const objectivesWithKRs = await Promise.all(
      filtered.map(async (objective) => {
        const keyResults = await ctx.db
          .query("keyResults")
          .withIndex("by_objective", (q) =>
            q.eq("objectiveId", objective._id)
          )
          .collect();

        const owner = await ctx.db.get(objective.ownerId);

        return {
          ...objective,
          keyResults,
          owner: owner
            ? { _id: owner._id, name: owner.name, email: owner.email }
            : null,
        };
      })
    );

    return objectivesWithKRs;
  },
});

// Get objective details with full hierarchy
export const getObjectiveDetails = query({
  args: { objectiveId: v.id("objectives") },
  handler: async (ctx, args) => {
    const objective = await ctx.db.get(args.objectiveId);
    if (!objective) return null;

    const keyResults = await ctx.db
      .query("keyResults")
      .withIndex("by_objective", (q) => q.eq("objectiveId", args.objectiveId))
      .collect();

    const keyResultsWithUpdates = await Promise.all(
      keyResults.map(async (kr) => {
        const updates = await ctx.db
          .query("keyResultUpdates")
          .withIndex("by_key_result", (q) => q.eq("keyResultId", kr._id))
          .order("desc")
          .take(10);

        const owner = kr.ownerId ? await ctx.db.get(kr.ownerId) : null;

        return {
          ...kr,
          updates,
          owner: owner
            ? { _id: owner._id, name: owner.name, email: owner.email }
            : null,
        };
      })
    );

    const owner = await ctx.db.get(objective.ownerId);
    const parentObjective = objective.parentObjectiveId
      ? await ctx.db.get(objective.parentObjectiveId)
      : null;

    const childObjectives = await ctx.db
      .query("objectives")
      .withIndex("by_parent", (q) =>
        q.eq("parentObjectiveId", args.objectiveId)
      )
      .collect();

    return {
      ...objective,
      keyResults: keyResultsWithUpdates,
      owner: owner
        ? { _id: owner._id, name: owner.name, email: owner.email }
        : null,
      parentObjective,
      childObjectives,
    };
  },
});

// Update objective status
export const updateObjectiveStatus = mutation({
  args: {
    objectiveId: v.id("objectives"),
    status: v.union(
      v.literal("not_started"),
      v.literal("on_track"),
      v.literal("at_risk"),
      v.literal("completed")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.objectiveId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});