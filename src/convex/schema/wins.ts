import { defineTable } from "convex/server";
import { v } from "convex/values";

export const winsSchema = {
  wins: defineTable({
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.optional(v.string()),
    impact: v.optional(v.string()),
    timeSaved: v.optional(v.number()), // minutes
    category: v.optional(v.union(
      v.literal("automation"),
      v.literal("revenue"),
      v.literal("efficiency"),
      v.literal("customer"),
      v.literal("other")
    )),
    date: v.number(),
  })
  .index("by_business", ["businessId"])
  .index("by_business_and_date", ["businessId", "date"]),
};