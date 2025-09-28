import { api } from "../../_generated/api";

export async function adminCreateDataset(ctx: any, args: any) {
  const isAdmin = await ctx.runQuery(api.admin.getIsAdmin, {});
  if (!isAdmin) throw new Error("Admin access required");
  const identity = await ctx.auth.getUserIdentity();

  const id = await ctx.db.insert("agentDatasets", {
    title: args.title,
    sourceType: args.sourceType,
    sourceUrl: args.sourceUrl,
    noteText: args.noteText,
    linkedAgentKeys: [] as Array<string>,
    businessScope: undefined,
    createdAt: Date.now(),
    createdBy: undefined,
    status: "new",
  });

  await ctx.runMutation(api.audit.write as any, {
    action: "admin_create_dataset",
    entityType: "agentDatasets",
    entityId: id,
    details: { title: args.title, sourceType: args.sourceType, createdBy: identity?.subject || "" },
  });

  return { datasetId: id };
}

export async function adminListDatasets(ctx: any, args: any) {
  const isAdmin = await ctx.runQuery(api.admin.getIsAdmin, {});
  if (!isAdmin) return [];
  const limit = Math.max(1, Math.min(args.limit ?? 100, 500));
  const rows = await ctx.db.query("agentDatasets").order("desc").take(limit);
  return rows;
}

export async function adminLinkDatasetToAgent(ctx: any, args: any) {
  const isAdmin = await ctx.runQuery(api.admin.getIsAdmin, {});
  if (!isAdmin) throw new Error("Admin access required");
  const ds = await ctx.db.get(args.datasetId);
  if (!ds) throw new Error("Dataset not found");
  const linked = new Set<string>(ds.linkedAgentKeys as string[]);
  linked.add(args.agent_key);
  await ctx.db.patch(args.datasetId, { linkedAgentKeys: Array.from(linked) });

  await ctx.runMutation(api.audit.write as any, {
    action: "admin_link_dataset_to_agent",
    entityType: "agentDatasets",
    entityId: args.datasetId,
    details: { agent_key: args.agent_key },
  });

  return { success: true };
}

export async function adminUnlinkDatasetFromAgent(ctx: any, args: any) {
  const isAdmin = await ctx.runQuery(api.admin.getIsAdmin, {});
  if (!isAdmin) throw new Error("Admin access required");
  const ds = await ctx.db.get(args.datasetId);
  if (!ds) throw new Error("Dataset not found");
  const filtered = (ds.linkedAgentKeys as string[]).filter((k) => k !== args.agent_key);
  await ctx.db.patch(args.datasetId, { linkedAgentKeys: filtered });

  await ctx.runMutation(api.audit.write as any, {
    action: "admin_unlink_dataset_from_agent",
    entityType: "agentDatasets",
    entityId: args.datasetId,
    details: { agent_key: args.agent_key },
  });

  return { success: true };
}
