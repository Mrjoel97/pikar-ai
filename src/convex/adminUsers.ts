import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Helper to check if user is platform admin
async function isPlatformAdmin(ctx: any): Promise<boolean> {
  const identity = await ctx.auth.getUserIdentity();
  const email = identity?.email?.toLowerCase();
  if (!email) return false;

  const envAllow = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (envAllow.includes(email)) return true;

  const admin = await ctx.db
    .query("admins")
    .withIndex("by_email", (q: any) => q.eq("email", email))
    .unique();
  const role = admin?.role;
  return role === "super_admin" || role === "senior" || role === "admin";
}

// List all users in the system (admin only) - OPTIMIZED
export const listAllUsers = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    searchEmail: v.optional(v.string()),
    filterTier: v.optional(v.string()),
    filterStatus: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("all"))),
    sortBy: v.optional(v.union(v.literal("email"), v.literal("name"), v.literal("tier"), v.literal("createdAt"))),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  handler: async (ctx, args) => {
    const isAdmin = await isPlatformAdmin(ctx);
    if (!isAdmin) return { users: [], total: 0, hasMore: false };

    const limit = Math.min(args.limit ?? 50, 500);
    const offset = args.offset ?? 0;
    
    // Fetch users with efficient batching
    const batchSize = Math.min(offset + limit + 100, 1000);
    let users = await ctx.db.query("users").take(batchSize);
    
    // Filter by email/name search
    if (args.searchEmail) {
      const searchTerm = args.searchEmail.toLowerCase();
      users = users.filter((u: any) => 
        u.email?.toLowerCase().includes(searchTerm) ||
        u.name?.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by tier
    if (args.filterTier && args.filterTier !== "all") {
      users = users.filter((u: any) => u.businessTier === args.filterTier);
    }

    // Filter by status
    if (args.filterStatus && args.filterStatus !== "all") {
      if (args.filterStatus === "active") {
        users = users.filter((u: any) => !u.isAnonymous);
      } else if (args.filterStatus === "inactive") {
        users = users.filter((u: any) => u.isAnonymous);
      }
    }

    // Sort users
    const sortBy = args.sortBy || "createdAt";
    const sortOrder = args.sortOrder || "desc";
    
    users.sort((a: any, b: any) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case "email":
          aVal = (a.email || "").toLowerCase();
          bVal = (b.email || "").toLowerCase();
          break;
        case "name":
          aVal = (a.name || "").toLowerCase();
          bVal = (b.name || "").toLowerCase();
          break;
        case "tier":
          aVal = a.businessTier || "";
          bVal = b.businessTier || "";
          break;
        case "createdAt":
        default:
          aVal = a._creationTime;
          bVal = b._creationTime;
          break;
      }
      
      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    const total = users.length;
    const hasMore = users.length > offset + limit;
    const paginatedUsers = users.slice(offset, offset + limit);

    return {
      users: paginatedUsers.map((u: any) => ({
        _id: u._id,
        email: u.email,
        name: u.name,
        isAnonymous: u.isAnonymous,
        businessTier: u.businessTier,
        _creationTime: u._creationTime,
      })),
      total,
      hasMore,
    };
  },
});

// Get user details (admin only)
export const getUserDetails = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const isAdmin = await isPlatformAdmin(ctx);
    if (!isAdmin) throw new Error("Admin access required");

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // Find businesses this user belongs to
    const businesses = await ctx.db.query("businesses").collect();
    const userBusinesses = businesses.filter((b: any) => 
      String(b.ownerId) === String(args.userId) ||
      (Array.isArray(b.teamMembers) && b.teamMembers.some((m: any) => String(m) === String(args.userId)))
    );

    // Get AI agents for user's businesses
    const agentProfiles = await ctx.db
      .query("agentProfiles")
      .filter((q: any) => 
        q.or(
          ...userBusinesses.map((b: any) => q.eq(q.field("businessId"), b._id))
        )
      )
      .collect();

    // Get active AI agents from catalog
    const aiAgents = await ctx.db
      .query("aiAgents")
      .filter((q: any) => 
        q.or(
          ...userBusinesses.map((b: any) => q.eq(q.field("businessId"), b._id))
        )
      )
      .collect();

    return {
      user,
      businesses: userBusinesses.map((b: any) => ({
        _id: b._id,
        name: b.name,
        tier: b.tier,
        industry: b.industry,
        website: b.website,
        location: b.location,
        description: b.description,
        role: String(b.ownerId) === String(args.userId) ? "owner" : "member",
        limits: b.limits,
        features: b.features,
      })),
      agentProfiles: agentProfiles.map((a: any) => ({
        _id: a._id,
        businessId: a.businessId,
        trainingNotes: a.trainingNotes,
        brandVoice: a.brandVoice,
        lastUpdated: a.lastUpdated,
      })),
      aiAgents: aiAgents.map((a: any) => ({
        _id: a._id,
        name: a.name,
        type: a.type,
        isActive: a.isActive,
        businessId: a.businessId,
      })),
    };
  },
});

