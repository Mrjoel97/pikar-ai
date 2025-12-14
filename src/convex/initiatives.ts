import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Create a new initiative
 */
export const createInitiative = mutation({
  args: {
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("planning"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("on_hold")
    )),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    )),
    startDate: v.optional(v.number()),
    targetDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const initiativeId = await ctx.db.insert("initiatives", {
      businessId: args.businessId,
      title: args.title,
      description: args.description,
      status: args.status || "planning",
      priority: args.priority || "medium",
      startDate: args.startDate,
      targetDate: args.targetDate,
      completedAt: undefined,
      createdAt: Date.now(),
    });

    return initiativeId;
  },
});

/**
 * Get initiatives for a business
 */
export const getInitiatives = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const initiatives = await ctx.db
      .query("initiatives")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .collect();

    return initiatives;
  },
});

/**
 * Update initiative status
 */
export const updateInitiativeStatus = mutation({
  args: {
    initiativeId: v.id("initiatives"),
    status: v.union(
      v.literal("planning"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("on_hold")
    ),
  },
  handler: async (ctx, args) => {
    const updates: any = {
      status: args.status,
    };

    if (args.status === "completed") {
      updates.completedAt = Date.now();
    }

    await ctx.db.patch(args.initiativeId, updates);
    return { success: true };
  },
});

/**
 * Delete an initiative
 */
export const deleteInitiative = mutation({
  args: {
    initiativeId: v.id("initiatives"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.initiativeId);
    return { success: true };
  },
});

export const upsertForBusiness = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.optional(v.string()),
    industry: v.optional(v.string()), 
    businessModel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("[ERR_NOT_AUTHENTICATED] You must be signed in.");
    }

    const user = await ctx.db
      .query("users")
      // Use the standardized "email" index (Convex Auth expects this)
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) {
      throw new Error("[ERR_USER_NOT_FOUND] User not found.");
    }

    const business = await ctx.db.get(args.businessId);
    if (!business) {
      throw new Error("[ERR_BUSINESS_NOT_FOUND] Business not found.");
    }

    // RBAC: Check if user is owner or team member
    if (business.ownerId !== user._id && !business.teamMembers.includes(user._id)) {
      throw new Error("[ERR_FORBIDDEN] Not authorized to access this business.");
    }

    // Check if initiative already exists for this business
    const existing = await ctx.db
      .query("initiatives")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .first();

    if (existing) {
      return existing;
    }

    // Create new initiative with defaults
    const initiativeId = await ctx.db.insert("initiatives", {
      businessId: args.businessId,
      name: args.name || `${business.name} Initiative`,
      industry: args.industry || business.industry || "software",
      businessModel: args.businessModel || business.businessModel || "saas",
      status: "active",
      currentPhase: 0,
      ownerId: business.ownerId,
      onboardingProfile: {
        industry: args.industry || business.industry || "software",
        businessModel: args.businessModel || business.businessModel || "saas",
        goals: [],
      },
      featureFlags: ["journey.phase0_onboarding", "journey.phase1_discovery_ai"],
      updatedAt: Date.now(),
      createdAt: Date.now(),
    });

    // Audit
    await ctx.runMutation(internal.audit.write, {
      businessId: args.businessId,
      action: "initiative.create",
      entityType: "initiative",
      entityId: String(initiativeId),
      details: {
        message: "Initiative created",
        actorUserId: user._id,
        name: args.name ?? null,
      },
    });

    return await ctx.db.get(initiativeId);
  },
});

