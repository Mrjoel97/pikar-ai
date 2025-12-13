import { v } from "convex/values";
import { query, mutation } from "../_generated/server";

/**
 * Get data lineage for a dataset
 */
export const getDataLineage = query({
  args: {
    businessId: v.id("businesses"),
    datasetId: v.string(),
  },
  handler: async (ctx, args) => {
    // Mock lineage graph
    return {
      nodes: [
        { id: "source-1", type: "source", name: "CRM Database", level: 0 },
        { id: "transform-1", type: "transformation", name: "Data Cleaning", level: 1 },
        { id: "transform-2", type: "transformation", name: "Aggregation", level: 2 },
        { id: "target-1", type: "target", name: "Analytics Warehouse", level: 3 },
      ],
      edges: [
        { from: "source-1", to: "transform-1", label: "Extract" },
        { from: "transform-1", to: "transform-2", label: "Transform" },
        { from: "transform-2", to: "target-1", label: "Load" },
      ],
      metadata: {
        datasetId: args.datasetId,
        lastUpdated: Date.now(),
        recordCount: 125000,
        transformations: 2,
      },
    };
  },
});

/**
 * Track data transformation
 */
export const trackDataTransformation = mutation({
  args: {
    businessId: v.id("businesses"),
    sourceId: v.string(),
    targetId: v.string(),
    transformationType: v.string(),
    metadata: v.any(),
  },
  handler: async (ctx, args) => {
    // Store transformation tracking
    return {
      transformationId: "transform-" + Date.now(),
      timestamp: Date.now(),
    };
  },
});

/**
 * Get lineage graph for visualization
 */
export const getLineageGraph = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    return {
      nodes: [
        { id: "1", data: { label: "Source: CRM" }, position: { x: 0, y: 0 }, type: "input" },
        { id: "2", data: { label: "Clean Data" }, position: { x: 200, y: 0 }, type: "default" },
        { id: "3", data: { label: "Aggregate" }, position: { x: 400, y: 0 }, type: "default" },
        { id: "4", data: { label: "Warehouse" }, position: { x: 600, y: 0 }, type: "output" },
      ],
      edges: [
        { id: "e1-2", source: "1", target: "2", animated: true },
        { id: "e2-3", source: "2", target: "3", animated: true },
        { id: "e3-4", source: "3", target: "4", animated: true },
      ],
    };
  },
});
