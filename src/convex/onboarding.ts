import { query, mutation } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

type OnboardingStatus = {
  needsOnboarding: boolean;
  nextStep?: "account" | "business" | "tier" | "payment" | "confirm";
  hasBusiness?: boolean;
  tier?: string | null;
  planStatus?: string | null;
};

// Helper to get current user (guest-safe)
async function getCurrentUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.email) return null;
  const user = await ctx.db
    .query("users")
    .withIndex("email", (q: any) => q.eq("email", identity.email))
    .first();
  return user ?? null;
}

// Helper to get business for owner (first one) or null
async function getOwnedBusiness(ctx: any, ownerId: any) {
  const biz = await ctx.db
    .query("businesses")
    .withIndex("by_owner", (q: any) => q.eq("ownerId", ownerId))
    .first();
  return biz ?? null;
}

export const getOnboardingStatus = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user?._id) {
      return { needsOnboarding: false, step: null, trialInfo: null };
    }

    // Check completion status
    const hasName = !!user.name;
    const hasTier = !!user.businessTier;

    const business = await ctx.db
      .query("businesses")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .unique();

    const hasBusinessDetails = business && business.name && business.industry;

    // Determine current step
    let currentStep: "account" | "business" | "tier" | "payment" | "confirm" | null = null;
    let needsOnboarding = false;

    if (!hasName) {
      needsOnboarding = true;
      currentStep = "account";
    } else if (!hasBusinessDetails) {
      needsOnboarding = true;
      currentStep = "business";
    } else if (!hasTier) {
      needsOnboarding = true;
      currentStep = "tier";
    } else if (user.businessTier !== "enterprise" && business?.settings?.plan !== "paid") {
      // Check if payment step needed (non-enterprise without paid plan)
      needsOnboarding = true;
      currentStep = "payment";
    }

    // Trial info
    let trialInfo = null as null | { active: boolean; daysLeft: number; trialEnd: number };
    if (business?.settings?.trialStart && business?.settings?.trialEnd) {
      const now = Date.now();
      const daysLeft = Math.max(
        0,
        Math.ceil((business.settings.trialEnd - now) / (24 * 60 * 60 * 1000)),
      );
      trialInfo = {
        active: now < business.settings.trialEnd,
        daysLeft,
        trialEnd: business.settings.trialEnd,
      };
    }

    return {
      needsOnboarding,
      step: currentStep,
      nextStep: currentStep, // add for compatibility with callers expecting nextStep
      // Add extra fields for callers that expect metadata
      hasBusiness: !!business,
      tier: (user?.businessTier as string | null) ?? ((business?.tier as string) ?? null),
      planStatus: (business?.settings?.status as string) ?? null,
      trialInfo,
      user,
      business,
    };
  },
});

export const upsertAccountBasics = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user?._id) throw new Error("Not authenticated");
    await ctx.db.patch(user._id, { name: args.name });
    return { ok: true as const };
  },
});

export const upsertBusinessBasics = mutation({
  args: {
    name: v.string(),
    industry: v.string(),
    size: v.optional(v.string()),
    website: v.optional(v.string()),
    goals: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user?._id) throw new Error("Not authenticated");

    const existing = await getOwnedBusiness(ctx, user._id);
    const base = {
      name: args.name,
      industry: args.industry,
      size: args.size,
      website: args.website,
      goals: args.goals ?? [],
    } as any;

    if (existing) {
      await ctx.db.patch(existing._id, base);
      return existing._id;
    }

    // Remove invalid `description: undefined` to avoid runtime validation errors
    const businessId = await ctx.db.insert("businesses", {
      ...base,
      ownerId: user._id,
      teamMembers: [],
      businessModel: "saas",
    } as any);
    return businessId;
  },
});

