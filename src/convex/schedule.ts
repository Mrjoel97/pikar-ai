import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const addSlot = mutation({
  args: {
    businessId: v.optional(v.id("businesses")),
    label: v.string(),
    channel: v.union(v.literal("email"), v.literal("post"), v.literal("other")),
    scheduledAt: v.number(), // epoch ms
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (args.scheduledAt <= 0) throw new Error("scheduledAt must be > 0");

    const _id = await ctx.db.insert("scheduleSlots", {
      userId,
      businessId: args.businessId,
      label: args.label,
      channel: args.channel,
      scheduledAt: args.scheduledAt,
      createdAt: Date.now(),
    });
    return { ok: true as const, _id };
  },
});

export const addSlotsBulk = mutation({
  args: {
    slots: v.array(v.object({
      label: v.string(),
      channel: v.union(v.literal("email"), v.literal("post"), v.literal("other")),
      scheduledAt: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get business for entitlements check
    const business = await ctx.db
      .query("businesses")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .unique();

    // Check entitlements (basic limit for now)
    const existingSlots = await ctx.db
      .query("scheduleSlots")
      .withIndex("by_user_and_time", (q) => q.eq("userId", userId))
      .collect();

    const maxSlots = 50; // Per-tier limit (can be enhanced with entitlements)
    if (existingSlots.length + args.slots.length > maxSlots) {
      throw new Error(`Cannot add ${args.slots.length} slots. Limit is ${maxSlots} total.`);
    }

    const now = Date.now();
    const insertedIds = [];

    for (const slot of args.slots) {
      const id = await ctx.db.insert("scheduleSlots", {
        userId,
        businessId: business?._id,
        label: slot.label,
        channel: slot.channel,
        scheduledAt: slot.scheduledAt,
        createdAt: now,
      });
      insertedIds.push(id);
    }

    return { success: true, count: insertedIds.length, ids: insertedIds };
  },
});

export const listSlots = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    from: v.optional(v.number()),
    to: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const from = args.from ?? 0;
    const to = args.to ?? Number.MAX_SAFE_INTEGER;
    const limit = Math.min(Math.max(args.limit ?? 100, 1), 500);

    // Primary index: by_user_and_time to support ranged queries
    const rows = await ctx.db
      .query("scheduleSlots")
      .withIndex("by_user_and_time", (q) =>
        q.eq("userId", userId).gte("scheduledAt", from).lte("scheduledAt", to),
      )
      .order("asc")
      .take(limit);

    // If businessId specified, filter client-side after indexed read
    const filtered =
      args.businessId != null
        ? rows.filter((r) => r.businessId === args.businessId)
        : rows;

    return filtered;
  },
});

export const deleteSlot = mutation({
  args: {
    slotId: v.id("scheduleSlots"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const slot = await ctx.db.get(args.slotId);
    if (!slot) throw new Error("Slot not found");
    if (slot.userId !== userId) throw new Error("Not authorized");

    await ctx.db.delete(args.slotId);
    return { ok: true as const };
  },
});

export const nextSlotByChannel = query({
  args: {
    channel: v.union(v.literal("email"), v.literal("post"), v.literal("other")),
    businessId: v.optional(v.id("businesses")),
    from: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const from = args.from ?? Date.now();

    // Query next 50 upcoming slots for user, then filter by channel (and business if provided)
    const rows = await ctx.db
      .query("scheduleSlots")
      .withIndex("by_user_and_time", (q) => q.eq("userId", userId).gte("scheduledAt", from))
      .order("asc")
      .take(50);

    const filtered = rows.filter(
      (r) =>
        r.channel === args.channel &&
        (args.businessId ? r.businessId === args.businessId : true)
    );

    return filtered[0] ?? null;
  },
});