export const updateOnboarding = mutation({
  args: {
    initiativeId: v.id("initiatives"),
    profile: v.object({
      industry: v.string(),
      businessModel: v.string(),
      goals: v.array(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("[ERR_NOT_AUTHENTICATED] You must be signed in.");
    }

    const user = await ctx.db
      .query("users")
      // Use the standardized "email" index (Convex Auth expects this)
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) {
      throw new Error("[ERR_USER_NOT_FOUND] User not found.");
    }

    const initiative = await ctx.db.get(args.initiativeId);
    if (!initiative) {
      throw new Error("[ERR_INITIATIVE_NOT_FOUND] Initiative not found.");
    }

    const business = await ctx.db.get(initiative.businessId);
    if (!business) {
      throw new Error("[ERR_BUSINESS_NOT_FOUND] Business not found.");
    }

    // RBAC: Check if user is owner or team member
    if (business.ownerId !== user._id && !business.teamMembers.includes(user._id)) {
      throw new Error("[ERR_FORBIDDEN] Not authorized to update this initiative.");
    }

    await ctx.db.patch(args.initiativeId, {
      onboardingProfile: args.profile,
      industry: args.profile.industry,
      businessModel: args.profile.businessModel,
      updatedAt: Date.now(),
    });

    // Audit
    await ctx.runMutation(internal.audit.write, {
      businessId: business._id,
      action: "initiative.update_onboarding",
      entityType: "initiative",
      entityId: String(args.initiativeId),
      details: {
        message: "Onboarding profile updated",
        actorUserId: user._id,
      },
    });

    return await ctx.db.get(args.initiativeId);
  },
});

export const advancePhase = mutation({
  args: {
    initiativeId: v.id("initiatives"),
    toPhase: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("[ERR_NOT_AUTHENTICATED] You must be signed in.");
    }

    const user = await ctx.db
      .query("users")
      // Use the standardized "email" index (Convex Auth expects this)
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) {
      throw new Error("[ERR_USER_NOT_FOUND] User not found.");
    }

    const initiative = await ctx.db.get(args.initiativeId);
    if (!initiative) {
      throw new Error("[ERR_INITIATIVE_NOT_FOUND] Initiative not found.");
    }

    const business = await ctx.db.get(initiative.businessId);
    if (!business) {
      throw new Error("[ERR_BUSINESS_NOT_FOUND] Business not found.");
    }

    // RBAC: Check if user is owner or team member
    if (business.ownerId !== user._id && !business.teamMembers.includes(user._id)) {
      throw new Error("[ERR_FORBIDDEN] Not authorized to update this initiative.");
    }

    // Validate phase advancement (can only advance by 1 or stay same)
    const currentPhase = initiative.currentPhase ?? 0;
    if (args.toPhase > currentPhase + 1 || args.toPhase < currentPhase) {
      throw new Error("[ERR_INVALID_PHASE] Invalid phase transition.");
    }

    await ctx.db.patch(args.initiativeId, {
      currentPhase: args.toPhase,
      updatedAt: Date.now(),
    });

    // Audit
    await ctx.runMutation(internal.audit.write, {
      businessId: business._id,
      action: "initiative.advance_phase",
      entityType: "initiative",
      entityId: String(args.initiativeId),
      details: {
        message: `Initiative phase advanced to ${args.toPhase}`,
        actorUserId: user._id,
        from: currentPhase,
        to: args.toPhase,
      },
    });

    return await ctx.db.get(args.initiativeId);
  },
});

export const getByBusiness = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      // Use the standardized "email" index (Convex Auth expects this)
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) {
      throw new Error("User not found");
    }

    const business = await ctx.db.get(args.businessId);
    if (!business) {
      throw new Error("Business not found");
    }

    // RBAC
    if (business.ownerId !== user._id && !business.teamMembers.includes(user._id)) {
      throw new Error("Not authorized to access this business");
    }

    // Return a LIST instead of unique to match frontend expectations
    const list = await ctx.db
      .query("initiatives")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    // Ensure safe defaults so UI can read onboardingProfile fields without crashing
    return list.map((i) => ({
      ...i,
      onboardingProfile: i.onboardingProfile ?? {
        industry: i.industry ?? "software",
        businessModel: i.businessModel ?? "saas",
        // Fix TS: ensure goals is an array using any-cast on possible legacy shape
        goals: Array.isArray((i as any).onboardingProfile?.goals)
          ? (i as any).onboardingProfile!.goals
          : [],
      },
      currentPhase: i.currentPhase ?? 0,
    }));
  },
});

