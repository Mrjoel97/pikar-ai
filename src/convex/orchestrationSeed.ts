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

    let totalSeeded = 0;

    // PARALLEL ORCHESTRATIONS - 40 total (10 per tier)
    const parallelOrchestrations = [
      // SOLOPRENEUR TIER (10)
      {
        name: "Quick Social Media Blast",
        description: "Generate content for multiple social platforms simultaneously",
        agents: [
          { agentKey: "content_creator", mode: "proposeNextAction" },
          { agentKey: "social_media_agent", mode: "analyzeData" },
        ],
        tier: "solopreneur",
      },
      {
        name: "Email & Blog Combo",
        description: "Create email newsletter and blog post in parallel",
        agents: [
          { agentKey: "email_agent", mode: "proposeNextAction" },
          { agentKey: "content_creator", mode: "proposeNextAction" },
        ],
        tier: "solopreneur",
      },
      {
        name: "Multi-Channel Analytics",
        description: "Analyze performance across all channels at once",
        agents: [
          { agentKey: "analytics_agent", mode: "analyzeData" },
          { agentKey: "social_media_agent", mode: "analyzeData" },
          { agentKey: "email_agent", mode: "analyzeData" },
        ],
        tier: "solopreneur",
      },
      {
        name: "Content Ideation Sprint",
        description: "Generate multiple content ideas simultaneously",
        agents: [
          { agentKey: "content_creator", mode: "summarizeIdeas" },
          { agentKey: "exec_assistant", mode: "summarizeIdeas" },
        ],
        tier: "solopreneur",
      },
      {
        name: "Weekly Planning Boost",
        description: "Plan content and schedule for the week in parallel",
        agents: [
          { agentKey: "scheduler", mode: "planWeek" },
          { agentKey: "content_creator", mode: "planWeek" },
        ],
        tier: "solopreneur",
      },
      {
        name: "Quick Market Research",
        description: "Gather insights from multiple sources simultaneously",
        agents: [
          { agentKey: "analytics_agent", mode: "analyzeData" },
          { agentKey: "strategy_agent", mode: "analyzeData" },
        ],
        tier: "solopreneur",
      },
      {
        name: "Social Listening Sweep",
        description: "Monitor multiple social channels for mentions and trends",
        agents: [
          { agentKey: "social_media_agent", mode: "analyzeData" },
          { agentKey: "analytics_agent", mode: "summarizeIdeas" },
        ],
        tier: "solopreneur",
      },
      {
        name: "Content Repurposing Engine",
        description: "Transform one piece of content into multiple formats",
        agents: [
          { agentKey: "content_creator", mode: "proposeNextAction" },
          { agentKey: "social_media_agent", mode: "proposeNextAction" },
          { agentKey: "email_agent", mode: "proposeNextAction" },
        ],
        tier: "solopreneur",
      },
      {
        name: "Daily Task Optimizer",
        description: "Optimize and prioritize daily tasks across domains",
        agents: [
          { agentKey: "exec_assistant", mode: "proposeNextAction" },
          { agentKey: "scheduler", mode: "planWeek" },
        ],
        tier: "solopreneur",
      },
      {
        name: "Performance Dashboard Update",
        description: "Update all performance metrics in parallel",
        agents: [
          { agentKey: "analytics_agent", mode: "analyzeData" },
          { agentKey: "exec_assistant", mode: "summarizeIdeas" },
        ],
        tier: "solopreneur",
      },

      // STARTUP TIER (10)
      {
        name: "Team Content Pipeline",
        description: "Coordinate content creation across team members",
        agents: [
          { agentKey: "content_creator", mode: "proposeNextAction" },
          { agentKey: "exec_assistant", mode: "summarizeIdeas" },
          { agentKey: "strategy_agent", mode: "analyzeData" },
        ],
        tier: "startup",
      },
      {
        name: "Multi-Department Sync",
        description: "Synchronize updates across sales, marketing, and ops",
        agents: [
          { agentKey: "sales_agent", mode: "analyzeData" },
          { agentKey: "marketing_agent", mode: "analyzeData" },
          { agentKey: "ops_agent", mode: "analyzeData" },
        ],
        tier: "startup",
      },
      {
        name: "Campaign Launch Coordinator",
        description: "Launch campaigns across multiple channels simultaneously",
        agents: [
          { agentKey: "social_media_agent", mode: "proposeNextAction" },
          { agentKey: "email_agent", mode: "proposeNextAction" },
          { agentKey: "content_creator", mode: "proposeNextAction" },
          { agentKey: "analytics_agent", mode: "analyzeData" },
        ],
        tier: "startup",
      },
      {
        name: "Customer Feedback Aggregator",
        description: "Collect and analyze feedback from multiple sources",
        agents: [
          { agentKey: "support_agent", mode: "analyzeData" },
          { agentKey: "analytics_agent", mode: "summarizeIdeas" },
          { agentKey: "strategy_agent", mode: "proposeNextAction" },
        ],
        tier: "startup",
      },
      {
        name: "Growth Metrics Dashboard",
        description: "Track and analyze all growth metrics in parallel",
        agents: [
          { agentKey: "analytics_agent", mode: "analyzeData" },
          { agentKey: "sales_agent", mode: "analyzeData" },
          { agentKey: "marketing_agent", mode: "analyzeData" },
        ],
        tier: "startup",
      },
      {
        name: "Product Launch Blitz",
        description: "Coordinate all aspects of a product launch",
        agents: [
          { agentKey: "product_agent", mode: "proposeNextAction" },
          { agentKey: "marketing_agent", mode: "proposeNextAction" },
          { agentKey: "sales_agent", mode: "proposeNextAction" },
        ],
        tier: "startup",
      },
      {
        name: "Investor Update Generator",
        description: "Compile investor updates from multiple departments",
        agents: [
          { agentKey: "finance_agent", mode: "analyzeData" },
          { agentKey: "exec_assistant", mode: "summarizeIdeas" },
          { agentKey: "strategy_agent", mode: "summarizeIdeas" },
        ],
        tier: "startup",
      },
      {
        name: "Competitive Intelligence Sweep",
        description: "Monitor competitors across multiple channels",
        agents: [
          { agentKey: "strategy_agent", mode: "analyzeData" },
          { agentKey: "analytics_agent", mode: "analyzeData" },
          { agentKey: "marketing_agent", mode: "analyzeData" },
        ],
        tier: "startup",
      },
      {
        name: "Team Performance Review",
        description: "Analyze team performance across all departments",
        agents: [
          { agentKey: "hr_agent", mode: "analyzeData" },
          { agentKey: "analytics_agent", mode: "summarizeIdeas" },
          { agentKey: "exec_assistant", mode: "proposeNextAction" },
        ],
        tier: "startup",
      },
      {
        name: "Sprint Planning Accelerator",
        description: "Plan sprints across multiple teams simultaneously",
        agents: [
          { agentKey: "product_agent", mode: "planWeek" },
          { agentKey: "exec_assistant", mode: "planWeek" },
          { agentKey: "strategy_agent", mode: "proposeNextAction" },
        ],
        tier: "startup",
      },

      // SME TIER (10)
      {
        name: "Enterprise Content Distribution",
        description: "Distribute content across all enterprise channels",
        agents: [
          { agentKey: "content_creator", mode: "proposeNextAction" },
          { agentKey: "social_media_agent", mode: "proposeNextAction" },
          { agentKey: "email_agent", mode: "proposeNextAction" },
          { agentKey: "marketing_agent", mode: "proposeNextAction" },
        ],
        tier: "sme",
      },
      {
        name: "Multi-Region Campaign Sync",
        description: "Synchronize campaigns across multiple regions",
        agents: [
          { agentKey: "regional_agent_us", mode: "proposeNextAction" },
          { agentKey: "regional_agent_eu", mode: "proposeNextAction" },
          { agentKey: "regional_agent_apac", mode: "proposeNextAction" },
          { agentKey: "strategy_agent", mode: "analyzeData" },
        ],
        tier: "sme",
      },
      {
        name: "Compliance & Risk Assessment",
        description: "Assess compliance and risk across all departments",
        agents: [
          { agentKey: "compliance_agent", mode: "analyzeData" },
          { agentKey: "risk_agent", mode: "analyzeData" },
          { agentKey: "legal_agent", mode: "analyzeData" },
          { agentKey: "finance_agent", mode: "analyzeData" },
        ],
        tier: "sme",
      },
      {
        name: "Department Budget Analysis",
        description: "Analyze budgets across all departments in parallel",
        agents: [
          { agentKey: "finance_agent", mode: "analyzeData" },
          { agentKey: "ops_agent", mode: "analyzeData" },
          { agentKey: "hr_agent", mode: "analyzeData" },
          { agentKey: "analytics_agent", mode: "summarizeIdeas" },
        ],
        tier: "sme",
      },
      {
        name: "Vendor Performance Review",
        description: "Review all vendor relationships simultaneously",
        agents: [
          { agentKey: "procurement_agent", mode: "analyzeData" },
          { agentKey: "finance_agent", mode: "analyzeData" },
          { agentKey: "ops_agent", mode: "analyzeData" },
        ],
        tier: "sme",
      },
      {
        name: "Customer Success Optimization",
        description: "Optimize customer success across all touchpoints",
        agents: [
          { agentKey: "support_agent", mode: "analyzeData" },
          { agentKey: "sales_agent", mode: "analyzeData" },
          { agentKey: "product_agent", mode: "analyzeData" },
          { agentKey: "analytics_agent", mode: "summarizeIdeas" },
        ],
        tier: "sme",
      },
      {
        name: "Strategic Initiative Tracker",
        description: "Track progress on all strategic initiatives",
        agents: [
          { agentKey: "strategy_agent", mode: "analyzeData" },
          { agentKey: "exec_assistant", mode: "summarizeIdeas" },
          { agentKey: "analytics_agent", mode: "analyzeData" },
        ],
        tier: "sme",
      },
      {
        name: "Market Expansion Analysis",
        description: "Analyze opportunities for market expansion",
        agents: [
          { agentKey: "strategy_agent", mode: "analyzeData" },
          { agentKey: "finance_agent", mode: "analyzeData" },
          { agentKey: "marketing_agent", mode: "analyzeData" },
          { agentKey: "sales_agent", mode: "analyzeData" },
        ],
        tier: "sme",
      },
      {
        name: "Quarterly Business Review",
        description: "Compile quarterly reviews from all departments",
        agents: [
          { agentKey: "finance_agent", mode: "analyzeData" },
          { agentKey: "sales_agent", mode: "analyzeData" },
          { agentKey: "marketing_agent", mode: "analyzeData" },
          { agentKey: "ops_agent", mode: "analyzeData" },
          { agentKey: "exec_assistant", mode: "summarizeIdeas" },
        ],
        tier: "sme",
      },
      {
        name: "Innovation Pipeline Review",
        description: "Review innovation initiatives across the organization",
        agents: [
          { agentKey: "product_agent", mode: "analyzeData" },
          { agentKey: "strategy_agent", mode: "analyzeData" },
          { agentKey: "exec_assistant", mode: "summarizeIdeas" },
        ],
        tier: "sme",
      },

      // ENTERPRISE TIER (10)
      {
        name: "Global Operations Sync",
        description: "Synchronize operations across all global offices",
        agents: [
          { agentKey: "ops_agent", mode: "analyzeData" },
          { agentKey: "regional_agent_us", mode: "analyzeData" },
          { agentKey: "regional_agent_eu", mode: "analyzeData" },
          { agentKey: "regional_agent_apac", mode: "analyzeData" },
          { agentKey: "regional_agent_latam", mode: "analyzeData" },
        ],
        tier: "enterprise",
      },
      {
        name: "Enterprise Risk Dashboard",
        description: "Monitor all enterprise risks in real-time",
        agents: [
          { agentKey: "risk_agent", mode: "analyzeData" },
          { agentKey: "compliance_agent", mode: "analyzeData" },
          { agentKey: "security_agent", mode: "analyzeData" },
          { agentKey: "legal_agent", mode: "analyzeData" },
          { agentKey: "finance_agent", mode: "analyzeData" },
        ],
        tier: "enterprise",
      },
      {
        name: "Board Report Compiler",
        description: "Compile comprehensive board reports from all divisions",
        agents: [
          { agentKey: "exec_assistant", mode: "summarizeIdeas" },
          { agentKey: "finance_agent", mode: "analyzeData" },
          { agentKey: "strategy_agent", mode: "analyzeData" },
          { agentKey: "ops_agent", mode: "analyzeData" },
          { agentKey: "hr_agent", mode: "analyzeData" },
        ],
        tier: "enterprise",
      },
      {
        name: "M&A Due Diligence",
        description: "Conduct parallel due diligence across all areas",
        agents: [
          { agentKey: "finance_agent", mode: "analyzeData" },
          { agentKey: "legal_agent", mode: "analyzeData" },
          { agentKey: "compliance_agent", mode: "analyzeData" },
          { agentKey: "strategy_agent", mode: "analyzeData" },
          { agentKey: "hr_agent", mode: "analyzeData" },
        ],
        tier: "enterprise",
      },
      {
        name: "Digital Transformation Monitor",
        description: "Monitor digital transformation initiatives across the enterprise",
        agents: [
          { agentKey: "tech_agent", mode: "analyzeData" },
          { agentKey: "strategy_agent", mode: "analyzeData" },
          { agentKey: "ops_agent", mode: "analyzeData" },
          { agentKey: "finance_agent", mode: "analyzeData" },
        ],
        tier: "enterprise",
      },
      {
        name: "Global Talent Assessment",
        description: "Assess talent and workforce across all regions",
        agents: [
          { agentKey: "hr_agent", mode: "analyzeData" },
          { agentKey: "regional_agent_us", mode: "analyzeData" },
          { agentKey: "regional_agent_eu", mode: "analyzeData" },
          { agentKey: "regional_agent_apac", mode: "analyzeData" },
          { agentKey: "analytics_agent", mode: "summarizeIdeas" },
        ],
        tier: "enterprise",
      },
      {
        name: "Supply Chain Optimization",
        description: "Optimize supply chain across all regions and vendors",
        agents: [
          { agentKey: "ops_agent", mode: "analyzeData" },
          { agentKey: "procurement_agent", mode: "analyzeData" },
          { agentKey: "finance_agent", mode: "analyzeData" },
          { agentKey: "analytics_agent", mode: "proposeNextAction" },
        ],
        tier: "enterprise",
      },
      {
        name: "Sustainability Impact Report",
        description: "Compile sustainability metrics from all operations",
        agents: [
          { agentKey: "sustainability_agent", mode: "analyzeData" },
          { agentKey: "ops_agent", mode: "analyzeData" },
          { agentKey: "finance_agent", mode: "analyzeData" },
          { agentKey: "compliance_agent", mode: "analyzeData" },
        ],
        tier: "enterprise",
      },
      {
        name: "Crisis Response Coordination",
        description: "Coordinate crisis response across all departments",
        agents: [
          { agentKey: "crisis_agent", mode: "proposeNextAction" },
          { agentKey: "comms_agent", mode: "proposeNextAction" },
          { agentKey: "legal_agent", mode: "analyzeData" },
          { agentKey: "exec_assistant", mode: "summarizeIdeas" },
        ],
        tier: "enterprise",
      },
      {
        name: "Annual Strategic Planning",
        description: "Coordinate annual strategic planning across the enterprise",
        agents: [
          { agentKey: "strategy_agent", mode: "proposeNextAction" },
          { agentKey: "finance_agent", mode: "analyzeData" },
          { agentKey: "ops_agent", mode: "analyzeData" },
          { agentKey: "hr_agent", mode: "analyzeData" },
          { agentKey: "exec_assistant", mode: "summarizeIdeas" },
        ],
        tier: "enterprise",
      },
    ];

    for (const orch of parallelOrchestrations) {
      await ctx.db.insert("parallelOrchestrations", {
        ...orch,
        isActive: true,
        createdAt: Date.now(),
      });
      totalSeeded++;
    }

    // CHAIN ORCHESTRATIONS - 40 total (10 per tier)
    const chainOrchestrations = [
      // SOLOPRENEUR TIER (10)
      {
        name: "Content Creation Pipeline",
        description: "Ideate, create, and schedule content in sequence",
        chain: [
          { agentKey: "content_creator", mode: "summarizeIdeas" },
          { agentKey: "content_creator", mode: "proposeNextAction", inputTransform: "summary" },
          { agentKey: "scheduler", mode: "planWeek", inputTransform: "action" },
        ],
        initialInput: "Create a week's worth of social media content",
        tier: "solopreneur",
      },
      {
        name: "Email Campaign Flow",
        description: "Draft, review, and schedule email campaigns",
        chain: [
          { agentKey: "email_agent", mode: "proposeNextAction" },
          { agentKey: "exec_assistant", mode: "summarizeIdeas", inputTransform: "summary" },
          { agentKey: "scheduler", mode: "planWeek", inputTransform: "action" },
        ],
        initialInput: "Create a promotional email campaign",
        tier: "solopreneur",
      },
      {
        name: "Blog Post Workflow",
        description: "Research, write, and optimize blog posts",
        chain: [
          { agentKey: "analytics_agent", mode: "analyzeData" },
          { agentKey: "content_creator", mode: "proposeNextAction", inputTransform: "summary" },
          { agentKey: "social_media_agent", mode: "proposeNextAction", inputTransform: "action" },
        ],
        initialInput: "Write a blog post about industry trends",
        tier: "solopreneur",
      },
      {
        name: "Social Media Strategy",
        description: "Analyze, plan, and execute social media strategy",
        chain: [
          { agentKey: "social_media_agent", mode: "analyzeData" },
          { agentKey: "strategy_agent", mode: "proposeNextAction", inputTransform: "summary" },
          { agentKey: "content_creator", mode: "proposeNextAction", inputTransform: "action" },
        ],
        initialInput: "Develop this month's social media strategy",
        tier: "solopreneur",
      },
      {
        name: "Customer Outreach Sequence",
        description: "Identify, draft, and send customer outreach",
        chain: [
          { agentKey: "analytics_agent", mode: "analyzeData" },
          { agentKey: "email_agent", mode: "proposeNextAction", inputTransform: "summary" },
          { agentKey: "scheduler", mode: "planWeek", inputTransform: "action" },
        ],
        initialInput: "Create a customer re-engagement campaign",
        tier: "solopreneur",
      },
      {
        name: "Weekly Planning Flow",
        description: "Review, prioritize, and schedule weekly tasks",
        chain: [
          { agentKey: "exec_assistant", mode: "summarizeIdeas" },
          { agentKey: "strategy_agent", mode: "proposeNextAction", inputTransform: "summary" },
          { agentKey: "scheduler", mode: "planWeek", inputTransform: "action" },
        ],
        initialInput: "Plan my week based on current priorities",
        tier: "solopreneur",
      },
      {
        name: "Product Launch Prep",
        description: "Plan, create content, and schedule product launch",
        chain: [
          { agentKey: "strategy_agent", mode: "proposeNextAction" },
          { agentKey: "content_creator", mode: "proposeNextAction", inputTransform: "action" },
          { agentKey: "social_media_agent", mode: "proposeNextAction", inputTransform: "summary" },
        ],
        initialInput: "Prepare for new product launch",
        tier: "solopreneur",
      },
      {
        name: "Performance Review Chain",
        description: "Analyze, summarize, and plan based on performance",
        chain: [
          { agentKey: "analytics_agent", mode: "analyzeData" },
          { agentKey: "exec_assistant", mode: "summarizeIdeas", inputTransform: "summary" },
          { agentKey: "strategy_agent", mode: "proposeNextAction", inputTransform: "action" },
        ],
        initialInput: "Review last month's performance and plan improvements",
        tier: "solopreneur",
      },
      {
        name: "Content Repurposing Chain",
        description: "Transform content across multiple formats",
        chain: [
          { agentKey: "content_creator", mode: "proposeNextAction" },
          { agentKey: "social_media_agent", mode: "proposeNextAction", inputTransform: "summary" },
          { agentKey: "email_agent", mode: "proposeNextAction", inputTransform: "action" },
        ],
        initialInput: "Repurpose blog post into social and email content",
        tier: "solopreneur",
      },
      {
        name: "Market Research to Action",
        description: "Research, analyze, and create action plan",
        chain: [
          { agentKey: "analytics_agent", mode: "analyzeData" },
          { agentKey: "strategy_agent", mode: "summarizeIdeas", inputTransform: "summary" },
          { agentKey: "exec_assistant", mode: "proposeNextAction", inputTransform: "action" },
        ],
        initialInput: "Research market trends and create action plan",
        tier: "solopreneur",
      },

      // STARTUP TIER (10)
      {
        name: "Product Development Pipeline",
        description: "Ideate, plan, and execute product development",
        chain: [
          { agentKey: "product_agent", mode: "summarizeIdeas" },
          { agentKey: "strategy_agent", mode: "proposeNextAction", inputTransform: "summary" },
          { agentKey: "exec_assistant", mode: "planWeek", inputTransform: "action" },
        ],
        initialInput: "Develop new product feature roadmap",
        tier: "startup",
      },
      {
        name: "Sales Funnel Optimization",
        description: "Analyze, optimize, and implement sales funnel improvements",
        chain: [
          { agentKey: "analytics_agent", mode: "analyzeData" },
          { agentKey: "sales_agent", mode: "proposeNextAction", inputTransform: "summary" },
          { agentKey: "marketing_agent", mode: "proposeNextAction", inputTransform: "action" },
        ],
        initialInput: "Optimize our sales funnel conversion rates",
        tier: "startup",
      },
      {
        name: "Customer Onboarding Flow",
        description: "Design, create, and implement customer onboarding",
        chain: [
          { agentKey: "product_agent", mode: "proposeNextAction" },
          { agentKey: "support_agent", mode: "proposeNextAction", inputTransform: "action" },
          { agentKey: "exec_assistant", mode: "summarizeIdeas", inputTransform: "summary" },
        ],
        initialInput: "Create comprehensive customer onboarding process",
        tier: "startup",
      },
      {
        name: "Marketing Campaign Chain",
        description: "Plan, create, and launch marketing campaigns",
        chain: [
          { agentKey: "strategy_agent", mode: "proposeNextAction" },
          { agentKey: "marketing_agent", mode: "proposeNextAction", inputTransform: "action" },
          { agentKey: "content_creator", mode: "proposeNextAction", inputTransform: "summary" },
          { agentKey: "analytics_agent", mode: "analyzeData", inputTransform: "action" },
        ],
        initialInput: "Launch Q2 marketing campaign",
        tier: "startup",
      },
      {
        name: "Investor Pitch Preparation",
        description: "Research, draft, and refine investor pitch",
        chain: [
          { agentKey: "finance_agent", mode: "analyzeData" },
          { agentKey: "strategy_agent", mode: "summarizeIdeas", inputTransform: "summary" },
          { agentKey: "exec_assistant", mode: "proposeNextAction", inputTransform: "action" },
        ],
        initialInput: "Prepare Series A investor pitch deck",
        tier: "startup",
      },
      {
        name: "Team Hiring Pipeline",
        description: "Define role, source candidates, and schedule interviews",
        chain: [
          { agentKey: "hr_agent", mode: "proposeNextAction" },
          { agentKey: "exec_assistant", mode: "summarizeIdeas", inputTransform: "action" },
          { agentKey: "scheduler", mode: "planWeek", inputTransform: "summary" },
        ],
        initialInput: "Hire senior software engineer",
        tier: "startup",
      },
      {
        name: "Competitive Analysis Flow",
        description: "Research competitors, analyze, and strategize",
        chain: [
          { agentKey: "analytics_agent", mode: "analyzeData" },
          { agentKey: "strategy_agent", mode: "summarizeIdeas", inputTransform: "summary" },
          { agentKey: "marketing_agent", mode: "proposeNextAction", inputTransform: "action" },
        ],
        initialInput: "Analyze top 3 competitors and create response strategy",
        tier: "startup",
      },
      {
        name: "Sprint Planning Chain",
        description: "Review backlog, prioritize, and plan sprint",
        chain: [
          { agentKey: "product_agent", mode: "analyzeData" },
          { agentKey: "exec_assistant", mode: "summarizeIdeas", inputTransform: "summary" },
          { agentKey: "strategy_agent", mode: "planWeek", inputTransform: "action" },
        ],
        initialInput: "Plan next 2-week development sprint",
        tier: "startup",
      },
      {
        name: "Customer Feedback Loop",
        description: "Collect feedback, analyze, and implement changes",
        chain: [
          { agentKey: "support_agent", mode: "analyzeData" },
          { agentKey: "product_agent", mode: "summarizeIdeas", inputTransform: "summary" },
          { agentKey: "exec_assistant", mode: "proposeNextAction", inputTransform: "action" },
        ],
        initialInput: "Process customer feedback and plan improvements",
        tier: "startup",
      },
      {
        name: "Growth Strategy Development",
        description: "Analyze growth, strategize, and execute plan",
        chain: [
          { agentKey: "analytics_agent", mode: "analyzeData" },
          { agentKey: "strategy_agent", mode: "proposeNextAction", inputTransform: "summary" },
          { agentKey: "marketing_agent", mode: "proposeNextAction", inputTransform: "action" },
          { agentKey: "sales_agent", mode: "proposeNextAction", inputTransform: "action" },
        ],
        initialInput: "Develop 6-month growth strategy",
        tier: "startup",
      },

      // SME TIER (10)
      {
        name: "Department Budget Planning",
        description: "Analyze spending, forecast, and allocate budgets",
        chain: [
          { agentKey: "finance_agent", mode: "analyzeData" },
          { agentKey: "ops_agent", mode: "summarizeIdeas", inputTransform: "summary" },
          { agentKey: "exec_assistant", mode: "proposeNextAction", inputTransform: "action" },
        ],
        initialInput: "Plan annual department budgets",
        tier: "sme",
      },
      {
        name: "Compliance Audit Flow",
        description: "Audit compliance, identify gaps, and remediate",
        chain: [
          { agentKey: "compliance_agent", mode: "analyzeData" },
          { agentKey: "legal_agent", mode: "summarizeIdeas", inputTransform: "summary" },
          { agentKey: "ops_agent", mode: "proposeNextAction", inputTransform: "action" },
        ],
        initialInput: "Conduct quarterly compliance audit",
        tier: "sme",
      },
      {
        name: "Vendor Selection Process",
        description: "Evaluate vendors, negotiate, and onboard",
        chain: [
          { agentKey: "procurement_agent", mode: "analyzeData" },
          { agentKey: "finance_agent", mode: "summarizeIdeas", inputTransform: "summary" },
          { agentKey: "legal_agent", mode: "proposeNextAction", inputTransform: "action" },
          { agentKey: "ops_agent", mode: "proposeNextAction", inputTransform: "action" },
        ],
        initialInput: "Select new cloud infrastructure vendor",
        tier: "sme",
      },
      {
        name: "Strategic Initiative Launch",
        description: "Plan initiative, allocate resources, and execute",
        chain: [
          { agentKey: "strategy_agent", mode: "proposeNextAction" },
          { agentKey: "finance_agent", mode: "analyzeData", inputTransform: "action" },
          { agentKey: "ops_agent", mode: "proposeNextAction", inputTransform: "summary" },
          { agentKey: "exec_assistant", mode: "planWeek", inputTransform: "action" },
        ],
        initialInput: "Launch digital transformation initiative",
        tier: "sme",
      },
      {
        name: "Market Expansion Planning",
        description: "Research market, plan entry, and execute strategy",
        chain: [
          { agentKey: "analytics_agent", mode: "analyzeData" },
          { agentKey: "strategy_agent", mode: "summarizeIdeas", inputTransform: "summary" },
          { agentKey: "finance_agent", mode: "analyzeData", inputTransform: "action" },
          { agentKey: "marketing_agent", mode: "proposeNextAction", inputTransform: "summary" },
        ],
        initialInput: "Plan expansion into European market",
        tier: "sme",
      },
      {
        name: "Risk Mitigation Pipeline",
        description: "Identify risks, assess impact, and create mitigation plan",
        chain: [
          { agentKey: "risk_agent", mode: "analyzeData" },
          { agentKey: "compliance_agent", mode: "summarizeIdeas", inputTransform: "summary" },
          { agentKey: "strategy_agent", mode: "proposeNextAction", inputTransform: "action" },
        ],
        initialInput: "Assess and mitigate operational risks",
        tier: "sme",
      },
      {
        name: "Customer Success Program",
        description: "Design program, implement, and measure success",
        chain: [
          { agentKey: "support_agent", mode: "analyzeData" },
          { agentKey: "product_agent", mode: "summarizeIdeas", inputTransform: "summary" },
          { agentKey: "sales_agent", mode: "proposeNextAction", inputTransform: "action" },
          { agentKey: "analytics_agent", mode: "analyzeData", inputTransform: "action" },
        ],
        initialInput: "Launch enterprise customer success program",
        tier: "sme",
      },
      {
        name: "Quarterly Business Review",
        description: "Compile data, analyze performance, and plan next quarter",
        chain: [
          { agentKey: "finance_agent", mode: "analyzeData" },
          { agentKey: "analytics_agent", mode: "summarizeIdeas", inputTransform: "summary" },
          { agentKey: "strategy_agent", mode: "proposeNextAction", inputTransform: "action" },
          { agentKey: "exec_assistant", mode: "planWeek", inputTransform: "action" },
        ],
        initialInput: "Conduct Q3 business review and plan Q4",
        tier: "sme",
      },
      {
        name: "Product Portfolio Review",
        description: "Analyze portfolio, identify opportunities, and optimize",
        chain: [
          { agentKey: "product_agent", mode: "analyzeData" },
          { agentKey: "finance_agent", mode: "analyzeData", inputTransform: "summary" },
          { agentKey: "strategy_agent", mode: "summarizeIdeas", inputTransform: "summary" },
          { agentKey: "exec_assistant", mode: "proposeNextAction", inputTransform: "action" },
        ],
        initialInput: "Review and optimize product portfolio",
        tier: "sme",
      },
      {
        name: "Organizational Restructuring",
        description: "Analyze structure, plan changes, and implement",
        chain: [
          { agentKey: "hr_agent", mode: "analyzeData" },
          { agentKey: "strategy_agent", mode: "summarizeIdeas", inputTransform: "summary" },
          { agentKey: "finance_agent", mode: "analyzeData", inputTransform: "action" },
          { agentKey: "exec_assistant", mode: "proposeNextAction", inputTransform: "summary" },
        ],
        initialInput: "Plan organizational restructuring for efficiency",
        tier: "sme",
      },

      // ENTERPRISE TIER (10)
      {
        name: "Global Strategy Alignment",
        description: "Align strategy across all regions and divisions",
        chain: [
          { agentKey: "strategy_agent", mode: "proposeNextAction" },
          { agentKey: "regional_agent_us", mode: "summarizeIdeas", inputTransform: "action" },
          { agentKey: "regional_agent_eu", mode: "summarizeIdeas", inputTransform: "action" },
          { agentKey: "regional_agent_apac", mode: "summarizeIdeas", inputTransform: "action" },
          { agentKey: "exec_assistant", mode: "proposeNextAction", inputTransform: "summary" },
        ],
        initialInput: "Align global strategy for next fiscal year",
        tier: "enterprise",
      },
      {
        name: "M&A Integration Pipeline",
        description: "Plan integration, execute, and measure success",
        chain: [
          { agentKey: "strategy_agent", mode: "proposeNextAction" },
          { agentKey: "finance_agent", mode: "analyzeData", inputTransform: "action" },
          { agentKey: "legal_agent", mode: "summarizeIdeas", inputTransform: "summary" },
          { agentKey: "hr_agent", mode: "proposeNextAction", inputTransform: "action" },
          { agentKey: "ops_agent", mode: "proposeNextAction", inputTransform: "action" },
        ],
        initialInput: "Integrate newly acquired company",
        tier: "enterprise",
      },
      {
        name: "Enterprise Risk Assessment",
        description: "Comprehensive risk assessment across all operations",
        chain: [
          { agentKey: "risk_agent", mode: "analyzeData" },
          { agentKey: "compliance_agent", mode: "analyzeData", inputTransform: "summary" },
          { agentKey: "security_agent", mode: "analyzeData", inputTransform: "summary" },
          { agentKey: "finance_agent", mode: "summarizeIdeas", inputTransform: "summary" },
          { agentKey: "exec_assistant", mode: "proposeNextAction", inputTransform: "action" },
        ],
        initialInput: "Conduct annual enterprise risk assessment",
        tier: "enterprise",
      },
      {
        name: "Digital Transformation Roadmap",
        description: "Plan and execute enterprise-wide digital transformation",
        chain: [
          { agentKey: "tech_agent", mode: "analyzeData" },
          { agentKey: "strategy_agent", mode: "proposeNextAction", inputTransform: "summary" },
          { agentKey: "finance_agent", mode: "analyzeData", inputTransform: "action" },
          { agentKey: "ops_agent", mode: "proposeNextAction", inputTransform: "summary" },
          { agentKey: "exec_assistant", mode: "planWeek", inputTransform: "action" },
        ],
        initialInput: "Create 3-year digital transformation roadmap",
        tier: "enterprise",
      },
      {
        name: "Board Presentation Pipeline",
        description: "Compile data, create presentation, and prepare materials",
        chain: [
          { agentKey: "finance_agent", mode: "analyzeData" },
          { agentKey: "strategy_agent", mode: "summarizeIdeas", inputTransform: "summary" },
          { agentKey: "exec_assistant", mode: "proposeNextAction", inputTransform: "action" },
        ],
        initialInput: "Prepare quarterly board presentation",
        tier: "enterprise",
      },
      {
        name: "Global Talent Strategy",
        description: "Assess talent needs, plan recruitment, and execute",
        chain: [
          { agentKey: "hr_agent", mode: "analyzeData" },
          { agentKey: "strategy_agent", mode: "summarizeIdeas", inputTransform: "summary" },
          { agentKey: "regional_agent_us", mode: "proposeNextAction", inputTransform: "action" },
          { agentKey: "regional_agent_eu", mode: "proposeNextAction", inputTransform: "action" },
          { agentKey: "finance_agent", mode: "analyzeData", inputTransform: "summary" },
        ],
        initialInput: "Develop global talent acquisition strategy",
        tier: "enterprise",
      },
      {
        name: "Supply Chain Transformation",
        description: "Analyze supply chain, optimize, and implement changes",
        chain: [
          { agentKey: "ops_agent", mode: "analyzeData" },
          { agentKey: "procurement_agent", mode: "summarizeIdeas", inputTransform: "summary" },
          { agentKey: "finance_agent", mode: "analyzeData", inputTransform: "action" },
          { agentKey: "strategy_agent", mode: "proposeNextAction", inputTransform: "summary" },
        ],
        initialInput: "Transform global supply chain operations",
        tier: "enterprise",
      },
      {
        name: "Sustainability Initiative",
        description: "Assess impact, plan initiatives, and implement",
        chain: [
          { agentKey: "sustainability_agent", mode: "analyzeData" },
          { agentKey: "ops_agent", mode: "summarizeIdeas", inputTransform: "summary" },
          { agentKey: "finance_agent", mode: "analyzeData", inputTransform: "action" },
          { agentKey: "strategy_agent", mode: "proposeNextAction", inputTransform: "summary" },
          { agentKey: "exec_assistant", mode: "planWeek", inputTransform: "action" },
        ],
        initialInput: "Launch enterprise sustainability program",
        tier: "enterprise",
      },
      {
        name: "Crisis Management Protocol",
        description: "Assess crisis, coordinate response, and communicate",
        chain: [
          { agentKey: "crisis_agent", mode: "analyzeData" },
          { agentKey: "comms_agent", mode: "proposeNextAction", inputTransform: "summary" },
          { agentKey: "legal_agent", mode: "summarizeIdeas", inputTransform: "action" },
          { agentKey: "exec_assistant", mode: "proposeNextAction", inputTransform: "summary" },
        ],
        initialInput: "Activate crisis management protocol",
        tier: "enterprise",
      },
      {
        name: "Annual Strategic Planning",
        description: "Comprehensive annual planning across all divisions",
        chain: [
          { agentKey: "strategy_agent", mode: "analyzeData" },
          { agentKey: "finance_agent", mode: "analyzeData", inputTransform: "summary" },
          { agentKey: "ops_agent", mode: "summarizeIdeas", inputTransform: "summary" },
          { agentKey: "hr_agent", mode: "summarizeIdeas", inputTransform: "summary" },
          { agentKey: "exec_assistant", mode: "proposeNextAction", inputTransform: "action" },
        ],
        initialInput: "Create comprehensive annual strategic plan",
        tier: "enterprise",
      },
    ];

    for (const orch of chainOrchestrations) {
      await ctx.db.insert("chainOrchestrations", {
        ...orch,
        isActive: true,
        createdAt: Date.now(),
      });
      totalSeeded++;
    }

    // CONSENSUS ORCHESTRATIONS - 40 total (10 per tier)
    const consensusOrchestrations = [
      // SOLOPRENEUR TIER (10)
      {
        name: "Content Direction Decision",
        description: "Get consensus on content strategy direction",
        agents: ["content_creator", "social_media_agent", "exec_assistant"],
        question: "What content themes should we focus on this month?",
        consensusThreshold: 0.7,
        tier: "solopreneur",
      },
      {
        name: "Priority Setting Consensus",
        description: "Align on top priorities for the week",
        agents: ["exec_assistant", "strategy_agent", "scheduler"],
        question: "What are the top 3 priorities for this week?",
        consensusThreshold: 0.6,
        tier: "solopreneur",
      },
      {
        name: "Marketing Channel Selection",
        description: "Decide which marketing channels to focus on",
        agents: ["social_media_agent", "email_agent", "analytics_agent"],
        question: "Which marketing channels should we prioritize?",
        consensusThreshold: 0.7,
        tier: "solopreneur",
      },
      {
        name: "Product Feature Priority",
        description: "Determine which product features to build next",
        agents: ["product_agent", "exec_assistant", "analytics_agent"],
        question: "Which product feature should we build next?",
        consensusThreshold: 0.6,
        tier: "solopreneur",
      },
      {
        name: "Budget Allocation Decision",
        description: "Decide how to allocate limited budget",
        agents: ["finance_agent", "strategy_agent", "exec_assistant"],
        question: "How should we allocate our marketing budget?",
        consensusThreshold: 0.7,
        tier: "solopreneur",
      },
      {
        name: "Time Management Strategy",
        description: "Align on best time management approach",
        agents: ["exec_assistant", "scheduler", "strategy_agent"],
        question: "What time management strategy should we adopt?",
        consensusThreshold: 0.6,
        tier: "solopreneur",
      },
      {
        name: "Customer Segment Focus",
        description: "Decide which customer segment to target",
        agents: ["analytics_agent", "strategy_agent", "sales_agent"],
        question: "Which customer segment should we focus on?",
        consensusThreshold: 0.7,
        tier: "solopreneur",
      },
      {
        name: "Content Format Decision",
        description: "Choose optimal content formats",
        agents: ["content_creator", "social_media_agent", "analytics_agent"],
        question: "What content formats perform best for our audience?",
        consensusThreshold: 0.6,
        tier: "solopreneur",
      },
      {
        name: "Growth Strategy Alignment",
        description: "Align on primary growth strategy",
        agents: ["strategy_agent", "analytics_agent", "exec_assistant"],
        question: "What should be our primary growth strategy?",
        consensusThreshold: 0.7,
        tier: "solopreneur",
      },
      {
        name: "Tool Selection Consensus",
        description: "Decide which tools to invest in",
        agents: ["exec_assistant", "finance_agent", "strategy_agent"],
        question: "Which business tools should we invest in?",
        consensusThreshold: 0.6,
        tier: "solopreneur",
      },

      // STARTUP TIER (10)
      {
        name: "Product Roadmap Alignment",
        description: "Align team on product roadmap priorities",
        agents: ["product_agent", "strategy_agent", "exec_assistant", "analytics_agent"],
        question: "What should be our product roadmap for next quarter?",
        consensusThreshold: 0.7,
        tier: "startup",
      },
      {
        name: "Hiring Priority Decision",
        description: "Decide which roles to hire first",
        agents: ["hr_agent", "finance_agent", "strategy_agent", "exec_assistant"],
        question: "Which roles should we prioritize hiring?",
        consensusThreshold: 0.6,
        tier: "startup",
      },
      {
        name: "Market Positioning Strategy",
        description: "Align on market positioning approach",
        agents: ["strategy_agent", "marketing_agent", "sales_agent", "product_agent"],
        question: "How should we position ourselves in the market?",
        consensusThreshold: 0.7,
        tier: "startup",
      },
      {
        name: "Funding Strategy Consensus",
        description: "Decide on funding approach and timing",
        agents: ["finance_agent", "strategy_agent", "exec_assistant"],
        question: "What should be our funding strategy?",
        consensusThreshold: 0.8,
        tier: "startup",
      },
      {
        name: "Customer Acquisition Focus",
        description: "Align on customer acquisition channels",
        agents: ["marketing_agent", "sales_agent", "analytics_agent", "strategy_agent"],
        question: "Which customer acquisition channels should we focus on?",
        consensusThreshold: 0.6,
        tier: "startup",
      },
      {
        name: "Technology Stack Decision",
        description: "Choose technology stack for new projects",
        agents: ["tech_agent", "product_agent", "finance_agent", "strategy_agent"],
        question: "What technology stack should we adopt?",
        consensusThreshold: 0.7,
        tier: "startup",
      },
      {
        name: "Partnership Opportunity",
        description: "Evaluate and decide on partnership opportunities",
        agents: ["strategy_agent", "sales_agent", "finance_agent", "exec_assistant"],
        question: "Should we pursue this partnership opportunity?",
        consensusThreshold: 0.7,
        tier: "startup",
      },
      {
        name: "Pricing Strategy Alignment",
        description: "Align on pricing model and strategy",
        agents: ["finance_agent", "sales_agent", "product_agent", "strategy_agent"],
        question: "What pricing strategy should we implement?",
        consensusThreshold: 0.8,
        tier: "startup",
      },
      {
        name: "Team Structure Decision",
        description: "Decide on optimal team structure",
        agents: ["hr_agent", "strategy_agent", "exec_assistant", "finance_agent"],
        question: "How should we structure our teams?",
        consensusThreshold: 0.6,
        tier: "startup",
      },
      {
        name: "Expansion Timing Consensus",
        description: "Decide when to expand operations",
        agents: ["strategy_agent", "finance_agent", "ops_agent", "exec_assistant"],
        question: "When should we expand to new markets?",
        consensusThreshold: 0.7,
        tier: "startup",
      },

      // SME TIER (10)
      {
        name: "Strategic Initiative Priority",
        description: "Prioritize strategic initiatives across departments",
        agents: ["strategy_agent", "finance_agent", "ops_agent", "hr_agent", "exec_assistant"],
        question: "Which strategic initiatives should we prioritize?",
        consensusThreshold: 0.7,
        tier: "sme",
      },
      {
        name: "Department Budget Allocation",
        description: "Align on budget allocation across departments",
        agents: ["finance_agent", "ops_agent", "hr_agent", "marketing_agent", "sales_agent"],
        question: "How should we allocate budgets across departments?",
        consensusThreshold: 0.6,
        tier: "sme",
      },
      {
        name: "Vendor Selection Decision",
        description: "Choose between major vendor options",
        agents: ["procurement_agent", "finance_agent", "ops_agent", "legal_agent"],
        question: "Which vendor should we select for this contract?",
        consensusThreshold: 0.7,
        tier: "sme",
      },
      {
        name: "Market Expansion Strategy",
        description: "Decide on market expansion approach",
        agents: ["strategy_agent", "finance_agent", "marketing_agent", "sales_agent", "ops_agent"],
        question: "How should we approach market expansion?",
        consensusThreshold: 0.7,
        tier: "sme",
      },
      {
        name: "Organizational Change Management",
        description: "Align on organizational changes",
        agents: ["hr_agent", "strategy_agent", "finance_agent", "ops_agent", "exec_assistant"],
        question: "What organizational changes should we implement?",
        consensusThreshold: 0.8,
        tier: "sme",
      },
      {
        name: "Technology Investment Decision",
        description: "Decide on major technology investments",
        agents: ["tech_agent", "finance_agent", "strategy_agent", "ops_agent"],
        question: "Which technology investments should we make?",
        consensusThreshold: 0.7,
        tier: "sme",
      },
      {
        name: "Risk Mitigation Priority",
        description: "Prioritize risk mitigation efforts",
        agents: ["risk_agent", "compliance_agent", "finance_agent", "ops_agent", "strategy_agent"],
        question: "Which risks should we prioritize mitigating?",
        consensusThreshold: 0.7,
        tier: "sme",
      },
      {
        name: "Customer Success Strategy",
        description: "Align on customer success approach",
        agents: ["support_agent", "sales_agent", "product_agent", "strategy_agent"],
        question: "What customer success strategy should we implement?",
        consensusThreshold: 0.6,
        tier: "sme",
      },
      {
        name: "Product Portfolio Decision",
        description: "Decide on product portfolio changes",
        agents: ["product_agent", "finance_agent", "strategy_agent", "marketing_agent", "sales_agent"],
        question: "How should we optimize our product portfolio?",
        consensusThreshold: 0.7,
        tier: "sme",
      },
      {
        name: "Compliance Priority Alignment",
        description: "Prioritize compliance initiatives",
        agents: ["compliance_agent", "legal_agent", "risk_agent", "finance_agent", "ops_agent"],
        question: "Which compliance initiatives should we prioritize?",
        consensusThreshold: 0.8,
        tier: "sme",
      },

      // ENTERPRISE TIER (10)
      {
        name: "Global Strategy Consensus",
        description: "Align global leadership on strategic direction",
        agents: ["strategy_agent", "regional_agent_us", "regional_agent_eu", "regional_agent_apac", "finance_agent", "exec_assistant"],
        question: "What should be our global strategic direction?",
        consensusThreshold: 0.7,
        tier: "enterprise",
      },
      {
        name: "M&A Target Evaluation",
        description: "Evaluate potential acquisition targets",
        agents: ["strategy_agent", "finance_agent", "legal_agent", "ops_agent", "exec_assistant"],
        question: "Should we pursue this acquisition target?",
        consensusThreshold: 0.8,
        tier: "enterprise",
      },
      {
        name: "Digital Transformation Priority",
        description: "Prioritize digital transformation initiatives",
        agents: ["tech_agent", "strategy_agent", "finance_agent", "ops_agent", "hr_agent"],
        question: "Which digital transformation initiatives should we prioritize?",
        consensusThreshold: 0.7,
        tier: "enterprise",
      },
      {
        name: "Enterprise Risk Assessment",
        description: "Align on enterprise-wide risk priorities",
        agents: ["risk_agent", "compliance_agent", "security_agent", "finance_agent", "legal_agent", "exec_assistant"],
        question: "What are our top enterprise risks to address?",
        consensusThreshold: 0.7,
        tier: "enterprise",
      },
      {
        name: "Global Talent Strategy",
        description: "Align on global talent acquisition and development",
        agents: ["hr_agent", "regional_agent_us", "regional_agent_eu", "regional_agent_apac", "finance_agent", "strategy_agent"],
        question: "What should be our global talent strategy?",
        consensusThreshold: 0.6,
        tier: "enterprise",
      },
      {
        name: "Supply Chain Transformation",
        description: "Decide on supply chain transformation approach",
        agents: ["ops_agent", "procurement_agent", "finance_agent", "strategy_agent", "tech_agent"],
        question: "How should we transform our supply chain?",
        consensusThreshold: 0.7,
        tier: "enterprise",
      },
      {
        name: "Sustainability Initiative Priority",
        description: "Prioritize sustainability initiatives",
        agents: ["sustainability_agent", "ops_agent", "finance_agent", "compliance_agent", "strategy_agent"],
        question: "Which sustainability initiatives should we prioritize?",
        consensusThreshold: 0.7,
        tier: "enterprise",
      },
      {
        name: "Regional Expansion Decision",
        description: "Decide on regional expansion priorities",
        agents: ["strategy_agent", "finance_agent", "regional_agent_us", "regional_agent_eu", "regional_agent_apac", "ops_agent"],
        question: "Which regions should we expand into next?",
        consensusThreshold: 0.7,
        tier: "enterprise",
      },
      {
        name: "Innovation Investment Allocation",
        description: "Allocate innovation budget across initiatives",
        agents: ["strategy_agent", "finance_agent", "tech_agent", "product_agent", "exec_assistant"],
        question: "How should we allocate our innovation budget?",
        consensusThreshold: 0.6,
        tier: "enterprise",
      },
      {
        name: "Crisis Response Protocol",
        description: "Align on crisis response procedures",
        agents: ["crisis_agent", "comms_agent", "legal_agent", "security_agent", "exec_assistant"],
        question: "What crisis response protocols should we implement?",
        consensusThreshold: 0.8,
        tier: "enterprise",
      },
    ];

    for (const orch of consensusOrchestrations) {
      await ctx.db.insert("consensusOrchestrations", {
        ...orch,
        isActive: true,
        createdAt: Date.now(),
      });
      totalSeeded++;
    }

    return { 
      message: "Orchestrations seeded successfully", 
      total: totalSeeded,
      parallel: parallelOrchestrations.length,
      chain: chainOrchestrations.length,
      consensus: consensusOrchestrations.length,
    };
  },
});