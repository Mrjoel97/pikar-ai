import { defineTable } from "convex/server";
import { v } from "convex/values";

export const vectorsSchema = {
  vectorChunks: defineTable({
    text: v.string(),
    vector: v.array(v.number()),
    sourceId: v.string(),
    sourceType: v.string(),
    metadata: v.any(),
  }).vectorIndex("by_vector", {
    vectorField: "vector",
    dimensions: 1536,
  }),
  
  kgraphNodes: defineTable({
    businessId: v.id("businesses"),
    key: v.string(),
    type: v.string(), // "concept", "entity", "token"
    data: v.any(),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_type_and_key", ["type", "key"]),

  kgraphEdges: defineTable({
    businessId: v.id("businesses"),
    srcNodeId: v.id("kgraphNodes"),
    dstNodeId: v.id("kgraphNodes"),
    relation: v.string(),
    weight: v.number(),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_business_and_src", ["businessId", "srcNodeId"])
    .index("by_business_and_dst", ["businessId", "dstNodeId"]),

  agentDatasets: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    type: v.string(),
    sourceUrl: v.optional(v.string()),
    content: v.optional(v.string()),
    status: v.string(),
    vectorId: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"]),
};