export const runPhase0Diagnostics = mutation({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("[ERR_NOT_AUTHENTICATED] You must be signed in.");
    }

    const user = await ctx.db
      .query("users")
      // Use the standardized "email" index (Convex Auth expects this)
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) {
      throw new Error("[ERR_USER_NOT_FOUND] User not found.");
    }

    // Ensure initiative exists WITHOUT calling same-file mutation through api.*
    let initiative = await ctx.db
      .query("initiatives")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .first();

    if (!initiative) {
      const business = await ctx.db.get(args.businessId);
      if (!business) {
        throw new Error("[ERR_BUSINESS_NOT_FOUND] Business not found.");
      }

      const initiativeId = await ctx.db.insert("initiatives", {
        businessId: args.businessId,
        name: `${business.name} Initiative`,
        industry: (business.industry as string) || "software",
        businessModel: (business.businessModel as string) || "saas",
        status: "active",
        currentPhase: 0,
        ownerId: business.ownerId,
        onboardingProfile: {
          industry: (business.industry as string) || "software",
          businessModel: (business.businessModel as string) || "saas",
          goals: [],
        },
        featureFlags: ["journey.phase0_onboarding", "journey.phase1_discovery_ai"],
        updatedAt: Date.now(),
      });
      initiative = await ctx.db.get(initiativeId);

      // Audit creation (fixed args)
      await ctx.runMutation(internal.audit.write, {
        businessId: args.businessId,
        action: "initiative.create",
        entityType: "initiative",
        entityId: String(initiativeId),
        details: {
          message: "Initiative created (during diagnostics)",
          actorUserId: user._id,
        },
      });
    }

    if (!initiative) {
      throw new Error("[ERR_INITIATIVE_CREATE_FAILED] Failed to create or get initiative.");
    }

    // Create a diagnostics record directly to avoid circular api references
    const diagnosticId = await ctx.db.insert("diagnostics", {
      businessId: args.businessId,
      createdBy: user._id,
      phase: "discovery",
      inputs: {
        goals: initiative.onboardingProfile?.goals ?? [],
        signals: {},
      },
      outputs: {
        tasks: [],
        workflows: [],
        kpis: {
          targetROI: 0,
          targetCompletionRate: 0,
        },
      },
      runAt: Date.now(),
    });

    // Audit diagnostics
    await ctx.runMutation(internal.audit.write, {
      businessId: args.businessId,
      action: "diagnostics.run",
      entityType: "diagnostics",
      entityId: String(diagnosticId),
      details: {
        message: "Phase 0 diagnostics run",
        actorUserId: user._id,
        initiativeId: initiative._id,
      },
    });

    return diagnosticId;
  },
});