// Toggle user account active status
export const toggleUserStatus = mutation({
  args: {
    userId: v.id("users"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const isAdmin = await isPlatformAdmin(ctx);
    if (!isAdmin) throw new Error("Admin access required");

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // Store active status in user metadata
    await ctx.db.patch(args.userId, {
      isAnonymous: args.isActive ? (user.isAnonymous ?? false) : true,
    });

    const identity = await ctx.auth.getUserIdentity();
    const adminEmail = identity?.email || "admin@pikar-ai.com";

    // Log audit event
    await ctx.db.insert("audit_logs", {
      businessId: "system" as any,
      action: args.isActive ? "user_activated" : "user_deactivated",
      entityType: "user",
      entityId: String(args.userId),
      details: {
        userEmail: user.email,
        performedBy: adminEmail,
      },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Update user tier
export const updateUserTier = mutation({
  args: {
    userId: v.id("users"),
    tier: v.string(),
  },
  handler: async (ctx, args) => {
    const isAdmin = await isPlatformAdmin(ctx);
    if (!isAdmin) throw new Error("Admin access required");

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.userId, {
      businessTier: args.tier,
    });

    // Update all user's businesses
    if (user.businessId) {
      await ctx.db.patch(user.businessId, {
        tier: args.tier,
      });
    }

    const identity = await ctx.auth.getUserIdentity();
    const adminEmail = identity?.email || "admin@pikar-ai.com";

    await ctx.db.insert("audit_logs", {
      businessId: "system" as any,
      action: "user_tier_updated",
      entityType: "user",
      entityId: String(args.userId),
      details: {
        userEmail: user.email,
        newTier: args.tier,
        performedBy: adminEmail,
      },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Update AI agent limits for user
export const updateAgentLimits = mutation({
  args: {
    businessId: v.id("businesses"),
    maxAgents: v.number(),
  },
  handler: async (ctx, args) => {
    const isAdmin = await isPlatformAdmin(ctx);
    if (!isAdmin) throw new Error("Admin access required");

    const business = await ctx.db.get(args.businessId);
    if (!business) throw new Error("Business not found");

    const currentLimits = business.limits || {
      maxUsers: 1,
      maxAgents: 3,
      maxWorkflows: 10,
      maxStorage: 1000,
    };

    await ctx.db.patch(args.businessId, {
      limits: {
        ...currentLimits,
        maxAgents: args.maxAgents,
      },
    });

    const identity = await ctx.auth.getUserIdentity();
    const adminEmail = identity?.email || "admin@pikar-ai.com";

    await ctx.db.insert("audit_logs", {
      businessId: args.businessId,
      action: "agent_limits_updated",
      entityType: "business",
      entityId: String(args.businessId),
      details: {
        previousLimit: currentLimits.maxAgents,
        newLimit: args.maxAgents,
        performedBy: adminEmail,
      },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Toggle AI agent for user
export const toggleUserAgent = mutation({
  args: {
    agentId: v.id("aiAgents"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const isAdmin = await isPlatformAdmin(ctx);
    if (!isAdmin) throw new Error("Admin access required");

    const agent = await ctx.db.get(args.agentId);
    if (!agent) throw new Error("Agent not found");

    await ctx.db.patch(args.agentId, {
      isActive: args.isActive,
    });

    const identity = await ctx.auth.getUserIdentity();
    const adminEmail = identity?.email || "admin@pikar-ai.com";

    await ctx.db.insert("audit_logs", {
      businessId: agent.businessId,
      action: args.isActive ? "agent_activated" : "agent_deactivated",
      entityType: "agent",
      entityId: String(args.agentId),
      details: {
        agentName: agent.name,
        performedBy: adminEmail,
      },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Bulk activate/deactivate users
export const bulkToggleUserStatus = mutation({
  args: {
    userIds: v.array(v.id("users")),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const isAdmin = await isPlatformAdmin(ctx);
    if (!isAdmin) throw new Error("Admin access required");

    const results = [];
    for (const userId of args.userIds) {
      try {
        const user = await ctx.db.get(userId);
        if (!user) {
          results.push({ userId, success: false, error: "User not found" });
          continue;
        }

        await ctx.db.patch(userId, {
          isAnonymous: args.isActive ? (user.isAnonymous ?? false) : true,
        });

        results.push({ userId, success: true });
      } catch (error: any) {
        results.push({ userId, success: false, error: error.message });
      }
    }

    const identity = await ctx.auth.getUserIdentity();
    const adminEmail = identity?.email || "admin@pikar-ai.com";

    await ctx.db.insert("audit_logs", {
      businessId: "system" as any,
      action: args.isActive ? "bulk_users_activated" : "bulk_users_deactivated",
      entityType: "user",
      entityId: "bulk",
      details: {
        userCount: args.userIds.length,
        successCount: results.filter(r => r.success).length,
        performedBy: adminEmail,
      },
      createdAt: Date.now(),
    });

    return { results, total: args.userIds.length };
  },
});

// Bulk update user tier
export const bulkUpdateUserTier = mutation({
  args: {
    userIds: v.array(v.id("users")),
    tier: v.string(),
  },
  handler: async (ctx, args) => {
    const isAdmin = await isPlatformAdmin(ctx);
    if (!isAdmin) throw new Error("Admin access required");

    const results = [];
    for (const userId of args.userIds) {
      try {
        const user = await ctx.db.get(userId);
        if (!user) {
          results.push({ userId, success: false, error: "User not found" });
          continue;
        }

        await ctx.db.patch(userId, {
          businessTier: args.tier,
        });

        if (user.businessId) {
          await ctx.db.patch(user.businessId, {
            tier: args.tier,
          });
        }

        results.push({ userId, success: true });
      } catch (error: any) {
        results.push({ userId, success: false, error: error.message });
      }
    }

    const identity = await ctx.auth.getUserIdentity();
    const adminEmail = identity?.email || "admin@pikar-ai.com";

    await ctx.db.insert("audit_logs", {
      businessId: "system" as any,
      action: "bulk_users_tier_updated",
      entityType: "user",
      entityId: "bulk",
      details: {
        userCount: args.userIds.length,
        successCount: results.filter(r => r.success).length,
        newTier: args.tier,
        performedBy: adminEmail,
      },
      createdAt: Date.now(),
    });

    return { results, total: args.userIds.length };
  },
});

// Send email to user(s) via Resend (admin only)
export const sendAdminEmail = mutation({
  args: {
    recipientEmails: v.array(v.string()),
    subject: v.string(),
    htmlContent: v.string(),
    textContent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const isAdmin = await isPlatformAdmin(ctx);
    if (!isAdmin) throw new Error("Admin access required");

    const identity = await ctx.auth.getUserIdentity();
    const adminEmail = identity?.email || "admin@pikar-ai.com";

    // Get system Resend API key
    const resendConfig = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q: any) => q.eq("key", "resendApiKey"))
      .unique();

    if (!resendConfig?.value) {
      throw new Error("Resend API key not configured in admin settings");
    }

    // Schedule email sending action for each recipient
    const internal = require("./_generated/api").internal;
    
    for (const email of args.recipientEmails) {
      await ctx.scheduler.runAfter(0, internal.adminUsersActions.sendEmailViaResend, {
        to: email,
        subject: args.subject,
        html: args.htmlContent,
        text: args.textContent || args.htmlContent.replace(/<[^>]*>/g, ""),
        resendApiKey: resendConfig.value,
        fromEmail: adminEmail,
      });
    }

    // Log audit event
    await ctx.db.insert("audit_logs", {
      businessId: "system" as any,
      action: "admin_email_sent",
      entityType: "email",
      entityId: "bulk",
      details: {
        recipientCount: args.recipientEmails.length,
        subject: args.subject,
        sentBy: adminEmail,
      },
      createdAt: Date.now(),
    });

    return { success: true, recipientCount: args.recipientEmails.length };
  },
});

// NEW: Update business profile details
export const updateBusinessProfile = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.optional(v.string()),
    industry: v.optional(v.string()),
    website: v.optional(v.string()),
    location: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const isAdmin = await isPlatformAdmin(ctx);
    if (!isAdmin) throw new Error("Admin access required");

    const business = await ctx.db.get(args.businessId);
    if (!business) throw new Error("Business not found");

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.industry !== undefined) updates.industry = args.industry;
    if (args.website !== undefined) updates.website = args.website;
    if (args.location !== undefined) updates.location = args.location;
    if (args.description !== undefined) updates.description = args.description;

    await ctx.db.patch(args.businessId, updates);

    const identity = await ctx.auth.getUserIdentity();
    const adminEmail = identity?.email || "admin@pikar-ai.com";

    await ctx.db.insert("audit_logs", {
      businessId: args.businessId,
      action: "business_profile_updated",
      entityType: "business",
      entityId: String(args.businessId),
      details: {
        businessName: business.name,
        updatedFields: Object.keys(updates),
        performedBy: adminEmail,
      },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});