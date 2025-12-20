import { mutation } from "../../_generated/server";
import { v } from "convex/values";

export const adminCreateAgent = mutation({
  args: {
    agent_key: v.string(),
    display_name: v.string(),
    short_desc: v.string(),
    long_desc: v.optional(v.string()),
    capabilities: v.array(v.string()),
    default_model: v.string(),
    tier_restrictions: v.array(v.string()),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check admin access
    const adminRecord = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", identity.email || ""))
      .first();

    if (!adminRecord || !["superadmin", "senior", "admin"].includes(adminRecord.role)) {
      throw new Error("Admin access required");
    }

    // Check if agent_key already exists
    const existing = await ctx.db
      .query("agentCatalog")
      .collect()
      .then(agents => agents.find(a => a.agent_key === args.agent_key));

    if (existing) {
      throw new Error("Agent with this key already exists");
    }

    // Create the agent
    const agentId = await ctx.db.insert("agentCatalog", {
      agent_key: args.agent_key,
      display_name: args.display_name,
      short_desc: args.short_desc,
      long_desc: args.long_desc || "",
      capabilities: args.capabilities,
      default_model: args.default_model,
      tier_restrictions: args.tier_restrictions,
      active: args.active,
      confidence_hint: 0.8,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Audit log - using a placeholder businessId since this is a system-level agent
    const systemBusinessId = "system" as any; // System-level agents don't belong to a specific business
    await ctx.db.insert("audit_logs", {
      businessId: systemBusinessId,
      action: "admin_create_agent",
      entityType: "agentCatalog",
      entityId: agentId as string,
      details: {
        agent_key: args.agent_key,
        display_name: args.display_name,
        createdBy: identity.email || "",
      },
      createdAt: Date.now(),
    });

    return agentId;
  },
});