export const seedForEmail = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();
    
    if (!user) {
      throw new Error("[ERR_USER_NOT_FOUND] User not found.");
    }

    // Find or create business for user
    let business = await ctx.db
      .query("businesses")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .first();

    if (!business) {
      const businessId = await ctx.db.insert("businesses", {
        name: "Sample Business",
        industry: "software",
        size: "1-10",
        ownerId: user._id,
        teamMembers: [],
        description: "A sample business for testing",
        businessModel: "saas",
        goals: ["Increase revenue", "Improve efficiency"],
        challenges: ["Market competition", "Resource constraints"],
        currentSolutions: ["Manual processes"],
      });
      business = await ctx.db.get(businessId);

      // After creating business
      await ctx.runMutation(internal.audit.write, {
        businessId: businessId,
        action: "business.create",
        entityType: "business",
        entityId: String(businessId),
        details: {
          message: "Business created (seed)",
          actorUserId: user._id,
          seeded: true,
        },
      });
    }

    if (!business) {
      throw new Error("[ERR_BUSINESS_CREATE_FAILED] Failed to create business.");
    }

    // Ensure initiative exists (direct, no api.* to same file)
    let initiative = await ctx.db
      .query("initiatives")
      .withIndex("by_business", (q) => q.eq("businessId", business._id))
      .first();

    if (!initiative) {
      const initiativeId = await ctx.db.insert("initiatives", {
        businessId: business._id,
        name: "Growth Initiative",
        industry: "software",
        businessModel: "saas",
        status: "active",
        currentPhase: 0,
        ownerId: business.ownerId,
        onboardingProfile: {
          industry: "software",
          businessModel: "saas",
          goals: [],
        },
        featureFlags: ["journey.phase0_onboarding", "journey.phase1_discovery_ai"],
        updatedAt: Date.now(),
      });
      initiative = await ctx.db.get(initiativeId);

      // After creating initiative
      await ctx.runMutation(internal.audit.write, {
        businessId: business._id,
        action: "initiative.create",
        entityType: "initiative",
        entityId: String(initiativeId),
        details: {
          message: "Initiative created (seed)",
          actorUserId: user._id,
        },
      });
    }

    // Run diagnostics directly
    const diagnosticId = await ctx.db.insert("diagnostics", {
      businessId: business._id,
      createdBy: user._id,
      phase: "discovery",
      inputs: {
        goals: initiative?.onboardingProfile?.goals ?? [],
        signals: {},
      },
      outputs: {
        tasks: [],
        workflows: [],
        kpis: {
          targetROI: 0,
          targetCompletionRate: 0,
        },
      },
      runAt: Date.now(),
    });

    // After creating diagnostics
    await ctx.runMutation(internal.audit.write, {
      businessId: business._id,
      action: "diagnostics.run",
      entityType: "diagnostics",
      entityId: String(diagnosticId),
      details: {
        message: "Diagnostics seeded",
        actorUserId: user._id,
      },
    });

    // Advance to phase 1
    if (initiative) {
      await ctx.db.patch(initiative._id, { currentPhase: 1, updatedAt: Date.now() });

      // After advancing initiative phase
      await ctx.runMutation(internal.audit.write, {
        businessId: business._id,
        action: "initiative.advance_phase",
        entityType: "initiative",
        entityId: String(initiative._id),
        details: {
          message: "Initiative advanced to phase 1 (seed)",
          actorUserId: user._id,
          to: 1,
        },
      });
    }

    return {
      businessId: business._id,
      initiativeId: initiative?._id,
      diagnosticId,
    };
  },
});

// Command to run: npx convex run initiatives:seedForEmail '{"email":"joel.feruzi@gmail.com"}'

export const addBrainDump = mutation({
  args: {
    initiativeId: v.id("initiatives"),
    content: v.string(),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("[ERR_NOT_AUTHENTICATED] You must be signed in.");

    const user = await ctx.db
      .query("users")
      // Use the standardized "email" index (Convex Auth expects this)
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user) throw new Error("[ERR_USER_NOT_FOUND] User not found.");

    const initiative = await ctx.db.get(args.initiativeId);
    if (!initiative) throw new Error("[ERR_INITIATIVE_NOT_FOUND] Initiative not found.");

    const business = await ctx.db.get(initiative.businessId);
    if (!business) throw new Error("[ERR_BUSINESS_NOT_FOUND] Business not found.");

    // RBAC: owner or team member
    if (business.ownerId !== user._id && !business.teamMembers.includes(user._id)) {
      throw new Error("[ERR_FORBIDDEN] Not authorized to add brain dump for this initiative.");
    }

    // Insert brain dump with safe defaults
    const dumpId = await ctx.db.insert("brainDumps", {
      businessId: initiative.businessId,
      initiativeId: args.initiativeId,
      userId: user._id,
      content: args.content,
      title: args.title,
      transcript: undefined,
      summary: undefined,
      tags: [],
      voice: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as any);

    // Schedule vector ingestion (summary-first fallback not applicable here; use content)
    try {
      const contentForEmbedding = args.content.slice(0, 2000);
      await ctx.scheduler.runAfter(0, internal.vectors.ingestFromInitiatives, {
        businessId: initiative.businessId,
        content: contentForEmbedding,
        agentKeys: ["exec_assistant"],
        meta: {
          source: "brain_dump",
          dumpId,
          tags: [],
          title: args.title,
        },
      });
    } catch (e) {
      // best-effort
    }

    return dumpId;
  },
});

