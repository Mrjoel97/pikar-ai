import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Global Search Functionality
 * Cross-tier feature for searching across all entities
 */

// Global search across all entities
export const globalSearch = query({
  args: {
    query: v.string(),
    entityTypes: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user) throw new Error("User not found");

    const businesses = await ctx.db
      .query("businesses")
      .filter((q) =>
        q.or(
          q.eq(q.field("ownerId"), user._id),
          // Fix: teamMembers is an array — use contains
          // Removed unsupported 'contains' on arrays; rely on ownerId guard only
          q.eq(q.field("ownerId"), user._id),
        )
      )
      .collect();

    const businessIds = businesses.map((b) => b._id);
    const searchTerm = args.query.toLowerCase();
    const limit = args.limit || 50;
    const types = args.entityTypes || ["workflows", "contacts", "campaigns", "initiatives", "agents"];

    const results: any[] = [];

    // Search workflows with relevance scoring
    if (types.includes("workflows")) {
      for (const bizId of businessIds) {
        const workflows = await ctx.db
          .query("workflows")
          .withIndex("by_business", (q) => q.eq("businessId", bizId))
          .collect();

        workflows
          .map((w) => {
            const nameMatch = w.name.toLowerCase().includes(searchTerm);
            const descMatch = w.description?.toLowerCase().includes(searchTerm);
            const relevance = nameMatch ? 2 : (descMatch ? 1 : 0);
            return { workflow: w, relevance };
          })
          .filter((item) => item.relevance > 0)
          .sort((a, b) => b.relevance - a.relevance)
          .slice(0, limit)
          .forEach(({ workflow: w }) =>
            results.push({
              type: "workflow",
              id: w._id,
              title: w.name,
              description: w.description,
              createdAt: w._creationTime,
            })
          );
      }
    }

    // Search contacts
    if (types.includes("contacts")) {
      for (const bizId of businessIds) {
        const contacts = await ctx.db
          .query("contacts")
          .withIndex("by_business", (q) => q.eq("businessId", bizId))
          .collect();

        contacts
          .filter((c) =>
            c.name?.toLowerCase().includes(searchTerm) ||
            c.email?.toLowerCase().includes(searchTerm)
          )
          .slice(0, limit)
          .forEach((c) =>
            results.push({
              type: "contact",
              id: c._id,
              title: c.name || c.email,
              // Fix: remove non-existent company field; use email as description
              description: c.email,
              createdAt: c._creationTime,
            })
          );
      }
    }

    // Search campaigns
    if (types.includes("campaigns")) {
      for (const bizId of businessIds) {
        const campaigns = await ctx.db
          .query("emailCampaigns")
          // Fix: use valid index name
          .withIndex("by_business_and_status", (q) => q.eq("businessId", bizId))
          .collect();

        campaigns
          .filter((c) =>
            c.subject?.toLowerCase().includes(searchTerm) ||
            c.previewText?.toLowerCase().includes(searchTerm)
          )
          .slice(0, limit)
          .forEach((c) =>
            results.push({
              type: "campaign",
              id: c._id,
              title: c.subject,
              // Fix: recipients length exists; body/recipientCount do not
              description: `${c.status} - ${(c.recipients?.length ?? 0)} recipients`,
              createdAt: c._creationTime,
            })
          );
      }
    }

    // Search initiatives
    if (types.includes("initiatives")) {
      for (const bizId of businessIds) {
        const initiatives = await ctx.db
          .query("initiatives")
          .withIndex("by_business", (q) => q.eq("businessId", bizId))
          .collect();

        initiatives
          .filter((i) => {
            const nm = (i.name ?? i.title ?? "").toLowerCase();
            return (
              nm.includes(searchTerm) ||
              i.description?.toLowerCase().includes(searchTerm)
            );
          })
          .slice(0, limit)
          .forEach((i) =>
            results.push({
              type: "initiative",
              id: i._id,
              title: i.name ?? i.title ?? "Initiative",
              description: i.description,
              createdAt: i._creationTime,
            })
          );
      }
    }

    // Search AI agents
    if (types.includes("agents")) {
      const agents = await ctx.db.query("aiAgents").collect();
      agents
        .filter((a) => {
          const nm = (a as any).name as string | undefined;
          const desc = a.description as string | undefined;
          return (
            nm?.toLowerCase().includes(searchTerm) ||
            desc?.toLowerCase().includes(searchTerm)
          );
        })
        .slice(0, limit)
        .forEach((a) =>
          results.push({
            type: "agent",
            id: a._id,
            title: (a as any).name ?? "Agent",
            description: a.description,
            createdAt: a._creationTime,
          })
        );
    }

    return results.slice(0, limit);
  },
});

// Save search query
export const saveSearch = mutation({
  args: {
    name: v.string(),
    query: v.string(),
    entityTypes: v.optional(v.array(v.string())),
    filters: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user) throw new Error("User not found");

    return await ctx.db.insert("savedSearches", {
      userId: user._id,
      name: args.name,
      query: args.query,
      entityTypes: args.entityTypes,
      filters: args.filters,
      createdAt: Date.now(),
    });
  },
});

// Get saved searches
export const getSavedSearches = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user) throw new Error("User not found");

    return await ctx.db
      .query("savedSearches")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

// Delete saved search
export const deleteSavedSearch = mutation({
  args: { searchId: v.id("savedSearches") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const search = await ctx.db.get(args.searchId);
    if (!search) throw new Error("Search not found");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user || search.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.searchId);
    return { success: true };
  },
});

// Track search history
export const trackSearch = mutation({
  args: {
    query: v.string(),
    entityTypes: v.optional(v.array(v.string())),
    resultCount: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user) return null;

    return await ctx.db.insert("searchHistory", {
      userId: user._id,
      query: args.query,
      entityTypes: args.entityTypes,
      resultCount: args.resultCount,
      searchedAt: Date.now(),
    });
  },
});

// Get search history
export const getSearchHistory = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user) throw new Error("User not found");

    const history = await ctx.db
      .query("searchHistory")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit || 20);

    return history;
  },
});