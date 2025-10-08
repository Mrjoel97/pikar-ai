import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

// High-traction industries pool (randomized selection per agent init)
const HIGH_TRACTION_INDUSTRIES: Array<string> = [
  "ecommerce",
  "professional_services", 
  "saas",
  "coaching",
  "real_estate",
  "healthcare",
  "fintech",
  "education",
  "marketing_agency",
  "creators",
];

// Helper: pick one industry deterministically (pseudo-randomized from userId)
function pickIndustry(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const idx = hash % HIGH_TRACTION_INDUSTRIES.length;
  return HIGH_TRACTION_INDUSTRIES[idx];
}

// Initialize the user's Agent Profile and ensure a Business exists
export const initSolopreneurAgent = mutation({
  args: {
    businessId: v.optional(v.id("businesses")),
    brandVoice: v.optional(v.string()),
    timezone: v.optional(v.string()),
    businessSummary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Ensure a business
    let businessId: Id<"businesses"> | null = args.businessId ?? null;
    if (!businessId) {
      const existing = await ctx.db
        .query("businesses")
        .withIndex("by_owner", (q) => q.eq("ownerId", userId))
        .unique()
        .catch(() => null);

      if (existing) {
        businessId = existing._id;
      } else {
        // Create minimal business
        businessId = await ctx.db.insert("businesses", {
          name: "My Business",
          industry: "general",
          ownerId: userId,
          teamMembers: [userId],
          description: "Auto-created by initSolopreneurAgent",
        } as any);
      }
    }

    // Check existing profile
    const existingProfile = await ctx.db
      .query("agentProfiles")
      // Query by business first; then we can reuse the same profile for this user if present
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .unique()
      .catch(() => null);

    const now = Date.now();
    const randomIndustry = pickIndustry(userId as unknown as string);
    const profilePatch = {
      businessId,
      brandVoice: args.brandVoice ?? existingProfile?.brandVoice ?? "casual",
      timezone: args.timezone ?? existingProfile?.timezone ?? "UTC",
      businessSummary:
        args.businessSummary ?? existingProfile?.businessSummary ?? "Solopreneur Agent initialized.",
      industry: existingProfile?.industry ?? randomIndustry,
      lastUpdated: now,
    };

    let profileId: Id<"agentProfiles">;
    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, profilePatch as any);
      profileId = existingProfile._id;
    } else {
      profileId = await ctx.db.insert("agentProfiles", {
        userId,
        preferences: {
          automations: {
            invoicing: false,
            emailDrafts: true,
            socialPosts: true,
          },
        },
        onboardingScore: 0,
        trainingNotes: "",
        ...profilePatch,
      } as any);
    }

    return { ok: true as const, profileId, businessId };
  },
});

// Summarize recent uploads for onboarding preview
export const summarizeUploads = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const limit = Math.min(Math.max(args.limit ?? 5, 1), 20);

    const uploads = await ctx.db
      .query("uploads")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    const results: Array<{
      uploadId: Id<"uploads">;
      filename: string;
      mimeType: string;
      size?: number;
      contentType?: string;
      url: string | null;
      summary: string;
      uploadedAt: number;
    }> = [];

    for (const u of uploads) {
      // Pull storage metadata
      const meta = await ctx.db.system.get(u.fileId);
      const url = await ctx.storage.getUrl(u.fileId);
      const guess = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes("invoice")) return "Likely an invoice document (finance).";
        if (n.includes("policy")) return "Likely a policy or guideline document.";
        if (n.includes("pitch") || n.includes("deck")) return "Likely a pitch or presentation document.";
        if (n.includes("product")) return "Likely a product-related document.";
        return "Quick summary based on filename and type.";
      };
      results.push({
        uploadId: u._id,
        filename: u.filename,
        mimeType: u.mimeType,
        size: (meta as any)?.size,
        contentType: (meta as any)?.contentType,
        url,
        summary: guess(u.filename),
        uploadedAt: u.uploadedAt,
      });
    }

    return results;
  },
});