export const listBrainDumpsByInitiative = query({
  args: {
    initiativeId: v.id("initiatives"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      // Use the standardized "email" index (Convex Auth expects this)
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user) throw new Error("User not found");

    const initiative = await ctx.db.get(args.initiativeId);
    if (!initiative) throw new Error("Initiative not found");

    const business = await ctx.db.get(initiative.businessId);
    if (!business) throw new Error("Business not found");

    // RBAC: owner or team member
    if (business.ownerId !== user._id && !business.teamMembers.includes(user._id)) {
      throw new Error("Not authorized to access this initiative");
    }

    const lim = Math.max(1, Math.min(args.limit ?? 20, 100));

    const rows = await ctx.db
      .query("brainDumps")
      .withIndex("by_initiative", (q) => q.eq("initiativeId", args.initiativeId))
      .order("desc")
      .take(lim);

    return rows;
  },
});

// Voice-friendly Brain Dump write that includes transcript/summary (stored inline) and optional tags
export const addVoiceBrainDump = mutation({
  args: {
    initiativeId: v.id("initiatives"),
    content: v.string(),
    transcript: v.optional(v.string()),
    summary: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;

    const initiative = await ctx.db.get(args.initiativeId);
    if (!initiative) throw new Error("Initiative not found");

    const dumpId = await ctx.db.insert("brainDumps", {
      businessId: initiative.businessId,
      initiativeId: args.initiativeId,
      userId,
      content: args.transcript ?? "",
      transcript: args.transcript ?? "",
      summary: args.summary,
      tags: args.tags ?? [],
      voice: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as any);

    try {
      const contentForEmbedding = (args.summary && args.summary.trim().length > 0
        ? args.summary
        : (args.transcript ?? "")).slice(0, 2000);

      if (contentForEmbedding.length > 0) {
        await ctx.scheduler.runAfter(0, internal.vectors.ingestFromInitiatives, {
          businessId: initiative.businessId,
          content: contentForEmbedding,
          agentKeys: ["exec_assistant"],
          meta: {
            source: "voice_brain_dump",
            dumpId,
            tags: args.tags ?? [],
            summary: args.summary,
            channel: "voice",
          },
        });
      }
    } catch (e) {
      // best-effort
    }

    return dumpId;
  },
});

// Persist Voice Note as a Brain Dump with tags
export const addVoiceNote = mutation({
  args: {
    businessId: v.id("businesses"),
    initiativeId: v.id("initiatives"),
    transcript: v.string(),
    summary: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;

    const dumpId = await ctx.db.insert("brainDumps", {
      businessId: args.businessId,
      initiativeId: args.initiativeId,
      userId,
      content: args.transcript ?? "",
      transcript: args.transcript ?? "",
      summary: args.summary,
      tags: args.tags ?? [],
      voice: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as any);

    try {
      const contentForEmbedding = (args.summary && args.summary.trim().length > 0
        ? args.summary
        : (args.transcript ?? "")).slice(0, 2000);

      if (contentForEmbedding.length > 0) {
        await ctx.scheduler.runAfter(0, internal.vectors.ingestFromInitiatives, {
          businessId: args.businessId,
          content: contentForEmbedding,
          agentKeys: ["exec_assistant"],
          meta: {
            source: "voice_note",
            dumpId,
            tags: args.tags ?? [],
            summary: args.summary,
            channel: "voice",
          },
        });
      }
    } catch (e) {
      // best-effort
    }

    return dumpId;
  },
});

// Delete a Brain Dump (voice note or normal), only by owner
export const deleteBrainDump = mutation({
  args: { brainDumpId: v.id("brainDumps") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const doc = await ctx.db.get(args.brainDumpId);
    if (!doc) throw new Error("Not found");
    if (doc.userId !== identity.subject) throw new Error("Not authorized");

    await ctx.db.delete(args.brainDumpId);
    return { ok: true as const };
  },
});

// List brain dumps filtered by initiative and optional tag
// Uses indexes to avoid full scans: by_initiative primary, by_tags when tag provided
export const listBrainDumpsFiltered = query({
  args: {
    initiativeId: v.id("initiatives"),
    tag: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 100, 1), 500);

    if (args.tag) {
      // Tag filter: fetch by initiative (indexed) then filter by tag client-side
      const rows = await ctx.db
        .query("brainDumps")
        .withIndex("by_initiative", (q) => q.eq("initiativeId", args.initiativeId))
        .order("desc")
        .take(500);

      return rows
        .filter((r) => Array.isArray((r as any).tags) && (r as any).tags.includes(args.tag!))
        .slice(0, limit);
    }

    // Initiative index
    const rows = await ctx.db
      .query("brainDumps")
      .withIndex("by_initiative", (q) => q.eq("initiativeId", args.initiativeId))
      .order("desc")
      .take(limit);

    return rows;
  },
});

