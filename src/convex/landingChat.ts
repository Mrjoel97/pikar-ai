"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { internal } from "./_generated/api";

/**
 * Landing Page Chatbot - Pre-sales support and product information
 */
export const sendMessage: any = action({
  args: {
    message: v.string(),
    conversationHistory: v.optional(v.array(v.any())),
  },
  handler: async (ctx: any, args): Promise<any> => {
    const startTime = Date.now();
    
    try {
      const { message, conversationHistory = [] } = args;

      // System prompt with Pikar AI product information
      const systemPrompt = `You are a helpful AI assistant for Pikar AI, an AI-powered business automation platform.

Key Product Information:
- Pikar AI offers workflow automation, AI agents, and business intelligence across 4 tiers
- Solopreneur ($99/mo): 3 AI agents, content creation, marketing automation, 15+ hours saved/week
- Startup ($297/mo): 10 AI agents, team collaboration, 3x lead generation, data-driven insights
- SME ($597/mo): Unlimited agents, multi-department orchestration, 95%+ compliance automation
- Enterprise (Custom): Global operations, white-label, custom AI agents, API access

Core Features:
- AI-Powered Content Generation (social media, emails, blogs)
- Customer Segmentation & Insights
- Workflow Automation & Orchestration
- Team Collaboration Tools
- Advanced Analytics & Reporting
- Compliance & Governance (SME+)
- Enterprise Security & Data Warehousing

Your role:
- Answer questions about features, pricing, and capabilities
- Help users understand which tier fits their needs
- Provide clear, concise, and helpful responses
- Be friendly and professional
- If unsure, suggest they contact sales or try the free demo

Keep responses concise (2-3 sentences) unless more detail is requested.`;

      // Build conversation context
      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...conversationHistory.slice(-6), // Keep last 6 messages for context
        { role: "user" as const, content: message },
      ];

      try {
        // Use OpenAI to generate response
        const prompt = messages.map(m => `${m.role}: ${m.content}`).join("\n\n");
        
        const response = await ctx.runAction(api.openai.generate, {
          prompt,
          model: "gpt-4o-mini",
          temperature: 0.7,
          maxTokens: 300,
        });

        const assistantMessage = (response as any)?.text || "I'm here to help! Could you please rephrase your question?";

        const responseTime = Date.now() - startTime;
        
        // Record successful execution
        await ctx.runMutation(internal.agentPerformance.recordExecution, {
          agentKey: "landing_chat",
          status: "success" as const,
          responseTime,
        });

        return {
          message: assistantMessage,
          success: true,
        };
      } catch (error: any) {
        const responseTime = Date.now() - startTime;
        
        // Record failed execution
        await ctx.runMutation(internal.agentPerformance.recordExecution, {
          agentKey: "landing_chat",
          status: "failure" as const,
          responseTime,
          errorMessage: error.message,
        });

        throw error;
      }
    } catch (error) {
      console.error("Landing chat error:", error);
      
      // Fallback response if OpenAI fails
      return {
        message: "I'm here to help you learn about Pikar AI! We offer AI-powered business automation across 4 tiers (Solopreneur, Startup, SME, Enterprise). What would you like to know about our features, pricing, or capabilities?",
        success: false,
        error: String(error).slice(0, 200),
      };
    }
  },
});