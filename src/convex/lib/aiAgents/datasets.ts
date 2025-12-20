import { query } from "../../_generated/server";
import { v } from "convex/values";

// Helper to check admin access without deep type instantiation
async function checkAdminAccess(ctx: any): Promise<boolean> {
  try {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;
    
    // Check if user is admin via direct query
    const adminRecord = await ctx.db
      .query("admins")
      .withIndex("by_email", (q: any) => q.eq("email", identity.email))
      .first();
    
    return adminRecord?.role === "superadmin" || adminRecord?.role === "senior" || adminRecord?.role === "admin";
  } catch {
    return false;
  }
}

export async function adminCreateDataset(ctx: any, args: any) {
  const isAdmin = await checkAdminAccess(ctx);
  if (!isAdmin) throw new Error("Admin access required");
  const identity = await ctx.auth.getUserIdentity();

  const id = await ctx.db.insert("agentDatasets", {
    title: args.title,
    sourceType: args.sourceType,
    sourceUrl: args.sourceUrl,
    noteText: args.noteText,
    fileId: args.fileId,
    linkedAgentKeys: [] as Array<string>,
    businessScope: undefined,
    createdAt: Date.now(),
    createdBy: undefined,
    status: "new",
  });

  await ctx.db.insert("auditLogs", {
    action: "admin_create_dataset",
    entityType: "agentDatasets",
    entityId: id,
    details: { title: args.title, sourceType: args.sourceType, createdBy: identity?.subject || "" },
    timestamp: Date.now(),
  });

  return { datasetId: id };
}

export async function adminListDatasets(ctx: any, args: any) {
  const isAdmin = await checkAdminAccess(ctx);
  if (!isAdmin) return [];
  const limit = Math.max(1, Math.min(args.limit ?? 100, 500));
  const rows = await ctx.db.query("agentDatasets").order("desc").take(limit);
  return rows;
}

export async function adminLinkDatasetToAgent(ctx: any, args: any) {
  const isAdmin = await checkAdminAccess(ctx);
  if (!isAdmin) throw new Error("Admin access required");
  const ds = await ctx.db.get(args.datasetId);
  if (!ds) throw new Error("Dataset not found");
  const linked = new Set<string>(ds.linkedAgentKeys as string[]);
  linked.add(args.agent_key);
  await ctx.db.patch(args.datasetId, { linkedAgentKeys: Array.from(linked) });

  await ctx.db.insert("auditLogs", {
    action: "admin_link_dataset_to_agent",
    entityType: "agentDatasets",
    entityId: args.datasetId,
    details: { agent_key: args.agent_key },
    timestamp: Date.now(),
  });

  return { success: true };
}

export async function adminUnlinkDatasetFromAgent(ctx: any, args: any) {
  const isAdmin = await checkAdminAccess(ctx);
  if (!isAdmin) throw new Error("Admin access required");
  const ds = await ctx.db.get(args.datasetId);
  if (!ds) throw new Error("Dataset not found");
  const filtered = (ds.linkedAgentKeys as string[]).filter((k) => k !== args.agent_key);
  await ctx.db.patch(args.datasetId, { linkedAgentKeys: filtered });

  await ctx.db.insert("auditLogs", {
    action: "admin_unlink_dataset_from_agent",
    entityType: "agentDatasets",
    entityId: args.datasetId,
    details: { agent_key: args.agent_key },
    timestamp: Date.now(),
  });

  return { success: true };
}

export const listDatasets = query({
  args: {},
  handler: async (ctx) => {
    const isAdmin = await checkAdminAccess(ctx);
    if (!isAdmin) return [];
    const rows = await ctx.db.query("agentDatasets").order("desc").take(100);
    return rows;
  },
});