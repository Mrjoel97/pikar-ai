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
  handler: async (ctx): Promise<OnboardingStatus> => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      // Guest/unauthenticated: no onboarding prompt here
      return { needsOnboarding: false };
    }

    const business = user._id ? await getOwnedBusiness(ctx, user._id) : null;

    // Determine missing steps
    const missingAccount = !user.name || user.name.trim().length === 0;

    const missingBusinessBasics =
      !business ||
      !business.name ||
      !business.industry ||
      (business.teamMembers && !Array.isArray(business.teamMembers));

    const tier = (user as any).businessTier ?? (business as any)?.tier ?? null;
    const missingTier = !tier;

    // Payment: Phase 1 stub (we don’t enforce it yet)
    const needsPayment = false;

    if (missingAccount) {
      return {
        needsOnboarding: true,
        nextStep: "account",
        hasBusiness: !!business,
        tier: tier ?? null,
        planStatus: null,
      };
    }
    if (missingBusinessBasics) {
      return {
        needsOnboarding: true,
        nextStep: "business",
        hasBusiness: !!business,
        tier: tier ?? null,
        planStatus: null,
      };
    }
    if (missingTier) {
      return {
        needsOnboarding: true,
        nextStep: "tier",
        hasBusiness: !!business,
        tier: null,
        planStatus: null,
      };
    }
    if (needsPayment) {
      return {
        needsOnboarding: true,
        nextStep: "payment",
        hasBusiness: !!business,
        tier: tier ?? null,
        planStatus: null,
      };
    }

    // All set; can confirm/finalize (idempotent) or proceed
    return {
      needsOnboarding: false,
      nextStep: "confirm",
      hasBusiness: !!business,
      tier: tier ?? null,
      planStatus: null,
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

    const businessId = await ctx.db.insert("businesses", {
      ...base,
      ownerId: user._id,
      teamMembers: [],
      description: undefined,
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
    // Update user’s tier
    await ctx.db.patch(user._id, { businessTier: args.tier } as any);
    // If business exists, reflect the tier for UX
    const biz = await getOwnedBusiness(ctx, user._id);
    if (biz?._id) {
      await ctx.db.patch(biz._id, { tier: args.tier } as any);
    }
    return { ok: true as const };
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
