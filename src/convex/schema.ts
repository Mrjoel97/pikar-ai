// ... keep existing code (imports and other tables)

  customApis: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    path: v.string(),
    method: v.union(
      v.literal("GET"),
      v.literal("POST"),
      v.literal("PUT"),
      v.literal("DELETE"),
      v.literal("PATCH")
    ),
    authentication: v.union(
      v.literal("none"),
      v.literal("api_key"),
      v.literal("bearer_token")
    ),
    requestSchema: v.optional(v.string()),
    responseSchema: v.optional(v.string()),
    handler: v.object({
      type: v.union(
        v.literal("query"),
        v.literal("mutation"),
        v.literal("action")
      ),
      functionRef: v.string(),
      paramMapping: v.optional(v.string()),
    }),
    rateLimit: v.optional(v.object({
      enabled: v.boolean(),
      requestsPerMinute: v.number(),
    })),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    callCount: v.number(),
    lastCalledAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_business_and_path", ["businessId", "path"])
    .index("by_business_and_active", ["businessId", "isActive"]),

// ... keep existing code (rest of schema)
