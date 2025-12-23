import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { internal } from "./_generated/api";

// Admin-gated mutation to ingest nodes/edges from a dataset
export const adminIngestFromDataset = mutation({
  args: { datasetId: v.id("agentDatasets"), businessId: v.id("businesses") },
  handler: async (ctx, args): Promise<any> => {
>>>>>>> REPLACE
<<<<<<< SEARCH
export const neighborhood = query({
  args: {
    type: v.string(),
    key: v.string(),
    businessId: v.optional(v.id("businesses")),
    depth: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
=======
export const neighborhood = query({
  args: {
    type: v.string(),
    key: v.string(),
    businessId: v.optional(v.id("businesses")),
    depth: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<any> => {
    // RBAC check
    const isAdmin = await ctx.runQuery(api.admin.getIsAdmin, {});
    if (!isAdmin) {
      throw new Error("Admin access required");
    }

    // Get the dataset
    const dataset = await ctx.db.get(args.datasetId);
    if (!dataset) {
      throw new Error("Dataset not found");
    }

    const businessId = args.businessId; // Use arg

    // Create main dataset node
    const datasetNodeId = await ctx.db.insert("kgraphNodes", {
      businessId,
      type: "dataset",
      key: dataset._id, // Use ID
      data: {
        type: "dataset",
        summary: `Dataset: ${dataset._id}`,
      },
      createdAt: Date.now(),
    });

    let tokenNodes = [];
    let edgeCount = 0;

    // Extract tokens from content and create nodes/edges
    const content = dataset.content || "";
    const tokens = extractTokens(content);
    
    for (const token of tokens.slice(0, 50)) { // Limit to 50 tokens
      // Create or find token node
      // Replace direct filtered query to avoid equality against undefined businessId
      let nodeQ = ctx.db
        .query("kgraphNodes")
        .withIndex("by_type_and_key", (q) => q.eq("type", "token").eq("key", token));
      if (businessId) {
        nodeQ = nodeQ.filter((q) => q.eq(q.field("businessId"), businessId));
      }
      const existingNode = await nodeQ.first();

      let tokenNodeId;
      if (existingNode) {
        tokenNodeId = existingNode._id;
      } else {
        tokenNodeId = await ctx.db.insert("kgraphNodes", {
          businessId,
          type: "token",
          key: token,
          data: {
             summary: `Token: ${token}`,
          },
          createdAt: Date.now(),
        });
      }

      // Create edge from dataset to token
      await ctx.db.insert("kgraphEdges", {
        businessId,
        srcNodeId: datasetNodeId,
        dstNodeId: tokenNodeId,
        relation: "mentions",
        weight: 1.0,
        createdAt: Date.now(),
      });

      tokenNodes.push(tokenNodeId);
      edgeCount++;
    }

    // Audit log (only if businessId exists)
    if (businessId) {
      await ctx.runMutation(internal.audit.write, {
        businessId,
        action: "kgraph_ingest",
        entityType: "kgraph",
        // Convert Id to string for audit entityId
        entityId: String(args.datasetId),
        details: {
          // datasetTitle: dataset.title, // Commented out
          nodesCreated: tokenNodes.length + 1,
          edgesCreated: edgeCount,
        },
      });
    }

    return {
      datasetNodeId,
      tokenNodes,
      edgeCount,
      nodesCreated: tokenNodes.length + 1,
    };
  },
});

// Query to get neighborhood around a node
export const neighborhood = query({
  args: {
    type: v.string(),
    key: v.string(),
    businessId: v.optional(v.id("businesses")),
    depth: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const depth = Math.min(args.depth || 1, 3);
    const limit = Math.min(args.limit || 25, 100);

    // Early guard to avoid invalid index equality with undefined businessId
    if (!args.businessId) {
      return { nodes: [], edges: [], summary: "businessId required" };
    }

    // Find the root node
    const rootNode = await ctx.db
      .query("kgraphNodes")
      .withIndex("by_type_and_key", (q) => q.eq("type", args.type).eq("key", args.key))
      .filter((q) => q.eq(q.field("businessId"), args.businessId))
      .first();

    if (!rootNode) {
      return { nodes: [], edges: [], summary: "Node not found" };
    }

    const nodes = [rootNode];
    const edges = [];
    const visitedNodes = new Set([rootNode._id]);

    // BFS traversal
    let currentLevel = [rootNode._id];
    
    for (let d = 0; d < depth && currentLevel.length > 0; d++) {
      const nextLevel = [];
      
      for (const nodeId of currentLevel) {
        // Get outgoing edges
        const outEdges = await ctx.db
          .query("kgraphEdges")
          .withIndex("by_business_and_src", (q) => 
            q.eq("businessId", args.businessId as any).eq("srcNodeId", nodeId)
          )
          .take(limit);

        // Get incoming edges
        const inEdges = await ctx.db
          .query("kgraphEdges")
          .withIndex("by_business_and_dst", (q) => 
            q.eq("businessId", args.businessId as any).eq("dstNodeId", nodeId)
          )
          .take(limit);

        const allEdges = [...outEdges, ...inEdges];
        
        for (const edge of allEdges.slice(0, limit)) {
          edges.push(edge);
          
          // Add connected nodes
          const connectedNodeId = edge.srcNodeId === nodeId ? edge.dstNodeId : edge.srcNodeId;
          
          if (!visitedNodes.has(connectedNodeId)) {
            const connectedNode = await ctx.db.get(connectedNodeId);
            if (connectedNode) {
              nodes.push(connectedNode);
              visitedNodes.add(connectedNodeId);
              nextLevel.push(connectedNodeId);
            }
          }
        }
      }
      
      currentLevel = nextLevel.slice(0, limit);
    }

    const summary = `Found ${nodes.length} nodes and ${edges.length} edges around ${args.type}:${args.key}`;

    return { nodes: nodes.slice(0, limit), edges: edges.slice(0, limit), summary };
  },
});

// Helper function to extract simple tokens
function extractTokens(text: string): string[] {
  if (!text) return [];
  
  // Simple tokenization - extract words, URLs, and meaningful phrases
  const tokens = new Set<string>();
  
  // Extract URLs
  const urlRegex = /https?:\/\/[^\s]+/g;
  const urls = text.match(urlRegex) || [];
  urls.forEach(url => tokens.add(url));
  
  // Extract words (3+ characters)
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 3 && word.length <= 50);
  
  words.forEach(word => tokens.add(word));
  
  // Extract quoted phrases
  const phrases: string[] = text.match(/"([^"]+)"/g) || [];
  phrases.forEach(phrase => {
    const clean = phrase.replace(/"/g, '').trim();
    if (clean.length >= 3) tokens.add(clean);
  });
  
  return Array.from(tokens).slice(0, 100); // Limit tokens
}