import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import * as builtin from "./templatesData";

// Helpers to read built-ins flexibly regardless of export shape
function getAllBuiltIns(): any[] {
  const mod: any = builtin as any;
  if (typeof mod.getAllBuiltInTemplates === "function") return mod.getAllBuiltInTemplates();
  if (Array.isArray(mod.BUILT_IN_TEMPLATES)) return mod.BUILT_IN_TEMPLATES;
  if (Array.isArray(mod.TEMPLATES)) return mod.TEMPLATES;
  if (Array.isArray(mod.default)) return mod.default;
  return [];
}

function getBuiltInByKey(key: string): any | undefined {
  const mod: any = builtin as any;
  if (typeof mod.getBuiltInTemplateByKey === "function") return mod.getBuiltInTemplateByKey(key);
  const list = getAllBuiltIns();
  return list.find((t: any) => String(t._id ?? t.id ?? t.key ?? t.name) === key);
}

// Public: Fetch built-in workflow templates with optional filters
export const getBuiltInTemplates = query({
  args: {
    tier: v.union(
      v.literal("solopreneur"),
      v.literal("startup"),
      v.literal("sme"),
      v.literal("enterprise"),
      v.null()
    ),
    search: v.union(v.string(), v.null()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (_ctx, args) => {
    let items: any[] = getAllBuiltIns();

    if (args.tier !== null) {
      items = items.filter((t: any) => (t.tier ?? null) === args.tier);
    }

    const q = args.search && args.search !== null ? String(args.search).trim().toLowerCase() : "";
    if (q) {
      items = items.filter((t: any) => {
        const name = String(t.name ?? "").toLowerCase();
        const desc = String(t.description ?? "").toLowerCase();
        const tags: string[] = Array.isArray(t.tags) ? t.tags.map((x: any) => String(x).toLowerCase()) : [];
        return name.includes(q) || desc.includes(q) || tags.some(tag => tag.includes(q));
      });
    }

    const start = Math.max(0, args.offset ?? 0);
    const end = args.limit && args.limit > 0 ? start + args.limit : undefined;

    // Ensure a stable _id field for UI keys
    return items.slice(start, end).map((t: any) => ({
      _id: t._id ?? t.id ?? t.key ?? t.name,
      ...t,
    }));
  },
});

// Public: Copy a built-in template into a business' workflows
export const copyBuiltInTemplate = mutation({
  args: {
    key: v.string(),
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const tpl: any = getBuiltInByKey(args.key);
    if (!tpl) throw new Error("Template not found");

    const doc: any = {
      businessId: args.businessId,
      name: tpl.name ?? "Untitled Workflow",
      description: tpl.description ?? "",
      trigger: tpl.trigger ?? { type: "manual" },
      approval: tpl.approval ?? { required: false, threshold: 1 },
      pipeline: Array.isArray(tpl.pipeline) ? tpl.pipeline : [],
      template: false,
      tags: Array.isArray(tpl.tags) ? tpl.tags : [],
      status: (tpl.status as string) ?? "draft",
    };

    const id = await ctx.db.insert("workflows", doc);
    return id;
  },
});

/**
 * Smart Template Ordering Query
 * Returns templates ordered by intelligent ranking algorithm
 */
export const listTemplatesWithSmartOrdering = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    userId: v.optional(v.id("users")),
    tier: v.optional(v.string()),
    category: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    
    // Get pinned templates if user is authenticated
    const pinnedSet = new Set<string>();
    const pinnedDates = new Map<string, number>();
    if (args.userId) {
      const pins = await ctx.db
        .query("templatePins")
        .withIndex("by_user", (q) => q.eq("userId", args.userId as Id<"users">))
        .collect();
      pins.forEach((p) => {
        pinnedSet.add(String(p.templateId));
        pinnedDates.set(String(p.templateId), p._creationTime);
      });
    }

    // Get usage stats if business context available
    const usageStats = new Map<string, { count: number; lastUsed: number }>();
    if (args.businessId) {
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const usageEvents = await ctx.db
        .query("audit_logs")
        .withIndex("by_business", (q) => 
          q.eq("businessId", args.businessId as Id<"businesses">)
        )
        .filter((q) => 
          q.and(
            q.eq(q.field("entityType"), "workflow"),
            q.eq(q.field("action"), "created_from_template"),
            q.gt(q.field("createdAt"), thirtyDaysAgo)
          )
        )
        .collect();

      usageEvents.forEach((event) => {
        const templateId = (event.details as any)?.templateId as string;
        if (templateId) {
          const existing = usageStats.get(templateId) || { count: 0, lastUsed: 0 };
          existing.count++;
          existing.lastUsed = Math.max(existing.lastUsed, event.createdAt);
          usageStats.set(templateId, existing);
        }
      });
    }

    // Get business for tier and industry matching
    const business = args.businessId 
      ? await ctx.db.get(args.businessId)
      : null;
    const userTier = args.tier || business?.tier || "solopreneur";
    const userIndustry = business?.industry?.toLowerCase();

    // Get all built-in templates (from client-side generator)
    // In production, these would be stored in DB
    const allTemplates = await ctx.db
      .query("workflowTemplates")
      .collect();

    // Apply filters
    let filtered = allTemplates;
    if (args.category) {
      filtered = filtered.filter((t) => 
        t.tags?.some((tag: string) => tag.toLowerCase().includes(args.category!.toLowerCase()))
      );
    }
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      filtered = filtered.filter((t) => 
        t.name.toLowerCase().includes(searchLower) ||
        t.description?.toLowerCase().includes(searchLower) ||
        t.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower))
      );
    }

    // Calculate smart ranking score for each template
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;

    const scored = filtered.map((template) => {
      let score = 0;
      const templateId = template._id;
      const templateIdStr = String(templateId);
      const usage = usageStats.get(templateIdStr);

      // 1. Pinned (highest priority) - 1000 points + recency
      if (pinnedSet.has(templateIdStr)) {
        const pinDate = pinnedDates.get(templateIdStr) || 0;
        score += 1000 + (pinDate / 1000000); // Add fractional recency
      }

      // 2. Recently used (last 7 days) - 500 points
      if (usage && usage.lastUsed > sevenDaysAgo) {
        score += 500;
      }

      // 3. Frequently used (30 day count) - up to 300 points
      if (usage) {
        score += Math.min(300, usage.count * 30);
      }

      // 4. Tier match - 200 points
      if (template.tier === userTier) {
        score += 200;
      }

      // 5. Industry match - 150 points
      if (userIndustry && template.tags?.some((tag: string) => 
        tag.toLowerCase().includes(userIndustry)
      )) {
        score += 150;
      }

      // 6. Recency of template (newer = better) - up to 100 points
      const templateAge = now - template._creationTime;
      if (templateAge < fourteenDaysAgo) {
        score += 100 - (templateAge / fourteenDaysAgo) * 100;
      }

      // 7. Global popularity (mock for now) - up to 50 points
      // In production, aggregate from all businesses
      score += Math.random() * 50;

      return {
        ...template,
        _smartScore: score,
        _isPinned: pinnedSet.has(templateIdStr),
        _usageCount: usage?.count || 0,
        _lastUsed: usage?.lastUsed || 0,
        _isNew: template._creationTime > fourteenDaysAgo,
      };
    });

    // Sort by score descending
    scored.sort((a, b) => b._smartScore - a._smartScore);

    // Return limited results
    return scored.slice(0, limit);
  },
});

export const listPinnedTemplates = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const pins = await ctx.db
      .query("templatePins")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const templates = await Promise.all(
      pins.map(async (pin) => {
        const template = await ctx.db.get(pin.templateId);
        return template;
      })
    );

    return templates.filter((t) => t !== null);
  },
});

/**
 * Get template usage statistics
 */
export const getTemplateUsageStats = query({
  args: {
    businessId: v.id("businesses"),
    templateId: v.string(),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days ?? 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const usageEvents = await ctx.db
      .query("audit_logs")
      .withIndex("by_business", (q) => 
        q.eq("businessId", args.businessId as Id<"businesses">)
      )
      .filter((q) => 
        q.and(
          q.eq(q.field("entityType"), "workflow"),
          q.eq(q.field("action"), "created_from_template"),
          q.gt(q.field("createdAt"), cutoff)
        )
      )
      .collect()
      .then(events => events.filter(e => (e.details as any)?.templateId === args.templateId));

    return {
      totalUses: usageEvents.length,
      lastUsed: usageEvents.length > 0 
        ? Math.max(...usageEvents.map((e) => e.createdAt))
        : null,
      usageByDay: usageEvents.reduce((acc, event) => {
        const day = new Date(event.createdAt).toISOString().split("T")[0];
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  },
});