// Minimal analytics using key_metrics (indexed)
export const runQuickAnalytics = query({
  args: {
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return {
        revenue90d: 0,
        churnAlert: false,
        topProducts: [] as Array<{ name: string; margin: number }>,
        deltas: {
          revenue: 0,
          subscribers: 0,
          engagement: 0,
        },
      };
    }

    // Prefer business metrics if available
    let businessId = args.businessId ?? null;
    if (!businessId) {
      const biz = await ctx.db
        .query("businesses")
        .withIndex("by_owner", (q) => q.eq("ownerId", userId))
        .unique()
        .catch(() => null);
      if (biz) businessId = biz._id;
    }

    // Calculate 7-day deltas for key metrics
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;

    // Helper to calculate delta percentage
    const calculateDelta = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number((((current - previous) / previous) * 100).toFixed(1));
    };

    // Revenue delta calculation
    let revenueDelta = 0;
    if (businessId) {
      const recentRevenue = await ctx.db
        .query("revenueEvents")
        .withIndex("by_business", (q) => q.eq("businessId", businessId!))
        .filter((q) => q.gte(q.field("timestamp"), sevenDaysAgo))
        .collect();
      const previousRevenue = await ctx.db
        .query("revenueEvents")
        .withIndex("by_business", (q) => q.eq("businessId", businessId!))
        .filter((q) => 
          q.and(
            q.gte(q.field("timestamp"), fourteenDaysAgo),
            q.lt(q.field("timestamp"), sevenDaysAgo)
          )
        )
        .collect();
      const recentTotal = recentRevenue.reduce((sum, e) => sum + e.amount, 0);
      const previousTotal = previousRevenue.reduce((sum, e) => sum + e.amount, 0);
      revenueDelta = calculateDelta(recentTotal, previousTotal);
    }

    // Subscribers delta calculation
    let subscribersDelta = 0;
    if (businessId) {
      const recentSubs = await ctx.db
        .query("contacts")
        .withIndex("by_business", (q) => q.eq("businessId", businessId!))
        .filter((q) => 
          q.and(
            q.gte(q.field("createdAt"), sevenDaysAgo),
            q.eq(q.field("status"), "subscribed")
          )
        )
        .collect();
      const previousSubs = await ctx.db
        .query("contacts")
        .withIndex("by_business", (q) => q.eq("businessId", businessId!))
        .filter((q) => 
          q.and(
            q.gte(q.field("createdAt"), fourteenDaysAgo),
            q.lt(q.field("createdAt"), sevenDaysAgo),
            q.eq(q.field("status"), "subscribed")
          )
        )
        .collect();
      subscribersDelta = calculateDelta(recentSubs.length, previousSubs.length);
    }

    // Engagement delta calculation (based on email opens/clicks)
    let engagementDelta = 0;
    if (businessId) {
      const recentCampaigns = await ctx.db
        .query("emailCampaigns")
        .withIndex("by_business_and_status", (q) => 
          q.eq("businessId", businessId!).eq("status", "sent")
        )
        .filter((q) => q.gte(q.field("scheduledAt"), sevenDaysAgo))
        .collect();
      const previousCampaigns = await ctx.db
        .query("emailCampaigns")
        .withIndex("by_business_and_status", (q) => 
          q.eq("businessId", businessId!).eq("status", "sent")
        )
        .filter((q) => 
          q.and(
            q.gte(q.field("scheduledAt"), fourteenDaysAgo),
            q.lt(q.field("scheduledAt"), sevenDaysAgo)
          )
        )
        .collect();
      // Simple engagement metric: number of campaigns sent
      engagementDelta = calculateDelta(recentCampaigns.length, previousCampaigns.length);
    }

    // revenue_90d (prefer business-based metric)
    let revenue90d = 0;
    if (businessId) {
      const rev = await ctx.db
        .query("key_metrics")
        .withIndex("by_business_and_metricKey", (q) =>
          q.eq("businessId", businessId!).eq("metricKey", "revenue_90d"),
        )
        .order("desc")
        .take(1);
      if (rev[0]) revenue90d = rev[0].value;
    } else {
      const rev = await ctx.db
        .query("key_metrics")
        .withIndex("by_user_and_metricKey", (q) =>
          q.eq("userId", userId).eq("metricKey", "revenue_90d"),
        )
        .order("desc")
        .take(1);
      if (rev[0]) revenue90d = rev[0].value;
    }

    // churn_alert from churn_rate_30d metric if present (> 5%)
    let churnAlert = false;
    if (businessId) {
      const churn = await ctx.db
        .query("key_metrics")
        .withIndex("by_business_and_metricKey", (q) =>
          q.eq("businessId", businessId!).eq("metricKey", "churn_rate_30d"),
        )
        .order("desc")
        .take(1);
      churnAlert = !!(churn[0] && churn[0].value > 0.05);
    } else {
      const churn = await ctx.db
        .query("key_metrics")
        .withIndex("by_user_and_metricKey", (q) =>
          q.eq("userId", userId).eq("metricKey", "churn_rate_30d"),
        )
        .order("desc")
        .take(1);
      churnAlert = !!(churn[0] && churn[0].value > 0.05);
    }

    // Top products by margin (placeholder deterministic values until richer metrics exist)
    const topProducts: Array<{ name: string; margin: number }> = [
      { name: "Starter Plan", margin: 0.62 },
      { name: "Consulting Hour", margin: 0.55 },
      { name: "Template Pack", margin: 0.48 },
    ];

    return { 
      revenue90d, 
      churnAlert, 
      topProducts,
      deltas: {
        revenue: revenueDelta,
        subscribers: subscribersDelta,
        engagement: engagementDelta,
      },
    };
  },
});

