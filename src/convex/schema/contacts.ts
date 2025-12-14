import { defineTable } from "convex/server";
import { v } from "convex/values";

export const contactsSchema = {
  contacts: defineTable({
    businessId: v.id("businesses"),
    email: v.string(),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("lead"),
      v.literal("active"),
      v.literal("customer"),
      v.literal("churned"),
      v.literal("subscribed"),
      v.literal("bounced"),
      v.literal("unsubscribed"),
      v.literal("complained")
    )),
    source: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    customFields: v.optional(v.any()),
    lastEngagedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    engagement: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
  })
    .index("by_business", ["businessId"])
    .index("by_email", ["email"])
    .index("by_status", ["status"])
    .index("by_business_and_email", ["businessId", "email"])
    .index("by_business_and_name", ["businessId", "name"]),

  contactLists: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    contactCount: v.number(),
    tags: v.optional(v.array(v.string())),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_business", ["businessId"]),
  
  contactListMembers: defineTable({
    contactId: v.id("contacts"),
    listId: v.id("contactLists"),
    businessId: v.id("businesses"),
    addedBy: v.optional(v.id("users")),
    addedAt: v.number(),
  })
    .index("by_list", ["listId"])
    .index("by_business_and_contact", ["businessId", "contactId"]),
};