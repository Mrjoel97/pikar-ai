import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";
import { internal } from "./_generated/api";

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
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
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
    });

    // Audit
    await ctx.runMutation(internal.audit.write, {
      businessId: args.businessId,
      type: "initiative.create",
      message: "Initiative created",
      actorUserId: user._id,
      data: { initiativeId, name: args.name ?? null },
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
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
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
      type: "initiative.update_onboarding",
      message: "Onboarding profile updated",
      actorUserId: user._id,
      data: { initiativeId: args.initiativeId },
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
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
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
      type: "initiative.advance_phase",
      message: `Initiative phase advanced to ${args.toPhase}`,
      actorUserId: user._id,
      data: { initiativeId: args.initiativeId, from: currentPhase, to: args.toPhase },
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
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
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
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
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

      // Audit creation
      await ctx.runMutation(internal.audit.write, {
        businessId: args.businessId,
        type: "initiative.create",
        message: "Initiative created (during diagnostics)",
        actorUserId: user._id,
        data: { initiativeId },
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
      type: "diagnostics.run",
      message: "Phase 0 diagnostics run",
      actorUserId: user._id,
      data: { diagnosticId, initiativeId: initiative._id },
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
      .withIndex("by_email", (q) => q.eq("email", args.email))
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

      // Audit
      await ctx.runMutation(internal.audit.write, {
        businessId: businessId,
        type: "business.create",
        message: "Business created (seed)",
        actorUserId: user._id,
        data: { seeded: true },
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

      // Audit
      await ctx.runMutation(internal.audit.write, {
        businessId: business._id,
        type: "initiative.create",
        message: "Initiative created (seed)",
        actorUserId: user._id,
        data: { initiativeId },
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

    // Audit
    await ctx.runMutation(internal.audit.write, {
      businessId: business._id,
      type: "diagnostics.run",
      message: "Diagnostics seeded",
      actorUserId: user._id,
      data: { diagnosticId },
    });

    // Advance to phase 1
    if (initiative) {
      await ctx.db.patch(initiative._id, { currentPhase: 1, updatedAt: Date.now() });

      await ctx.runMutation(internal.audit.write, {
        businessId: business._id,
        type: "initiative.advance_phase",
        message: "Initiative advanced to phase 1 (seed)",
        actorUserId: user._id,
        data: { initiativeId: initiative._id, to: 1 },
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
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
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

    const now = Date.now();
    const id = await ctx.db.insert("brainDumps", {
      businessId: initiative.businessId,
      initiativeId: args.initiativeId,
      userId: user._id,
      content: args.content,
      createdAt: now,
      updatedAt: now,
      title: args.title,
    });

    await ctx.runMutation(internal.audit.write as any, {
      businessId: initiative.businessId,
      type: "initiative.brain_dump_create",
      message: "Brain dump created",
      actorUserId: user._id,
      data: { initiativeId: args.initiativeId, brainDumpId: id },
    });

    return id;
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
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
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
    businessId: v.id("businesses"),
    initiativeId: v.id("initiatives"),
    content: v.string(),
    transcript: v.optional(v.string()),
    summary: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();
    const _id = await ctx.db.insert("brainDumps", {
      businessId: args.businessId,
      initiativeId: args.initiativeId,
      userId,
      content: args.content.trim(),
      voice: true,
      transcript: args.transcript,
      summary: args.summary,
      tags: args.tags ?? [],
      createdAt: now,
      updatedAt: now,
      title: undefined,
    } as any);
    return { ok: true as const, _id };
  },
});

// Add: Delete a Brain Dump entry (ownership check)
export const deleteBrainDump = mutation({
  args: { brainDumpId: v.id("brainDumps") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.brainDumpId);
    if (!existing) throw new Error("Brain dump not found");
    if ((existing as any).userId !== userId) throw new Error("Not authorized");

    await ctx.db.delete(args.brainDumpId);
    return { ok: true as const };
  },
});

// Optional: Tag-aware listing (keeps index on initiative and filters tags client-side)
export const listBrainDumpsByInitiativeWithTags = query({
  args: {
    initiativeId: v.id("initiatives"),
    tag: v.optional(v.string()),
  },
  handler: async (ctx, { initiativeId, tag }) => {
    const results = await ctx.db
      .query("brainDumps")
      .withIndex("by_initiative", (q) => q.eq("initiativeId", initiativeId))
      .order("desc")
      .take(200);

    if (!tag) return results;
    return results.filter((r) => (r.tags ?? []).includes(tag));
  },
});