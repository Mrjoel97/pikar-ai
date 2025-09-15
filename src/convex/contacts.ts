import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// Helpers
function normalizeEmail(e: string): string {
  return e.trim().toLowerCase();
}

async function getContactByEmail(ctx: any, businessId: any, email: string) {
  return await ctx.db
    .query("contacts")
    .withIndex("by_business_and_email", (q: any) => q.eq("businessId", businessId).eq("email", email))
    .unique()
    .catch(() => null);
}

// Upsert a single contact
export const upsertContact = internalMutation({
  args: {
    businessId: v.id("businesses"),
    email: v.string(),
    name: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    status: v.optional(
      v.union(
        v.literal("subscribed"),
        v.literal("unsubscribed"),
        v.literal("bounced"),
        v.literal("complained")
      )
    ),
    createdBy: v.id("users"),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email);
    const existing = await getContactByEmail(ctx, args.businessId, email);

    if (existing) {
      const mergedTags = Array.from(new Set([...(existing.tags ?? []), ...(args.tags ?? [])]));
      await ctx.db.patch(existing._id, {
        name: args.name ?? existing.name,
        tags: mergedTags,
        status: args.status ?? existing.status,
      });
      return existing._id;
    }

    const contactId = await ctx.db.insert("contacts", {
      businessId: args.businessId,
      email,
      name: args.name ?? undefined,
      tags: args.tags ?? [],
      status: args.status ?? "subscribed",
      source: args.source ?? "manual",
      createdBy: args.createdBy,
      createdAt: Date.now(),
    });
    return contactId;
  },
});

// Create a list
export const createList = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    // Add: tags optional; schema requires array so default to []
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Auth
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

    // RBAC
    const business = await ctx.db.get(args.businessId);
    if (!business) {
      throw new Error("Business not found");
    }
    if (business.ownerId !== user._id && !business.teamMembers.includes(user._id)) {
      throw new Error("Unauthorized");
    }

    // Prevent duplicate name within a business
    const dup = await ctx.db
      .query("contactLists")
      .withIndex("by_business_and_name", (q: any) => q.eq("businessId", args.businessId).eq("name", args.name))
      .unique()
      .catch(() => null);
    if (dup) return dup._id;

    return await ctx.db.insert("contactLists", {
      businessId: args.businessId,
      name: args.name,
      description: args.description,
      createdBy: user._id,
      // Ensure tags always exists
      tags: Array.isArray(args.tags) ? args.tags : [],
      createdAt: Date.now(),
    });
  },
});

// Add many emails to a list (upsert contacts and link members)
export const addContactsToList = internalMutation({
  args: {
    businessId: v.id("businesses"),
    listId: v.id("contactLists"),
    emails: v.array(v.string()),
    createdBy: v.id("users"),
    defaultStatus: v.optional(
      v.union(
        v.literal("subscribed"),
        v.literal("unsubscribed"),
        v.literal("bounced"),
        v.literal("complained")
      )
    ),
    defaultTags: v.optional(v.array(v.string())),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const seen = new Set<string>();
    for (const raw of args.emails) {
      const email = normalizeEmail(raw);
      if (!email || seen.has(email)) continue;
      seen.add(email);

      const contactId = await ctx.runMutation((internal as any).contacts.upsertContact, {
        businessId: args.businessId,
        email,
        createdBy: args.createdBy,
        status: args.defaultStatus ?? "subscribed",
        tags: args.defaultTags ?? [],
        source: args.source ?? "import",
      });

      // Skip if already a member
      const already = await ctx.db
        .query("contactListMembers")
        .withIndex("by_business_and_contact", (q: any) => q.eq("businessId", args.businessId).eq("contactId", contactId))
        .collect();

      const existsInList = already.some((m: any) => m.listId === args.listId);
      if (!existsInList) {
        await ctx.db.insert("contactListMembers", {
          businessId: args.businessId,
          listId: args.listId,
          contactId,
          addedAt: Date.now(),
          addedBy: args.createdBy,
        });
      }
    }
  },
});

// List contacts for a business
export const listContacts = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    return await ctx.db.query("contacts").withIndex("by_business", (q: any) => q.eq("businessId", args.businessId)).collect();
  },
});

// List contact lists for a business
export const listLists = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx, args) => {
    // If businessId is not provided, return an empty list instead of throwing
    if (!args.businessId) {
      return [];
    }
    // Prefer using the composite index for business + name
    try {
      return await ctx.db
        .query("contactLists")
        .withIndex("by_business_and_name", (q: any) => q.eq("businessId", args.businessId))
        .collect();
    } catch {
      // Fallback if index name differs: filter in code (avoid scans when possible)
      const res: any[] = [];
      for await (const row of ctx.db.query("contactLists")) {
        if (row.businessId === args.businessId) res.push(row);
      }
      return res;
    }
  },
});

// Add internal variant that bypasses user auth for scheduled/internal sends
export const getListRecipientEmailsInternal = internalQuery({
  args: { listId: v.id("contactLists") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("contactListMembers")
      .withIndex("by_list", (q) => q.eq("listId", args.listId))
      .collect();

    const emails: string[] = [];
    for (const m of members) {
      const contact = await ctx.db.get(m.contactId);
      if (contact && contact.status === "subscribed") {
        emails.push(contact.email);
      }
    }
    return emails;
  },
});

// Resolve subscribed recipient emails for a list
export const getListRecipientEmails = query({
  args: { listId: v.id("contactLists") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const list = await ctx.db.get(args.listId);
    if (!list) {
      throw new Error("Contact list not found");
    }

    // Resolve members from the junction table
    const members = await ctx.db
      .query("contactListMembers")
      .withIndex("by_list", (q) => q.eq("listId", args.listId))
      .collect();

    const emails: string[] = [];
    for (const m of members) {
      const contact = await ctx.db.get(m.contactId);
      if (contact && contact.status === "subscribed") {
        emails.push(contact.email);
      }
    }

    return emails;
  },
});