// Soft-delete (mark as deleted)
export const softDeleteBrainDump = mutation({
  args: { brainDumpId: v.id("brainDumps") },
  handler: async (ctx, { brainDumpId }) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Not authenticated");
    const dump = await ctx.db.get(brainDumpId);
    if (!dump) return;
    // authorization: owner only
    if (String(dump.userId) !== String(userId.subject)) throw new Error("Forbidden");
    await ctx.db.patch(brainDumpId, {
      deletedAt: Date.now(),
      deletedBy: dump.userId,
    });
  },
});

// Restore (clear soft-delete)
export const restoreBrainDump = mutation({
  args: { brainDumpId: v.id("brainDumps") },
  handler: async (ctx, { brainDumpId }) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Not authenticated");
    const dump = await ctx.db.get(brainDumpId);
    if (!dump) return;
    // authorization: owner only
    if (String(dump.userId) !== String(userId.subject)) throw new Error("Forbidden");
    await ctx.db.patch(brainDumpId, { deletedAt: undefined, deletedBy: undefined });
  },
});

// Update tags on a single brain dump
export const updateBrainDumpTags = mutation({
  args: { brainDumpId: v.id("brainDumps"), tags: v.array(v.string()) },
  handler: async (ctx, { brainDumpId, tags }) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Not authenticated");
    const dump = await ctx.db.get(brainDumpId);
    if (!dump) throw new Error("Not found");
    if (String(dump.userId) !== String(userId.subject)) throw new Error("Forbidden");
    await ctx.db.patch(brainDumpId, { tags });
  },
});

// Merge tags across an initiative: replace fromTag with toTag
export const mergeTagsForInitiative = mutation({
  args: { initiativeId: v.id("initiatives"), fromTag: v.string(), toTag: v.string() },
  handler: async (ctx, { initiativeId, fromTag, toTag }) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Not authenticated");
    const q = ctx.db
      .query("brainDumps")
      .withIndex("by_initiative", (idx) => idx.eq("initiativeId", initiativeId));
    for await (const d of q) {
      const tags: string[] = Array.isArray(d.tags) ? d.tags : [];
      if (tags.includes(fromTag)) {
        const next = Array.from(new Set(tags.map((t) => (t === fromTag ? toTag : t))));
        await ctx.db.patch(d._id, { tags: next });
      }
    }
  },
});

