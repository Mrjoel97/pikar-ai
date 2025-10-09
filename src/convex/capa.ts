import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Query: List CAPA items for a business
export const listCapaItems = query({
  args: {
    businessId: v.id("businesses"),
    status: v.optional(v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("verification"),
      v.literal("closed")
    )),
    severity: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    )),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("capaItems")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc");

    const items = await query.collect();

    // Filter by status if provided
    let filtered = items;
    if (args.status) {
      filtered = filtered.filter((item) => item.status === args.status);
    }
    if (args.severity) {
      filtered = filtered.filter((item) => item.severity === args.severity);
    }

    // Enrich with assignee names
    const enriched = await Promise.all(
      filtered.map(async (item) => {
        const assignee = await ctx.db.get(item.assigneeId);
        const creator = await ctx.db.get(item.createdBy);
        const verifier = item.verifiedBy ? await ctx.db.get(item.verifiedBy) : null;

        return {
          ...item,
          assigneeName: assignee?.name || "Unknown",
          creatorName: creator?.name || "Unknown",
          verifierName: verifier?.name || null,
        };
      })
    );

    return enriched;
  },
});

// Query: Get single CAPA item
export const getCapaItem = query({
  args: { capaId: v.id("capaItems") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.capaId);
    if (!item) return null;

    const assignee = await ctx.db.get(item.assigneeId);
    const creator = await ctx.db.get(item.createdBy);
    const verifier = item.verifiedBy ? await ctx.db.get(item.verifiedBy) : null;

    return {
      ...item,
      assigneeName: assignee?.name || "Unknown",
      creatorName: creator?.name || "Unknown",
      verifierName: verifier?.name || null,
    };
  },
});

// Query: Get CAPA statistics
export const getCapaStats = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("capaItems")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const now = Date.now();
    const overdue = items.filter(
      (item) => item.status !== "closed" && item.slaDeadline < now
    ).length;

    return {
      total: items.length,
      open: items.filter((item) => item.status === "open").length,
      inProgress: items.filter((item) => item.status === "in_progress").length,
      verification: items.filter((item) => item.status === "verification").length,
      closed: items.filter((item) => item.status === "closed").length,
      overdue,
      critical: items.filter((item) => item.severity === "critical" && item.status !== "closed").length,
    };
  },
});

// Mutation: Create CAPA item
export const createCapaItem = mutation({
  args: {
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.string(),
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    assigneeId: v.id("users"),
    incidentId: v.optional(v.string()),
    nonconformityId: v.optional(v.string()),
    slaDeadline: v.number(),
    verificationRequired: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const capaId = await ctx.db.insert("capaItems", {
      businessId: args.businessId,
      title: args.title,
      description: args.description,
      severity: args.severity,
      status: "open",
      assigneeId: args.assigneeId,
      createdBy: user._id,
      incidentId: args.incidentId,
      nonconformityId: args.nonconformityId,
      slaDeadline: args.slaDeadline,
      verificationRequired: args.verificationRequired,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Audit log
    await ctx.db.insert("audit_logs", {
      businessId: args.businessId,
      userId: user._id,
      action: "capa_created",
      entityType: "capaItems",
      entityId: capaId,
      details: { title: args.title, severity: args.severity },
      createdAt: Date.now(),
    });

    return capaId;
  },
});

// Mutation: Update CAPA item
export const updateCapaItem = mutation({
  args: {
    capaId: v.id("capaItems"),
    status: v.optional(v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("verification"),
      v.literal("closed")
    )),
    rootCause: v.optional(v.string()),
    correctiveAction: v.optional(v.string()),
    preventiveAction: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const item = await ctx.db.get(args.capaId);
    if (!item) {
      throw new Error("CAPA item not found");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.status !== undefined) {
      updates.status = args.status;
      if (args.status === "closed") {
        updates.closedAt = Date.now();
      }
    }

    if (args.rootCause !== undefined) {
      updates.rootCause = args.rootCause;
    }

    if (args.correctiveAction !== undefined) {
      updates.correctiveAction = args.correctiveAction;
    }

    if (args.preventiveAction !== undefined) {
      updates.preventiveAction = args.preventiveAction;
    }

    await ctx.db.patch(args.capaId, updates);

    // Audit log
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();

    if (user) {
      await ctx.db.insert("audit_logs", {
        businessId: item.businessId,
        userId: user._id,
        action: "capa_updated",
        entityType: "capaItems",
        entityId: args.capaId,
        details: updates,
        createdAt: Date.now(),
      });
    }

    return args.capaId;
  },
});

// Mutation: Verify CAPA item
export const verifyCapaItem = mutation({
  args: {
    capaId: v.id("capaItems"),
    approved: v.boolean(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const item = await ctx.db.get(args.capaId);
    if (!item) {
      throw new Error("CAPA item not found");
    }

    await ctx.db.patch(args.capaId, {
      status: args.approved ? "closed" : "in_progress",
      verifiedBy: user._id,
      verifiedAt: Date.now(),
      closedAt: args.approved ? Date.now() : undefined,
      updatedAt: Date.now(),
    });

    // Audit log
    await ctx.db.insert("audit_logs", {
      businessId: item.businessId,
      userId: user._id,
      action: args.approved ? "capa_verified_approved" : "capa_verified_rejected",
      entityType: "capaItems",
      entityId: args.capaId,
      details: { notes: args.notes },
      createdAt: Date.now(),
    });

    return args.capaId;
  },
});

// Mutation: Delete CAPA item
export const deleteCapaItem = mutation({
  args: { capaId: v.id("capaItems") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const item = await ctx.db.get(args.capaId);
    if (!item) {
      throw new Error("CAPA item not found");
    }

    await ctx.db.delete(args.capaId);

    // Audit log
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();

    if (user) {
      await ctx.db.insert("audit_logs", {
        businessId: item.businessId,
        userId: user._id,
        action: "capa_deleted",
        entityType: "capaItems",
        entityId: args.capaId,
        details: { title: item.title },
        createdAt: Date.now(),
      });
    }
  },
});