// Bulk upload CSV text and add to a list (auto-create list if name provided)
export const bulkUploadCsv = mutation({
  args: {
    businessId: v.id("businesses"),
    listName: v.optional(v.string()),
    contacts: v.array(v.object({
      email: v.string(),
      name: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
    })),
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

    const now = Date.now();
    let listId: Id<"contactLists"> | undefined;

    // Create list if name provided
    if (args.listName) {
      listId = await ctx.db.insert("contactLists", {
        businessId: args.businessId,
        name: args.listName,
        description: `Imported on ${new Date().toLocaleDateString()}`,
        createdBy: user._id,
        createdAt: now,
        tags: ["imported"],
      });
    }

    let added = 0;
    let skipped = 0;

    for (const contact of args.contacts) {
      try {
        // Check if contact already exists in business
        const existing = await ctx.db
          .query("contacts")
          .withIndex("by_business_and_email", (q) => 
            q.eq("businessId", args.businessId).eq("email", contact.email)
          )
          .first();

        if (existing) {
          skipped++;
          continue;
        }

        await ctx.db.insert("contacts", {
          businessId: args.businessId,
          listId,
          email: contact.email,
          name: contact.name || contact.email.split("@")[0],
          tags: contact.tags || [],
          status: "subscribed",
          source: "csv_import",
          createdBy: user._id,
          createdAt: now,
          lastEngagedAt: now,
        });
        added++;
      } catch {
        skipped++;
      }
    }

    return {
      listId,
      added,
      skipped,
      total: args.contacts.length,
    };
  },
});

// Add CSV into an existing list (no new list created)
export const importCsvToList = action({
  args: {
    businessId: v.id("businesses"),
    createdBy: v.id("users"),
    listId: v.id("contactLists"),
    csvText: v.string(),
    defaultTags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const lines = args.csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return { listId: args.listId, added: 0, skipped: 0 };

    // Parse headers if comma present, else assume single-column emails
    let header: string[] = [];
    let startIdx = 0;
    if (lines[0].includes(",")) {
      header = lines[0].split(",").map((h) => h.trim().toLowerCase());
      startIdx = 1;
    }

    const emailIdx = header.length ? header.indexOf("email") : 0;
    const nameIdx = header.length ? header.indexOf("name") : -1;

    const emails: string[] = [];
    const namesByEmail: Record<string, string> = {};

    for (let i = startIdx; i < lines.length; i++) {
      const row = lines[i].split(",");
      const rawEmail = (row[emailIdx] ?? row[0] ?? "").trim();
      if (!rawEmail) continue;

      const email = normalizeEmail(rawEmail);
      if (!email) continue;

      emails.push(email);

      if (nameIdx >= 0) {
        const name = (row[nameIdx] ?? "").trim();
        if (name) namesByEmail[email] = name;
      }
    }

    const uniq = Array.from(new Set(emails));
    let added = 0;
    let skipped = 0;

    for (const email of uniq) {
      try {
        await ctx.runMutation((internal as any).contacts.upsertContact, {
          businessId: args.businessId,
          email,
          name: namesByEmail[email],
          tags: args.defaultTags ?? [],
          createdBy: args.createdBy,
          status: "subscribed",
          source: "import",
        });
        added++;
      } catch {
        skipped++;
      }
    }

    await ctx.runMutation((internal as any).contacts.addContactsToList, {
      businessId: args.businessId,
      listId: args.listId,
      emails: uniq,
      createdBy: args.createdBy,
      defaultStatus: "subscribed",
      defaultTags: args.defaultTags ?? [],
      source: "import",
    });

    return { listId: args.listId, added, skipped };
  },
});

// Optional: seed some contacts for testing
export const seedContacts: any = action({
  args: {
    businessId: v.id("businesses"),
    createdBy: v.id("users"),
    count: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<any> => {
    const count = Math.max(1, Math.min(50, args.count ?? 10));
    const names = ["Ava", "Mason", "Noah", "Liam", "Olivia", "Emma", "Sophia", "Isabella", "Mia", "Charlotte"];
    const emails: string[] = [];
    for (let i = 0; i < count; i++) {
      const name = names[i % names.length];
      emails.push(`${name.toLowerCase()}${i}@example.com`);
    }

    const listId: any = await ctx.runMutation((api as any).contacts.createList, {
      businessId: args.businessId,
      name: "Sample Contacts",
    });

    for (const email of emails) {
      await ctx.runMutation((internal as any).contacts.upsertContact, {
        businessId: args.businessId,
        email,
        name: email.split("@")[0],
        createdBy: args.createdBy,
        status: "subscribed",
        source: "seed",
      });
    }

    await ctx.runMutation((internal as any).contacts.addContactsToList, {
      businessId: args.businessId,
      listId,
      emails,
      createdBy: args.createdBy,
      defaultStatus: "subscribed",
      source: "seed",
    });

    return { ok: true as const, listId, count: emails.length };
  },
});

// In any code path that creates a new contact list (e.g., bulkUploadCsv creating a new list)
// ensure tags is provided as an empty array if not specified.
async function createListIfNeeded(ctx: any, params: { businessId: Id<"businesses">; name: string; description?: string; createdBy: Id<"users"> }) {
  const listId = await ctx.db.insert("contactLists", {
    businessId: params.businessId,
    name: params.name,
    description: params.description,
    createdBy: params.createdBy,
    // Add: required by schema
    tags: [],
    createdAt: Date.now(),
  });
  return listId;
}