import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Connect a social media account (store OAuth tokens)
 */
export const connectSocialAccount = mutation({
  args: {
    businessId: v.id("businesses"),
    platform: v.union(v.literal("twitter"), v.literal("linkedin"), v.literal("facebook")),
    accountName: v.string(),
    accountId: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("[ERR_NOT_AUTHENTICATED] You must be signed in.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user) {
      throw new Error("[ERR_USER_NOT_FOUND] User not found.");
    }

    const business = await ctx.db.get(args.businessId);
    if (!business) {
      throw new Error("[ERR_BUSINESS_NOT_FOUND] Business not found.");
    }
    if (business.ownerId !== user._id && !business.teamMembers.includes(user._id)) {
      throw new Error("[ERR_FORBIDDEN] Not authorized.");
    }

    // Check if account already exists for this business/platform
    const existing = await ctx.db
      .query("socialAccounts")
      .withIndex("by_business_and_platform", (q) =>
        q.eq("businessId", args.businessId).eq("platform", args.platform)
      )
      .first();

    if (existing) {
      // Update existing account
      await ctx.db.patch(existing._id, {
        accountName: args.accountName,
        accountId: args.accountId,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        tokenExpiresAt: args.tokenExpiresAt,
        isActive: true,
        lastUsedAt: Date.now(),
      });

      await ctx.runMutation(internal.audit.write, {
        businessId: args.businessId,
        action: "social_account_reconnected",
        entityType: "social_account",
        entityId: existing._id,
        details: { platform: args.platform, accountName: args.accountName },
      });

      return existing._id;
    } else {
      // Create new account
      const accountId = await ctx.db.insert("socialAccounts", {
        businessId: args.businessId,
        userId: user._id,
        platform: args.platform,
        accountName: args.accountName,
        accountId: args.accountId,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        tokenExpiresAt: args.tokenExpiresAt,
        isActive: true,
        connectedAt: Date.now(),
      });

      await ctx.runMutation(internal.audit.write, {
        businessId: args.businessId,
        action: "social_account_connected",
        entityType: "social_account",
        entityId: accountId,
        details: { platform: args.platform, accountName: args.accountName },
      });

      return accountId;
    }
  },
});

/**
 * Disconnect a social media account
 */
export const disconnectSocialAccount = mutation({
  args: {
    accountId: v.id("socialAccounts"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("[ERR_NOT_AUTHENTICATED] You must be signed in.");
    }

    const account = await ctx.db.get(args.accountId);
    if (!account) {
      throw new Error("[ERR_ACCOUNT_NOT_FOUND] Account not found.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user) {
      throw new Error("[ERR_USER_NOT_FOUND] User not found.");
    }

    const business = await ctx.db.get(account.businessId);
    if (!business) {
      throw new Error("[ERR_BUSINESS_NOT_FOUND] Business not found.");
    }
    if (business.ownerId !== user._id && !business.teamMembers.includes(user._id)) {
      throw new Error("[ERR_FORBIDDEN] Not authorized.");
    }

    // Soft delete by marking inactive
    await ctx.db.patch(args.accountId, {
      isActive: false,
    });

    await ctx.runMutation(internal.audit.write, {
      businessId: account.businessId,
      action: "social_account_disconnected",
      entityType: "social_account",
      entityId: args.accountId,
      details: { platform: account.platform },
    });

    return true;
  },
});

/**
 * List connected social accounts for a business
 */
export const listConnectedAccounts = query({
  args: {
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    // Guest-safe: return empty array if no businessId
    if (!args.businessId) {
      return [];
    }

    const accounts = await ctx.db
      .query("socialAccounts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Don't expose tokens in query results
    return accounts.map((acc) => ({
      _id: acc._id,
      platform: acc.platform,
      accountName: acc.accountName,
      accountId: acc.accountId,
      connectedAt: acc.connectedAt,
      lastUsedAt: acc.lastUsedAt,
      tokenExpiresAt: acc.tokenExpiresAt,
    }));
  },
});

/**
 * Get account by platform (internal use with tokens)
 */
export const getAccountByPlatform = internalMutation({
  args: {
    businessId: v.id("businesses"),
    platform: v.union(v.literal("twitter"), v.literal("linkedin"), v.literal("facebook")),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query("socialAccounts")
      .withIndex("by_business_and_platform", (q) =>
        q.eq("businessId", args.businessId).eq("platform", args.platform)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    return account;
  },
});