export const selectTier = mutation({
  args: {
    tier: v.union(
      v.literal("solopreneur"),
      v.literal("startup"),
      v.literal("sme"),
      v.literal("enterprise")
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user?._id) throw new Error("Not authenticated");

    // Update user tier
    await ctx.db.patch(user._id, { businessTier: args.tier } as any);

    // Find or create business
    const existing = await ctx.db
      .query("businesses")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .unique();

    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    if (existing) {
      const currentSettings = (existing.settings || {}) as any;

      // Ensure required settings fields exist when patching
      const baseSettings = {
        aiAgentsEnabled: currentSettings.aiAgentsEnabled || [],
        complianceLevel: currentSettings.complianceLevel || "basic",
        dataIntegrations: currentSettings.dataIntegrations || [],
        status: currentSettings.status,
        plan: currentSettings.plan,
        stripeCustomerId: currentSettings.stripeCustomerId,
        stripeSubscriptionId: currentSettings.stripeSubscriptionId,
        trialStart: currentSettings.trialStart,
        trialEnd: currentSettings.trialEnd,
      };

      // Set trial for non-Enterprise tiers if not already set
      const trialSettings =
        args.tier !== "enterprise" && !baseSettings.trialStart
          ? {
              trialStart: now,
              trialEnd: now + sevenDaysMs,
              // Explicit plan/status for trial
              plan: args.tier,
              status: "trial",
            }
          : {
              // For Enterprise or if trial already set, ensure plan aligns
              plan: args.tier,
              // Preserve status if present; if missing and not enterprise, default to "trial"
              status:
                baseSettings.status ??
                (args.tier !== "enterprise" ? "trial" : undefined),
            };

      await ctx.db.patch(existing._id, {
        tier: args.tier,
        settings: {
          ...baseSettings,
          ...trialSettings,
        },
      } as any);

      return { success: true as const, businessId: existing._id };
    } else {
      // Create new business
      const isEnterprise = args.tier === "enterprise";
      const trialSettings = !isEnterprise
        ? {
            trialStart: now,
            trialEnd: now + sevenDaysMs,
            plan: args.tier,
            status: "trial",
          }
        : {
            // Enterprise: no trial; set plan to enterprise and leave status undefined
            plan: args.tier,
          };

      const newBusinessId = await ctx.db.insert("businesses", {
        name: (user.name as string) || "My Business",
        industry: "general",
        ownerId: user._id,
        teamMembers: [user._id],
        tier: args.tier,
        settings: {
          aiAgentsEnabled: [],
          complianceLevel: "basic",
          dataIntegrations: [],
          ...trialSettings,
        },
      } as any);

      return { success: true as const, businessId: newBusinessId };
    }
  },
});

export const finalizeOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user?._id) throw new Error("Not authenticated");
    let biz = await getOwnedBusiness(ctx, user._id);
    if (!biz) {
      throw new Error("Business is required before finalize");
    }
    // Ensure initiative exists (reusing initiatives.upsertForBusiness)
    await ctx.runMutation(api.initiatives.upsertForBusiness, {
      businessId: biz._id,
      name: `${biz.name} Initiative`,
      industry: (biz.industry as string) || "software",
      businessModel: (biz.businessModel as string) || "saas",
    });
    return { ok: true as const, businessId: biz._id };
  },
});

export const completeOnboarding = mutation({
  args: {
    businessId: v.id("businesses"),
    userId: v.id("users"),
    setupData: v.object({
      businessProfile: v.optional(v.any()),
      brandIdentity: v.optional(v.any()),
      socialMedia: v.optional(v.any()),
      emailSetup: v.optional(v.any()),
      aiAgent: v.optional(v.any()),
      templates: v.optional(v.any()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Update business with onboarding data
    await ctx.db.patch(args.businessId, {
      onboardingCompleted: true,
      onboardingData: args.setupData,
    });

    // Create default brand if brand identity was provided
    if (args.setupData.brandIdentity) {
      const existingBrand = await ctx.db
        .query("brands")
        .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
        .first();

      if (!existingBrand) {
        await ctx.db.insert("brands", {
          businessId: args.businessId,
          name: args.setupData.businessProfile?.name || "Default Brand",
          tagline: args.setupData.brandIdentity.tagline || "",
          description: args.setupData.brandIdentity.mission || "",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    // Create default AI agent if configured
    if (args.setupData.aiAgent) {
      const existingAgent = await ctx.db
        .query("aiAgents")
        .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
        .first();

      if (!existingAgent) {
        await ctx.db.insert("aiAgents", {
          businessId: args.businessId,
          name: args.setupData.aiAgent.agentName || "My Assistant",
          type: "custom",
          description: "Your personal AI assistant",
          personality: args.setupData.aiAgent.agentPersonality || "helpful and professional",
          capabilities: Object.keys(args.setupData.aiAgent.capabilities || {}).filter(
            (key) => args.setupData.aiAgent.capabilities[key]
          ),
          status: "active",
          config: {
            model: "gpt-4o-mini",
            temperature: 0.7,
            maxTokens: 2000,
            systemPrompt: "You are a helpful AI assistant.",
            tools: [],
          },
          isTemplate: false,
        });
      }
    }

    return { success: true };
  },
});