// Deterministic email triage suggestions for S1 (no external APIs)
export const supportTriageSuggest = action({
  args: {
    subject: v.optional(v.string()),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    // Return suggestions even if unauthenticated (guest demo)
    const text = (args.body || "").toLowerCase();
    const suggestions: Array<{ label: string; reply: string; priority: "low" | "medium" | "high" }> = [];

    if (text.includes("invoice") || text.includes("payment")) {
      suggestions.push({
        label: "Invoice/Payment",
        reply:
          "Thanks for reaching out. I've attached the invoice for your review. Please let me know if you have any questions.",
        priority: "high",
      });
    }
    if (text.includes("meeting") || text.includes("schedule")) {
      suggestions.push({
        label: "Scheduling",
        reply:
          "I'd be happy to meet. Here are two time slots that may work well. Please confirm which you prefer.",
        priority: "medium",
      });
    }
    if (text.includes("support") || text.includes("issue")) {
      suggestions.push({
        label: "Support",
        reply:
          "I'm sorry for the trouble. Could you share a bit more detail and any screenshots? I'll take a look right away.",
        priority: "high",
      });
    }
    if (suggestions.length === 0) {
      suggestions.push({
        label: "General",
        reply:
          "Thanks for your message. I'll review and get back to you shortly with next steps.",
        priority: "low",
      });
    }

    // Optionally log an audit event
    try {
      if (userId) {
        await ctx.runMutation({
          args: {
            businessId: undefined,
            userId,
            action: "agent_triage_suggest",
            entityType: "email",
            entityId: "triage",
            details: { count: suggestions.length },
          },
          name: "audit:write",
        } as any);
      }
    } catch {
      // Best effort; ignore audit failures
    }

    return { suggestions };
  },
});

// Seed a few simple one-click templates for Solopreneurs
export const seedOneClickTemplates = mutation({
  args: {
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Ensure business
    let businessId = args.businessId ?? null;
    if (!businessId) {
      const biz = await ctx.db
        .query("businesses")
        .withIndex("by_owner", (q) => q.eq("ownerId", userId))
        .unique()
        .catch(() => null);
      if (!biz) throw new Error("No business found; initialize via initSolopreneurAgent first.");
      businessId = biz._id;
    }

    const templates = [
      {
        name: "Solopreneur — Launch Post",
        description: "Announce a new offering with a friendly, concise tone.",
        category: "content",
        steps: [
          { type: "draft", role: "content", title: "Draft launch post" },
          { type: "review", role: "owner", title: "Review & tweak" },
          { type: "publish", role: "owner", title: "Publish on socials" },
        ],
        tags: ["solopreneur", "launch", "social"],
      },
      {
        name: "Solopreneur — Weekly Newsletter",
        description: "Lightweight weekly update to nurture your audience.",
        category: "content",
        steps: [
          { type: "outline", role: "content", title: "Outline topics" },
          { type: "draft", role: "content", title: "Draft newsletter" },
          { type: "send", role: "owner", title: "Send via Email Campaigns" },
        ],
        tags: ["solopreneur", "newsletter", "email"],
      },
      {
        name: "Solopreneur — Product Highlight",
        description: "Quick product spotlight with clear CTA.",
        category: "content",
        steps: [
          { type: "draft", role: "content", title: "Draft highlight copy" },
          { type: "review", role: "owner", title: "Review & finalize" },
          { type: "publish", role: "owner", title: "Publish across channels" },
        ],
        tags: ["solopreneur", "product", "cta"],
      },
    ] as const;

    let created = 0;
    for (const t of templates) {
      // Avoid dupes by name
      const exists = await ctx.db
        .query("workflowTemplates")
        .withIndex("by_name", (q) => q.eq("name", t.name))
        .unique()
        .catch(() => null);
      if (!exists) {
        await ctx.db.insert("workflowTemplates", {
          name: t.name,
          description: t.description,
          category: t.category,
          steps: t.steps as any,
          recommendedAgents: ["content"],
          industryTags: HIGH_TRACTION_INDUSTRIES,
          tags: t.tags,
          createdBy: userId,
          createdAt: Date.now(),
          tier: "solopreneur",
        } as any);
        created++;
      }
    }
    return { ok: true as const, created };
  },
});

// Add: forgetUploads mutation to clear user uploads and agent doc refs
export const forgetUploads = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Resolve the user's business (owner)
    const business = await ctx.db
      .query("businesses")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .unique()
      .catch(() => null);

    // If we have a business, clear agent doc refs for that business
    if (business) {
      const profile = await ctx.db
        .query("agentProfiles")
        .withIndex("by_business", (q) => q.eq("businessId", business._id))
        .unique()
        .catch(() => null);

      if (profile) {
        await ctx.db.patch(profile._id, {
          docRefs: [],
          trainingNotes: "",
          lastUpdated: Date.now(),
        } as any);
      }
    }

    // Delete uploads owned by this user (best-effort)
    const toDelete = await ctx.db
      .query("uploads")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const u of toDelete) {
      try {
        await ctx.db.delete(u._id);
      } catch {
        // ignore best-effort failures
      }
    }

    return { ok: true as const, deleted: toDelete.length };
  },
});