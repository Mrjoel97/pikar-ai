import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// Get alignment tree for an objective
export const getAlignmentTree = query({
  args: { objectiveId: v.id("objectives") },
  handler: async (ctx, args) => {
    const objective = await ctx.db.get(args.objectiveId);
    if (!objective) return null;

    // Get parent chain
    const parentChain = [];
    let currentParentId = objective.parentObjectiveId;
    
    while (currentParentId) {
      const parent = await ctx.db.get(currentParentId);
      if (!parent) break;
      
      const owner = await ctx.db.get(parent.ownerId);
      parentChain.push({
        ...parent,
        owner: owner ? { _id: owner._id, name: owner.name } : null,
      });
      
      currentParentId = parent.parentObjectiveId;
    }

    // Get children
    const children = await ctx.db
      .query("objectives")
      .withIndex("by_parent", (q) => q.eq("parentObjectiveId", args.objectiveId))
      .collect();

    const childrenWithOwners = await Promise.all(
      children.map(async (child) => {
        const owner = await ctx.db.get(child.ownerId);
        const childKRs = await ctx.db
          .query("keyResults")
          .withIndex("by_objective", (q) => q.eq("objectiveId", child._id))
          .collect();

        return {
          ...child,
          owner: owner ? { _id: owner._id, name: owner.name } : null,
          keyResultsCount: childKRs.length,
        };
      })
    );

    const owner = await ctx.db.get(objective.ownerId);

    return {
      objective: {
        ...objective,
        owner: owner ? { _id: owner._id, name: owner.name } : null,
      },
      parents: parentChain.reverse(),
      children: childrenWithOwners,
    };
  },
});

// Get alignment map for entire business
export const getBusinessAlignmentMap = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const objectives = await ctx.db
      .query("objectives")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    // Build hierarchy
    const companyObjectives = objectives.filter(
      (o) => o.category === "company" && !o.parentObjectiveId
    );

    const buildTree = async (parentId: Id<"objectives">) => {
      const children = objectives.filter((o) => o.parentObjectiveId === parentId);
      
      return await Promise.all(
        children.map(async (child) => {
          const owner = await ctx.db.get(child.ownerId);
          const keyResults = await ctx.db
            .query("keyResults")
            .withIndex("by_objective", (q) => q.eq("objectiveId", child._id))
            .collect();

          const childTree = await buildTree(child._id);

          return {
            ...child,
            owner: owner ? { _id: owner._id, name: owner.name } : null,
            keyResultsCount: keyResults.length,
            children: childTree,
          };
        })
      );
    };

    const alignmentMap = await Promise.all(
      companyObjectives.map(async (companyObj) => {
        const owner = await ctx.db.get(companyObj.ownerId);
        const keyResults = await ctx.db
          .query("keyResults")
          .withIndex("by_objective", (q) => q.eq("objectiveId", companyObj._id))
          .collect();

        const children = await buildTree(companyObj._id);

        return {
          ...companyObj,
          owner: owner ? { _id: owner._id, name: owner.name } : null,
          keyResultsCount: keyResults.length,
          children,
        };
      })
    );

    // Calculate alignment metrics
    const totalObjectives = objectives.length;
    const alignedObjectives = objectives.filter((o) => o.parentObjectiveId).length;
    const alignmentPercentage = totalObjectives > 0
      ? Math.round((alignedObjectives / totalObjectives) * 100)
      : 0;

    return {
      alignmentMap,
      metrics: {
        totalObjectives,
        alignedObjectives,
        alignmentPercentage,
        byCategory: {
          company: objectives.filter((o) => o.category === "company").length,
          department: objectives.filter((o) => o.category === "department").length,
          team: objectives.filter((o) => o.category === "team").length,
          individual: objectives.filter((o) => o.category === "individual").length,
        },
      },
    };
  },
});

// Create alignment between objectives
export const alignObjectives = mutation({
  args: {
    childObjectiveId: v.id("objectives"),
    parentObjectiveId: v.id("objectives"),
  },
  handler: async (ctx, args) => {
    const child = await ctx.db.get(args.childObjectiveId);
    const parent = await ctx.db.get(args.parentObjectiveId);

    if (!child || !parent) {
      throw new Error("Objective not found");
    }

    // Prevent circular dependencies
    let currentParent = parent;
    while (currentParent.parentObjectiveId) {
      if (currentParent.parentObjectiveId === args.childObjectiveId) {
        throw new Error("Cannot create circular alignment");
      }
      const nextParent = await ctx.db.get(currentParent.parentObjectiveId);
      if (!nextParent) break;
      currentParent = nextParent;
    }

    await ctx.db.patch(args.childObjectiveId, {
      parentObjectiveId: args.parentObjectiveId,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Remove alignment
export const removeAlignment = mutation({
  args: { objectiveId: v.id("objectives") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.objectiveId, {
      parentObjectiveId: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Get alignment conflicts (objectives with misaligned progress)
export const getAlignmentConflicts = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const objectives = await ctx.db
      .query("objectives")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const conflicts = [];

    for (const objective of objectives) {
      if (!objective.parentObjectiveId) continue;

      const parent = await ctx.db.get(objective.parentObjectiveId);
      if (!parent) continue;

      // Check if child is significantly behind parent
      const progressGap = parent.progress - objective.progress;
      
      if (progressGap > 30) {
        const owner = await ctx.db.get(objective.ownerId);
        const parentOwner = await ctx.db.get(parent.ownerId);

        conflicts.push({
          objective: {
            ...objective,
            owner: owner ? { _id: owner._id, name: owner.name } : null,
          },
          parent: {
            ...parent,
            owner: parentOwner ? { _id: parentOwner._id, name: parentOwner.name } : null,
          },
          progressGap,
          severity: progressGap > 50 ? "high" : "medium",
        });
      }
    }

    return conflicts.sort((a, b) => b.progressGap - a.progressGap);
  },
});