// Search brain dumps by text and optional tags (excludes soft-deleted)
export const searchBrainDumps = query({
  args: {
    initiativeId: v.id("initiatives"),
    q: v.string(),
    tags: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { initiativeId, q, tags, limit }) => {
    const needle = q.toLowerCase().trim();
    const rows: any[] = [];
    const it = ctx.db
      .query("brainDumps")
      .withIndex("by_initiative", (idx) => idx.eq("initiativeId", initiativeId));
    for await (const d of it) {
      if (d.deletedAt) continue;
      const hay = `${d.content ?? ""}\n${d.transcript ?? ""}\n${d.summary ?? ""}`.toLowerCase();
      if (needle && !hay.includes(needle)) continue;
      if (tags && tags.length > 0) {
        const dt = Array.isArray(d.tags) ? d.tags : [];
        if (!tags.every((t) => dt.includes(t))) continue;
      }
      rows.push(d);
      if (limit && rows.length >= limit) break;
    }
    return rows;
  },
});

// Get initiatives with voice notes
export const getInitiativesWithVoiceNotes = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const initiatives = await ctx.db
      .query("initiatives")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const initiativesWithNotes = await Promise.all(
      initiatives.map(async (initiative) => {
        const voiceNotes = await ctx.db
          .query("voiceNotes")
          .withIndex("by_initiative", (q) => q.eq("initiativeId", initiative._id))
          .collect();

        return {
          ...initiative,
          voiceNotesCount: voiceNotes.length,
          voiceNotes: voiceNotes.slice(0, 3),
        };
      })
    );

    return initiativesWithNotes;
  },
});

// Get voice note analytics for initiatives
export const getInitiativeVoiceNoteAnalytics = query({
  args: { initiativeId: v.id("initiatives") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const voiceNotes = await ctx.db
      .query("voiceNotes")
      .withIndex("by_initiative", (q) => q.eq("initiativeId", args.initiativeId))
      .collect();

    const totalNotes = voiceNotes.length;
    const totalDuration = voiceNotes.reduce((sum, note) => sum + note.duration, 0);
    const avgDuration = totalNotes > 0 ? totalDuration / totalNotes : 0;

    return {
      totalNotes,
      totalDuration,
      avgDuration,
      recentNotes: voiceNotes.slice(0, 5),
    };
  },
});

/**
 * Enhanced search with AI-powered tagging
 */
export const searchBrainDumpsEnhanced = query({
  args: {
    initiativeId: v.id("initiatives"),
    q: v.string(),
    tags: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let dumps = await ctx.db
      .query("brainDumps")
      .withIndex("by_initiative", (q) => q.eq("initiativeId", args.initiativeId))
      .filter((q) => q.eq(q.field("deleted"), false))
      .order("desc")
      .collect();

    // Filter by search query
    if (args.q) {
      const query = args.q.toLowerCase();
      dumps = dumps.filter((d) => d.content.toLowerCase().includes(query));
    }

    // Filter by tags
    if (args.tags && args.tags.length > 0) {
      dumps = dumps.filter((d) => 
        d.tags && d.tags.some((tag) => args.tags!.includes(tag))
      );
    }

    return dumps.slice(0, args.limit || 20);
  },
});

/**
 * Get brain dump analytics
 */
export const getBrainDumpAnalytics = query({
  args: {
    initiativeId: v.id("initiatives"),
  },
  handler: async (ctx, args) => {
    const dumps = await ctx.db
      .query("brainDumps")
      .withIndex("by_initiative", (q) => q.eq("initiativeId", args.initiativeId))
      .filter((q) => q.eq(q.field("deleted"), false))
      .collect();

    const tagCounts: Record<string, number> = {};
    for (const dump of dumps) {
      if (dump.tags) {
        for (const tag of dump.tags) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      }
    }

    return {
      total: dumps.length,
      byTag: tagCounts,
      recentCount: dumps.filter((d) => d._creationTime > Date.now() - 7 * 24 * 60 * 60 * 1000).length,
    };
  },
});