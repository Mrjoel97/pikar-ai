import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const seedOrchestrations = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db.query("parallelOrchestrations").first();
    if (existing) {
      return { message: "Orchestrations already seeded" };
    }

    // Seed Parallel Orchestrations
    await ctx.db.insert("parallelOrchestrations", {
      name: "Content Generation Pipeline",
      description: "Generate multiple content pieces simultaneously",
      agents: [
        { agentKey: "content_creator", mode: "proposeNextAction" },
        { agentKey: "exec_assistant", mode: "summarizeIdeas" },
        { agentKey: "analytics_agent", mode: "analyzeData" },
      ],
      isActive: true,
      createdAt: Date.now(),
    });

    await ctx.db.insert("parallelOrchestrations", {
      name: "Multi-Channel Analysis",
      description: "Analyze performance across multiple channels in parallel",
      agents: [
        { agentKey: "social_media_agent", mode: "analyzeData" },
        { agentKey: "email_agent", mode: "analyzeData" },
        { agentKey: "analytics_agent", mode: "summarizeIdeas" },
      ],
      isActive: true,
      createdAt: Date.now(),
    });

    // Seed Chain Orchestrations
    await ctx.db.insert("chainOrchestrations", {
      name: "Content Review & Publish",
      description: "Create, review, and schedule content in sequence",
      chain: [
        { agentKey: "content_creator", mode: "proposeNextAction" },
        { agentKey: "exec_assistant", mode: "summarizeIdeas", inputTransform: "summary" },
        { agentKey: "scheduler", mode: "planWeek", inputTransform: "action" },
      ],
      initialInput: "Create a blog post about AI trends",
      isActive: true,
      createdAt: Date.now(),
    });

    await ctx.db.insert("chainOrchestrations", {
      name: "Strategic Planning Flow",
      description: "Analyze data, generate insights, create action plan",
      chain: [
        { agentKey: "analytics_agent", mode: "analyzeData" },
        { agentKey: "strategy_agent", mode: "proposeNextAction", inputTransform: "summary" },
        { agentKey: "exec_assistant", mode: "planWeek", inputTransform: "action" },
      ],
      initialInput: "Analyze Q4 performance and plan Q1 strategy",
      isActive: true,
      createdAt: Date.now(),
    });

    // Seed Consensus Orchestrations
    await ctx.db.insert("consensusOrchestrations", {
      name: "Strategic Decision Consensus",
      description: "Get multiple perspectives on strategic decisions",
      agents: ["exec_assistant", "strategy_agent", "analytics_agent"],
      question: "What should be our top priority for next quarter?",
      consensusThreshold: 0.6,
      isActive: true,
      createdAt: Date.now(),
    });

    await ctx.db.insert("consensusOrchestrations", {
      name: "Content Direction Consensus",
      description: "Align on content strategy across agents",
      agents: ["content_creator", "social_media_agent", "exec_assistant"],
      question: "What content themes should we focus on this month?",
      consensusThreshold: 0.7,
      isActive: true,
      createdAt: Date.now(),
    });

    return { message: "Orchestrations seeded successfully", count: 6 };
  },
});
