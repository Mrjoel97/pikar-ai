import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
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
