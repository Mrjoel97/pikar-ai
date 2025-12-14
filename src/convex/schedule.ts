import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
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
        businessId: business?._id as any, // Cast
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
        (args.businessId as any ? r.businessId === args.businessId as any : true)
    );

    return filtered[0] ?? null;
  },
});

export const suggestOptimalSlots = action({
  args: {
    businessId: v.id("businesses"),
    cadence: v.optional(v.union(v.literal("light"), v.literal("standard"), v.literal("aggressive"))),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get agent profile for personalization
    const profile = await ctx.runQuery("agentProfile:getMyAgentProfile" as any, {
      businessId: args.businessId,
    });

    const cadence = args.cadence || profile?.cadence || "standard";
    const timezone = args.timezone || "UTC";

    // Build AI prompt for optimal scheduling
    const prompt = `You are a scheduling optimization expert. Generate optimal posting times for a ${cadence} cadence content strategy.

Cadence: ${cadence}
- light: 2-3 posts per week, minimal email
- standard: 3-4 posts per week, 1-2 emails
- aggressive: 5-7 posts per week, 2-3 emails

Timezone: ${timezone}

For each suggested slot, provide:
1. Day of week and time
2. Channel (Post or Email)
3. Label (descriptive name)
4. Reasoning (why this time is optimal - engagement patterns, audience behavior, industry best practices)

Return ONLY valid JSON array with this exact structure:
[
  {
    "dayOfWeek": 2,
    "hour": 10,
    "minute": 0,
    "channel": "Post",
    "label": "Weekly Post",
    "reasoning": "Tuesday mornings show 35% higher engagement for B2B audiences as professionals check social media after Monday catch-up"
  }
]

Generate ${cadence === "light" ? "2-3" : cadence === "aggressive" ? "6-8" : "4-5"} optimal slots.`;

    try {
      // Call OpenAI for intelligent suggestions
      const result = await ctx.runAction("openai:generate" as any, {
        prompt,
        model: "gpt-4o-mini",
        temperature: 0.7,
        maxTokens: 1000,
      });

      // Parse AI response
      let suggestions: Array<{
        dayOfWeek: number;
        hour: number;
        minute: number;
        channel: "Post" | "Email";
        label: string;
        reasoning: string;
      }> = [];

      try {
        // Extract JSON from response (handle markdown code blocks)
        const text = result.text.trim();
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          suggestions = JSON.parse(jsonMatch[0]);
        } else {
          suggestions = JSON.parse(text);
        }
      } catch (parseError) {
        console.error("Failed to parse AI suggestions:", parseError);
        // Fallback to deterministic suggestions
        suggestions = getFallbackSuggestions(cadence);
      }

      // Convert to absolute timestamps (next occurrence of each day/time)
      const now = new Date();
      const slots = suggestions.map((s) => {
        const targetDate = new Date(now);
        const daysUntil = (s.dayOfWeek + 7 - targetDate.getDay()) % 7 || 7;
        targetDate.setDate(targetDate.getDate() + daysUntil);
        targetDate.setHours(s.hour, s.minute, 0, 0);

        return {
          label: s.label,
          channel: s.channel.toLowerCase() as "post" | "email",
          scheduledAt: targetDate.getTime(),
          reasoning: s.reasoning,
          when: targetDate.toLocaleString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
      });

      return { slots, aiGenerated: true };
    } catch (error) {
      console.error("AI suggestion error:", error);
      // Fallback to deterministic suggestions
      const fallback = getFallbackSuggestions(cadence);
      const now = new Date();
      const slots = fallback.map((s) => {
        const targetDate = new Date(now);
        const daysUntil = (s.dayOfWeek + 7 - targetDate.getDay()) % 7 || 7;
        targetDate.setDate(targetDate.getDate() + daysUntil);
        targetDate.setHours(s.hour, s.minute, 0, 0);

        return {
          label: s.label,
          channel: s.channel.toLowerCase() as "post" | "email",
          scheduledAt: targetDate.getTime(),
          reasoning: s.reasoning,
          when: targetDate.toLocaleString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
      });

      return { slots, aiGenerated: false };
    }
  },
});

// Fallback suggestions when AI is unavailable
function getFallbackSuggestions(cadence: "light" | "standard" | "aggressive") {
  const base = [
    {
      dayOfWeek: 2,
      hour: 10,
      minute: 0,
      channel: "Post" as const,
      label: "Weekly Post",
      reasoning: "Tuesday mornings are optimal for professional audiences checking social media after Monday",
    },
    {
      dayOfWeek: 3,
      hour: 14,
      minute: 0,
      channel: "Email" as const,
      label: "Newsletter",
      reasoning: "Wednesday afternoons have highest email open rates (18-22% average)",
    },
    {
      dayOfWeek: 4,
      hour: 10,
      minute: 0,
      channel: "Post" as const,
      label: "Follow-up Post",
      reasoning: "Thursday mornings maintain engagement momentum before weekend",
    },
  ];

  if (cadence === "light") {
    return base.slice(0, 2);
  }

  if (cadence === "aggressive") {
    return [
      ...base,
      {
        dayOfWeek: 1,
        hour: 9,
        minute: 0,
        channel: "Post" as const,
        label: "Momentum Post",
        reasoning: "Monday mornings capture fresh week energy and planning mindset",
      },
      {
        dayOfWeek: 5,
        hour: 15,
        minute: 0,
        channel: "Email" as const,
        label: "Promo Email",
        reasoning: "Friday afternoons are ideal for promotional content as people plan weekend activities",
      },
      {
        dayOfWeek: 6,
        hour: 11,
        minute: 0,
        channel: "Post" as const,
        label: "Weekend Teaser",
        reasoning: "Saturday late mornings reach audiences during leisure browsing time",
      },
    ];
  }

  return base;
}