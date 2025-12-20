import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { query } from "./_generated/server";

// Initialize default feature flags for the platform enhancement MVP
export const initializeFeatureFlags = internalMutation({
  args: {},
  handler: async (ctx) => {
    const defaultFlags = [
      {
        flagName: "workflow_assignments",
        isEnabled: false,
        rolloutPercentage: 0,
        description: "Enable workflow step assignments and due dates"
      },
      {
        flagName: "template_gallery_filters",
        isEnabled: false,
        rolloutPercentage: 0,
        description: "Enable advanced template filtering and recommendations"
      },
      {
        flagName: "email_designer",
        isEnabled: false,
        rolloutPercentage: 0,
        description: "Enable email campaign designer and scheduler"
      },
      {
        flagName: "seo_suggestions",
        isEnabled: false,
        rolloutPercentage: 0,
        description: "Enable SEO suggestion widget"
      },
      {
        flagName: "dashboard_creator",
        isEnabled: false,
        rolloutPercentage: 0,
        description: "Enable custom dashboard creation"
      },
      {
        flagName: "export_reports",
        isEnabled: false,
        rolloutPercentage: 0,
        description: "Enable report export and scheduling"
      },
      {
        flagName: "capa_board",
        isEnabled: false,
        rolloutPercentage: 0,
        description: "Enable CAPA status board"
      },
      {
        flagName: "risk_register",
        isEnabled: false,
        rolloutPercentage: 0,
        description: "Enable risk register management"
      },
      {
        flagName: "oauth_integrations",
        isEnabled: false,
        rolloutPercentage: 0,
        description: "Enable OAuth integration management"
      },
      {
        flagName: "sso_placeholder",
        isEnabled: false,
        rolloutPercentage: 0,
        description: "Enable SSO configuration placeholder"
      },
      {
        flagName: "enhanced_onboarding",
        isEnabled: false,
        rolloutPercentage: 0,
        description: "Enable enhanced onboarding wizard"
      },
      {
        flagName: "contextual_tips",
        isEnabled: false,
        rolloutPercentage: 0,
        description: "Enable contextual tips and help system"
      }
    ];

    const createdFlags: string[] = [];

    for (const flag of defaultFlags) {
      // Fix: don't compare to undefined or store undefined fields; just check by flagName
      const existingFlag = await ctx.db
        .query("featureFlags")
        .withIndex("by_flag_name", (q) => q.eq("flagName", flag.flagName))
        .first();

      if (!existingFlag) {
        await ctx.db.insert("featureFlags", {
          flagName: flag.flagName,
          isEnabled: flag.isEnabled,
          rolloutPercentage: flag.rolloutPercentage,
        } as any);
        createdFlags.push(flag.flagName);
      }
    }

    return {
      message: "Feature flags initialized",
      createdFlags,
      totalFlags: defaultFlags.length,
    };
  },
});

// Initialize default notification preferences for existing users
export const initializeNotificationPreferences = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const businesses = await ctx.db.query("businesses").collect();
    
    const createdPreferences = [];
    
    for (const user of users) {
      // Find user's business
      const userBusiness = businesses.find(b => 
        b.ownerId === user._id || b.teamMembers.includes(user._id)
      );
      
      if (userBusiness) {
        // Check if preferences already exist
        const existingPrefs = await ctx.db
          .query("notificationPreferences")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .first();

        if (!existingPrefs) {
          await ctx.db.insert("notificationPreferences", {
            userId: user._id,
            businessId: userBusiness._id,
            emailEnabled: true,
            pushEnabled: true,
            smsEnabled: false,
            preferences: {
              assignments: true,
              approvals: true,
              slaWarnings: true,
              integrationErrors: true,
              workflowCompletions: true,
              systemAlerts: true,
            },
            rateLimits: {
              maxPerHour: 10,
              maxPerDay: 50,
            },
            updatedAt: Date.now(),
          });
          createdPreferences.push(user._id);
        }
      }
    }

    return {
      message: "Notification preferences initialized",
      createdPreferences: createdPreferences.length,
      totalUsers: users.length,
    };
  },
});

// Clean up old telemetry events (keep last 90 days)
export const cleanupOldTelemetryEvents = internalMutation({
  args: {},
  handler: async (ctx) => {
    const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
    
    const oldEvents = await ctx.db
      .query("telemetryEvents")
      .withIndex("by_timestamp", (q) => q.lt("timestamp", ninetyDaysAgo))
      .collect();

    for (const event of oldEvents) {
      await ctx.db.delete(event._id);
    }

    return {
      message: "Old telemetry events cleaned up",
      deletedEvents: oldEvents.length,
    };
  },
});

// Add: Environment status query to verify required config/secrets
export const getEnvStatus = query({
  args: {},
  handler: async () => {
    const hasResend =
      typeof process.env.RESEND_API_KEY === "string" &&
      process.env.RESEND_API_KEY.trim().length > 0;

    const hasSalesInbox =
      typeof process.env.SALES_INBOX === "string" &&
      process.env.SALES_INBOX.trim().length > 0;

    const hasPublicBaseUrl =
      typeof process.env.VITE_PUBLIC_BASE_URL === "string" &&
      process.env.VITE_PUBLIC_BASE_URL.trim().length > 0;

    const devSafeRaw = String(process.env.DEV_SAFE_EMAILS ?? "").toLowerCase();
    const devSafeEmails = devSafeRaw === "true" || devSafeRaw === "1";

    // Surface concise server logs to help diagnostics without leaking secrets
    if (!hasResend) console.warn("[config] RESEND_API_KEY is missing");
    if (!hasSalesInbox) console.warn("[config] SALES_INBOX is missing");
    if (!hasPublicBaseUrl) console.warn("[config] VITE_PUBLIC_BASE_URL is missing");
    if (devSafeEmails) console.info("[config] DEV_SAFE_EMAILS enabled (email sends stubbed in dev)");

    return {
      hasResend,
      hasSalesInbox,
      hasPublicBaseUrl,
      devSafeEmails,
    };
  },
});

// Initialize 120 orchestrations (40 parallel, 40 chain, 40 consensus)
export const initializeOrchestrations = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if already initialized
    const existingParallel = await ctx.db.query("parallelOrchestrations").first();
    if (existingParallel) {
      return { message: "Orchestrations already initialized", count: 0 };
    }

    let totalSeeded = 0;

    // PARALLEL ORCHESTRATIONS - 40 total (10 per tier)
    const parallelOrchestrations = [
      // Solopreneur tier (10)
      { name: "Content Generation Sprint", description: "Generate multiple content pieces simultaneously", agents: [{ agentKey: "content_writer", mode: "proposeNextAction" }, { agentKey: "seo_optimizer", mode: "analyzeData" }], tier: "solopreneur" },
      { name: "Social Media Blitz", description: "Create posts for all platforms at once", agents: [{ agentKey: "social_media_manager", mode: "proposeNextAction" }, { agentKey: "content_writer", mode: "summarizeIdeas" }], tier: "solopreneur" },
      { name: "Email Campaign Builder", description: "Draft multiple email variants", agents: [{ agentKey: "email_marketer", mode: "proposeNextAction" }, { agentKey: "copywriter", mode: "summarizeIdeas" }], tier: "solopreneur" },
      { name: "Brand Voice Analysis", description: "Analyze brand consistency across channels", agents: [{ agentKey: "brand_strategist", mode: "analyzeData" }, { agentKey: "content_writer", mode: "summarizeIdeas" }], tier: "solopreneur" },
      { name: "Quick Market Research", description: "Gather insights from multiple sources", agents: [{ agentKey: "market_researcher", mode: "analyzeData" }, { agentKey: "data_analyst", mode: "analyzeData" }], tier: "solopreneur" },
      { name: "Customer Feedback Analysis", description: "Process feedback from multiple channels", agents: [{ agentKey: "customer_success", mode: "analyzeData" }, { agentKey: "sentiment_analyzer", mode: "analyzeData" }], tier: "solopreneur" },
      { name: "Product Launch Prep", description: "Prepare launch materials in parallel", agents: [{ agentKey: "product_manager", mode: "proposeNextAction" }, { agentKey: "content_writer", mode: "proposeNextAction" }], tier: "solopreneur" },
      { name: "Weekly Planning Assistant", description: "Plan week across multiple areas", agents: [{ agentKey: "executive_assistant", mode: "planWeek" }, { agentKey: "task_manager", mode: "proposeNextAction" }], tier: "solopreneur" },
      { name: "Competitor Analysis", description: "Analyze multiple competitors simultaneously", agents: [{ agentKey: "market_researcher", mode: "analyzeData" }, { agentKey: "business_analyst", mode: "analyzeData" }], tier: "solopreneur" },
      { name: "Content Repurposing", description: "Repurpose content for multiple formats", agents: [{ agentKey: "content_writer", mode: "proposeNextAction" }, { agentKey: "video_editor", mode: "proposeNextAction" }], tier: "solopreneur" },
      
      // Startup tier (10)
      { name: "Team Onboarding Flow", description: "Onboard multiple team members", agents: [{ agentKey: "hr_manager", mode: "proposeNextAction" }, { agentKey: "training_coordinator", mode: "proposeNextAction" }], tier: "startup" },
      { name: "Multi-Channel Campaign", description: "Launch campaigns across channels", agents: [{ agentKey: "marketing_manager", mode: "proposeNextAction" }, { agentKey: "social_media_manager", mode: "proposeNextAction" }], tier: "startup" },
      { name: "Product Feature Analysis", description: "Analyze multiple feature requests", agents: [{ agentKey: "product_manager", mode: "analyzeData" }, { agentKey: "ux_researcher", mode: "analyzeData" }], tier: "startup" },
      { name: "Sales Pipeline Review", description: "Review multiple deals in parallel", agents: [{ agentKey: "sales_manager", mode: "analyzeData" }, { agentKey: "crm_specialist", mode: "analyzeData" }], tier: "startup" },
      { name: "Customer Journey Mapping", description: "Map journeys for different segments", agents: [{ agentKey: "ux_researcher", mode: "analyzeData" }, { agentKey: "customer_success", mode: "analyzeData" }], tier: "startup" },
      { name: "Growth Experiment Setup", description: "Set up multiple A/B tests", agents: [{ agentKey: "growth_hacker", mode: "proposeNextAction" }, { agentKey: "data_analyst", mode: "analyzeData" }], tier: "startup" },
      { name: "Investor Update Prep", description: "Prepare materials for investors", agents: [{ agentKey: "cfo", mode: "proposeNextAction" }, { agentKey: "business_analyst", mode: "analyzeData" }], tier: "startup" },
      { name: "Sprint Planning", description: "Plan sprints across teams", agents: [{ agentKey: "scrum_master", mode: "planWeek" }, { agentKey: "product_manager", mode: "proposeNextAction" }], tier: "startup" },
      { name: "Content Calendar Build", description: "Build content calendar for quarter", agents: [{ agentKey: "content_strategist", mode: "planWeek" }, { agentKey: "social_media_manager", mode: "proposeNextAction" }], tier: "startup" },
      { name: "Partnership Outreach", description: "Draft outreach for multiple partners", agents: [{ agentKey: "partnership_manager", mode: "proposeNextAction" }, { agentKey: "business_development", mode: "proposeNextAction" }], tier: "startup" },
      
      // SME tier (10)
      { name: "Department Budget Review", description: "Review budgets across departments", agents: [{ agentKey: "cfo", mode: "analyzeData" }, { agentKey: "finance_analyst", mode: "analyzeData" }], tier: "sme" },
      { name: "Compliance Audit Prep", description: "Prepare for multi-area audit", agents: [{ agentKey: "compliance_officer", mode: "analyzeData" }, { agentKey: "legal_counsel", mode: "analyzeData" }], tier: "sme" },
      { name: "Vendor Performance Review", description: "Review multiple vendor contracts", agents: [{ agentKey: "procurement_manager", mode: "analyzeData" }, { agentKey: "finance_analyst", mode: "analyzeData" }], tier: "sme" },
      { name: "Risk Assessment", description: "Assess risks across business units", agents: [{ agentKey: "risk_manager", mode: "analyzeData" }, { agentKey: "compliance_officer", mode: "analyzeData" }], tier: "sme" },
      { name: "Strategic Initiative Planning", description: "Plan multiple strategic initiatives", agents: [{ agentKey: "strategy_consultant", mode: "proposeNextAction" }, { agentKey: "business_analyst", mode: "analyzeData" }], tier: "sme" },
      { name: "Employee Performance Review", description: "Review performance across teams", agents: [{ agentKey: "hr_manager", mode: "analyzeData" }, { agentKey: "department_head", mode: "analyzeData" }], tier: "sme" },
      { name: "Market Expansion Analysis", description: "Analyze multiple market opportunities", agents: [{ agentKey: "market_researcher", mode: "analyzeData" }, { agentKey: "business_analyst", mode: "analyzeData" }], tier: "sme" },
      { name: "Process Optimization", description: "Optimize processes across departments", agents: [{ agentKey: "operations_manager", mode: "analyzeData" }, { agentKey: "process_engineer", mode: "proposeNextAction" }], tier: "sme" },
      { name: "Customer Segmentation", description: "Segment customers by multiple criteria", agents: [{ agentKey: "data_analyst", mode: "analyzeData" }, { agentKey: "marketing_manager", mode: "analyzeData" }], tier: "sme" },
      { name: "Technology Stack Review", description: "Review tech stack across teams", agents: [{ agentKey: "cto", mode: "analyzeData" }, { agentKey: "it_manager", mode: "analyzeData" }], tier: "sme" },
      
      // Enterprise tier (10)
      { name: "Global Campaign Coordination", description: "Coordinate campaigns across regions", agents: [{ agentKey: "global_marketing_director", mode: "proposeNextAction" }, { agentKey: "regional_manager", mode: "proposeNextAction" }], tier: "enterprise" },
      { name: "Portfolio Risk Analysis", description: "Analyze risk across business portfolio", agents: [{ agentKey: "chief_risk_officer", mode: "analyzeData" }, { agentKey: "portfolio_manager", mode: "analyzeData" }], tier: "enterprise" },
      { name: "M&A Due Diligence", description: "Conduct due diligence on multiple targets", agents: [{ agentKey: "m_and_a_specialist", mode: "analyzeData" }, { agentKey: "legal_counsel", mode: "analyzeData" }], tier: "enterprise" },
      { name: "Enterprise Security Audit", description: "Audit security across all systems", agents: [{ agentKey: "ciso", mode: "analyzeData" }, { agentKey: "security_analyst", mode: "analyzeData" }], tier: "enterprise" },
      { name: "Workforce Planning", description: "Plan workforce across divisions", agents: [{ agentKey: "chro", mode: "planWeek" }, { agentKey: "workforce_analyst", mode: "analyzeData" }], tier: "enterprise" },
      { name: "Supply Chain Optimization", description: "Optimize supply chain globally", agents: [{ agentKey: "supply_chain_director", mode: "analyzeData" }, { agentKey: "logistics_manager", mode: "proposeNextAction" }], tier: "enterprise" },
      { name: "Regulatory Compliance Check", description: "Check compliance across jurisdictions", agents: [{ agentKey: "compliance_officer", mode: "analyzeData" }, { agentKey: "legal_counsel", mode: "analyzeData" }], tier: "enterprise" },
      { name: "Innovation Pipeline Review", description: "Review innovation projects", agents: [{ agentKey: "innovation_director", mode: "analyzeData" }, { agentKey: "r_and_d_manager", mode: "analyzeData" }], tier: "enterprise" },
      { name: "Customer Experience Analysis", description: "Analyze CX across touchpoints", agents: [{ agentKey: "cx_director", mode: "analyzeData" }, { agentKey: "customer_insights", mode: "analyzeData" }], tier: "enterprise" },
      { name: "Digital Transformation", description: "Plan digital transformation initiatives", agents: [{ agentKey: "cto", mode: "proposeNextAction" }, { agentKey: "change_manager", mode: "proposeNextAction" }], tier: "enterprise" },
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
      // Solopreneur tier (10)
      { name: "Blog Post Pipeline", description: "Research → Draft → Edit → Optimize", chain: [{ agentKey: "market_researcher", mode: "analyzeData" }, { agentKey: "content_writer", mode: "proposeNextAction" }, { agentKey: "editor", mode: "summarizeIdeas" }, { agentKey: "seo_optimizer", mode: "analyzeData" }], initialInput: "Create a blog post about AI trends", tier: "solopreneur" },
      { name: "Social Content Flow", description: "Idea → Draft → Design → Schedule", chain: [{ agentKey: "content_strategist", mode: "proposeNextAction" }, { agentKey: "copywriter", mode: "proposeNextAction" }, { agentKey: "graphic_designer", mode: "proposeNextAction" }, { agentKey: "social_media_manager", mode: "proposeNextAction" }], initialInput: "Create social media content", tier: "solopreneur" },
      { name: "Email Sequence Builder", description: "Strategy → Write → Review → Schedule", chain: [{ agentKey: "email_marketer", mode: "proposeNextAction" }, { agentKey: "copywriter", mode: "proposeNextAction" }, { agentKey: "editor", mode: "summarizeIdeas" }, { agentKey: "automation_specialist", mode: "proposeNextAction" }], initialInput: "Build welcome email sequence", tier: "solopreneur" },
      { name: "Product Launch Sequence", description: "Plan → Create → Review → Launch", chain: [{ agentKey: "product_manager", mode: "proposeNextAction" }, { agentKey: "content_writer", mode: "proposeNextAction" }, { agentKey: "marketing_manager", mode: "analyzeData" }, { agentKey: "launch_coordinator", mode: "proposeNextAction" }], initialInput: "Launch new product", tier: "solopreneur" },
      { name: "Customer Onboarding", description: "Welcome → Train → Support → Follow-up", chain: [{ agentKey: "customer_success", mode: "proposeNextAction" }, { agentKey: "training_coordinator", mode: "proposeNextAction" }, { agentKey: "support_specialist", mode: "proposeNextAction" }, { agentKey: "account_manager", mode: "proposeNextAction" }], initialInput: "Onboard new customer", tier: "solopreneur" },
      { name: "Content Repurpose Chain", description: "Original → Adapt → Format → Distribute", chain: [{ agentKey: "content_writer", mode: "summarizeIdeas" }, { agentKey: "content_strategist", mode: "proposeNextAction" }, { agentKey: "video_editor", mode: "proposeNextAction" }, { agentKey: "social_media_manager", mode: "proposeNextAction" }], initialInput: "Repurpose blog into video", tier: "solopreneur" },
      { name: "Lead Nurture Sequence", description: "Capture → Qualify → Nurture → Convert", chain: [{ agentKey: "lead_gen_specialist", mode: "proposeNextAction" }, { agentKey: "sales_qualifier", mode: "analyzeData" }, { agentKey: "email_marketer", mode: "proposeNextAction" }, { agentKey: "sales_closer", mode: "proposeNextAction" }], initialInput: "Nurture new leads", tier: "solopreneur" },
      { name: "Brand Story Development", description: "Research → Draft → Refine → Publish", chain: [{ agentKey: "brand_strategist", mode: "analyzeData" }, { agentKey: "copywriter", mode: "proposeNextAction" }, { agentKey: "editor", mode: "summarizeIdeas" }, { agentKey: "content_writer", mode: "proposeNextAction" }], initialInput: "Develop brand story", tier: "solopreneur" },
      { name: "SEO Content Optimization", description: "Audit → Research → Optimize → Monitor", chain: [{ agentKey: "seo_optimizer", mode: "analyzeData" }, { agentKey: "keyword_researcher", mode: "analyzeData" }, { agentKey: "content_writer", mode: "proposeNextAction" }, { agentKey: "analytics_specialist", mode: "analyzeData" }], initialInput: "Optimize website for SEO", tier: "solopreneur" },
      { name: "Weekly Content Creation", description: "Plan → Create → Review → Publish", chain: [{ agentKey: "content_strategist", mode: "planWeek" }, { agentKey: "content_writer", mode: "proposeNextAction" }, { agentKey: "editor", mode: "summarizeIdeas" }, { agentKey: "social_media_manager", mode: "proposeNextAction" }], initialInput: "Create weekly content", tier: "solopreneur" },
      
      // Startup tier (10)
      { name: "Feature Development Flow", description: "Spec → Design → Build → Test → Launch", chain: [{ agentKey: "product_manager", mode: "proposeNextAction" }, { agentKey: "ux_designer", mode: "proposeNextAction" }, { agentKey: "engineer", mode: "proposeNextAction" }, { agentKey: "qa_tester", mode: "analyzeData" }, { agentKey: "launch_coordinator", mode: "proposeNextAction" }], initialInput: "Develop new feature", tier: "startup" },
      { name: "Sales Process Chain", description: "Prospect → Qualify → Demo → Propose → Close", chain: [{ agentKey: "sdr", mode: "proposeNextAction" }, { agentKey: "sales_qualifier", mode: "analyzeData" }, { agentKey: "sales_engineer", mode: "proposeNextAction" }, { agentKey: "account_executive", mode: "proposeNextAction" }, { agentKey: "sales_closer", mode: "proposeNextAction" }], initialInput: "Close new deal", tier: "startup" },
      { name: "Marketing Campaign Chain", description: "Strategy → Create → Launch → Analyze → Optimize", chain: [{ agentKey: "marketing_manager", mode: "proposeNextAction" }, { agentKey: "content_writer", mode: "proposeNextAction" }, { agentKey: "campaign_manager", mode: "proposeNextAction" }, { agentKey: "data_analyst", mode: "analyzeData" }, { agentKey: "growth_hacker", mode: "proposeNextAction" }], initialInput: "Run marketing campaign", tier: "startup" },
      { name: "Customer Support Escalation", description: "Ticket → Triage → Resolve → Follow-up → Analyze", chain: [{ agentKey: "support_specialist", mode: "proposeNextAction" }, { agentKey: "support_manager", mode: "analyzeData" }, { agentKey: "technical_support", mode: "proposeNextAction" }, { agentKey: "customer_success", mode: "proposeNextAction" }, { agentKey: "quality_analyst", mode: "analyzeData" }], initialInput: "Handle support ticket", tier: "startup" },
      { name: "Hiring Pipeline", description: "Source → Screen → Interview → Offer → Onboard", chain: [{ agentKey: "recruiter", mode: "proposeNextAction" }, { agentKey: "hr_screener", mode: "analyzeData" }, { agentKey: "hiring_manager", mode: "analyzeData" }, { agentKey: "hr_manager", mode: "proposeNextAction" }, { agentKey: "onboarding_specialist", mode: "proposeNextAction" }], initialInput: "Hire new team member", tier: "startup" },
      { name: "Product Launch Chain", description: "Plan → Build → Test → Market → Launch", chain: [{ agentKey: "product_manager", mode: "proposeNextAction" }, { agentKey: "engineer", mode: "proposeNextAction" }, { agentKey: "qa_tester", mode: "analyzeData" }, { agentKey: "marketing_manager", mode: "proposeNextAction" }, { agentKey: "launch_coordinator", mode: "proposeNextAction" }], initialInput: "Launch new product", tier: "startup" },
      { name: "Partnership Development", description: "Research → Outreach → Negotiate → Contract → Activate", chain: [{ agentKey: "partnership_manager", mode: "analyzeData" }, { agentKey: "business_development", mode: "proposeNextAction" }, { agentKey: "negotiator", mode: "proposeNextAction" }, { agentKey: "legal_counsel", mode: "analyzeData" }, { agentKey: "partnership_manager", mode: "proposeNextAction" }], initialInput: "Establish partnership", tier: "startup" },
      { name: "Content Marketing Funnel", description: "Research → Create → Distribute → Nurture → Convert", chain: [{ agentKey: "market_researcher", mode: "analyzeData" }, { agentKey: "content_writer", mode: "proposeNextAction" }, { agentKey: "social_media_manager", mode: "proposeNextAction" }, { agentKey: "email_marketer", mode: "proposeNextAction" }, { agentKey: "sales_closer", mode: "proposeNextAction" }], initialInput: "Run content funnel", tier: "startup" },
      { name: "User Feedback Loop", description: "Collect → Analyze → Prioritize → Implement → Communicate", chain: [{ agentKey: "customer_success", mode: "proposeNextAction" }, { agentKey: "ux_researcher", mode: "analyzeData" }, { agentKey: "product_manager", mode: "analyzeData" }, { agentKey: "engineer", mode: "proposeNextAction" }, { agentKey: "customer_success", mode: "proposeNextAction" }], initialInput: "Process user feedback", tier: "startup" },
      { name: "Growth Experiment Chain", description: "Hypothesize → Design → Execute → Analyze → Scale", chain: [{ agentKey: "growth_hacker", mode: "proposeNextAction" }, { agentKey: "ux_designer", mode: "proposeNextAction" }, { agentKey: "engineer", mode: "proposeNextAction" }, { agentKey: "data_analyst", mode: "analyzeData" }, { agentKey: "growth_hacker", mode: "proposeNextAction" }], initialInput: "Run growth experiment", tier: "startup" },
      
      // SME tier (10)
      { name: "Strategic Planning Chain", description: "Analyze → Plan → Budget → Approve → Execute", chain: [{ agentKey: "business_analyst", mode: "analyzeData" }, { agentKey: "strategy_consultant", mode: "proposeNextAction" }, { agentKey: "cfo", mode: "analyzeData" }, { agentKey: "ceo", mode: "proposeNextAction" }, { agentKey: "operations_manager", mode: "proposeNextAction" }], initialInput: "Develop strategic plan", tier: "sme" },
      { name: "Compliance Review Chain", description: "Audit → Identify → Remediate → Verify → Report", chain: [{ agentKey: "compliance_officer", mode: "analyzeData" }, { agentKey: "risk_manager", mode: "analyzeData" }, { agentKey: "operations_manager", mode: "proposeNextAction" }, { agentKey: "compliance_officer", mode: "analyzeData" }, { agentKey: "legal_counsel", mode: "proposeNextAction" }], initialInput: "Conduct compliance review", tier: "sme" },
      { name: "Vendor Selection Process", description: "Requirements → Research → Evaluate → Negotiate → Contract", chain: [{ agentKey: "procurement_manager", mode: "proposeNextAction" }, { agentKey: "market_researcher", mode: "analyzeData" }, { agentKey: "evaluation_committee", mode: "analyzeData" }, { agentKey: "negotiator", mode: "proposeNextAction" }, { agentKey: "legal_counsel", mode: "proposeNextAction" }], initialInput: "Select new vendor", tier: "sme" },
      { name: "Budget Planning Chain", description: "Forecast → Allocate → Review → Approve → Monitor", chain: [{ agentKey: "finance_analyst", mode: "analyzeData" }, { agentKey: "cfo", mode: "proposeNextAction" }, { agentKey: "department_head", mode: "analyzeData" }, { agentKey: "ceo", mode: "proposeNextAction" }, { agentKey: "finance_analyst", mode: "analyzeData" }], initialInput: "Plan annual budget", tier: "sme" },
      { name: "Process Improvement Chain", description: "Map → Analyze → Design → Implement → Measure", chain: [{ agentKey: "process_engineer", mode: "analyzeData" }, { agentKey: "business_analyst", mode: "analyzeData" }, { agentKey: "operations_manager", mode: "proposeNextAction" }, { agentKey: "change_manager", mode: "proposeNextAction" }, { agentKey: "quality_analyst", mode: "analyzeData" }], initialInput: "Improve business process", tier: "sme" },
      { name: "Risk Management Chain", description: "Identify → Assess → Mitigate → Monitor → Report", chain: [{ agentKey: "risk_manager", mode: "analyzeData" }, { agentKey: "business_analyst", mode: "analyzeData" }, { agentKey: "operations_manager", mode: "proposeNextAction" }, { agentKey: "risk_manager", mode: "analyzeData" }, { agentKey: "compliance_officer", mode: "proposeNextAction" }], initialInput: "Manage business risks", tier: "sme" },
      { name: "Market Expansion Chain", description: "Research → Plan → Test → Launch → Scale", chain: [{ agentKey: "market_researcher", mode: "analyzeData" }, { agentKey: "strategy_consultant", mode: "proposeNextAction" }, { agentKey: "pilot_manager", mode: "proposeNextAction" }, { agentKey: "launch_coordinator", mode: "proposeNextAction" }, { agentKey: "growth_manager", mode: "proposeNextAction" }], initialInput: "Expand to new market", tier: "sme" },
      { name: "Employee Development Chain", description: "Assess → Plan → Train → Mentor → Evaluate", chain: [{ agentKey: "hr_manager", mode: "analyzeData" }, { agentKey: "learning_director", mode: "proposeNextAction" }, { agentKey: "training_coordinator", mode: "proposeNextAction" }, { agentKey: "mentor", mode: "proposeNextAction" }, { agentKey: "performance_manager", mode: "analyzeData" }], initialInput: "Develop employee skills", tier: "sme" },
      { name: "Customer Retention Chain", description: "Analyze → Segment → Engage → Support → Upsell", chain: [{ agentKey: "data_analyst", mode: "analyzeData" }, { agentKey: "customer_insights", mode: "analyzeData" }, { agentKey: "customer_success", mode: "proposeNextAction" }, { agentKey: "support_specialist", mode: "proposeNextAction" }, { agentKey: "account_manager", mode: "proposeNextAction" }], initialInput: "Improve customer retention", tier: "sme" },
      { name: "Technology Implementation", description: "Assess → Select → Plan → Deploy → Optimize", chain: [{ agentKey: "it_manager", mode: "analyzeData" }, { agentKey: "technology_consultant", mode: "proposeNextAction" }, { agentKey: "project_manager", mode: "proposeNextAction" }, { agentKey: "implementation_specialist", mode: "proposeNextAction" }, { agentKey: "it_manager", mode: "analyzeData" }], initialInput: "Implement new technology", tier: "sme" },
      
      // Enterprise tier (10)
      { name: "M&A Integration Chain", description: "Due Diligence → Plan → Integrate → Optimize → Stabilize", chain: [{ agentKey: "m_and_a_specialist", mode: "analyzeData" }, { agentKey: "integration_manager", mode: "proposeNextAction" }, { agentKey: "change_manager", mode: "proposeNextAction" }, { agentKey: "operations_director", mode: "proposeNextAction" }, { agentKey: "ceo", mode: "analyzeData" }], initialInput: "Integrate acquisition", tier: "enterprise" },
      { name: "Global Expansion Chain", description: "Research → Strategy → Localize → Launch → Scale", chain: [{ agentKey: "global_strategy", mode: "analyzeData" }, { agentKey: "expansion_director", mode: "proposeNextAction" }, { agentKey: "localization_manager", mode: "proposeNextAction" }, { agentKey: "regional_director", mode: "proposeNextAction" }, { agentKey: "growth_director", mode: "proposeNextAction" }], initialInput: "Expand globally", tier: "enterprise" },
      { name: "Digital Transformation Chain", description: "Assess → Vision → Roadmap → Execute → Measure", chain: [{ agentKey: "cto", mode: "analyzeData" }, { agentKey: "transformation_consultant", mode: "proposeNextAction" }, { agentKey: "program_manager", mode: "proposeNextAction" }, { agentKey: "change_manager", mode: "proposeNextAction" }, { agentKey: "analytics_director", mode: "analyzeData" }], initialInput: "Transform digitally", tier: "enterprise" },
      { name: "Enterprise Security Chain", description: "Audit → Assess → Remediate → Monitor → Report", chain: [{ agentKey: "ciso", mode: "analyzeData" }, { agentKey: "security_analyst", mode: "analyzeData" }, { agentKey: "security_engineer", mode: "proposeNextAction" }, { agentKey: "soc_manager", mode: "analyzeData" }, { agentKey: "compliance_officer", mode: "proposeNextAction" }], initialInput: "Secure enterprise", tier: "enterprise" },
      { name: "Portfolio Optimization Chain", description: "Analyze → Prioritize → Allocate → Execute → Review", chain: [{ agentKey: "portfolio_manager", mode: "analyzeData" }, { agentKey: "strategy_consultant", mode: "proposeNextAction" }, { agentKey: "cfo", mode: "proposeNextAction" }, { agentKey: "program_director", mode: "proposeNextAction" }, { agentKey: "portfolio_manager", mode: "analyzeData" }], initialInput: "Optimize portfolio", tier: "enterprise" },
      { name: "Regulatory Compliance Chain", description: "Monitor → Assess → Implement → Verify → Report", chain: [{ agentKey: "compliance_officer", mode: "analyzeData" }, { agentKey: "legal_counsel", mode: "analyzeData" }, { agentKey: "operations_director", mode: "proposeNextAction" }, { agentKey: "audit_manager", mode: "analyzeData" }, { agentKey: "compliance_officer", mode: "proposeNextAction" }], initialInput: "Ensure compliance", tier: "enterprise" },
      { name: "Innovation Pipeline Chain", description: "Ideate → Evaluate → Prototype → Test → Scale", chain: [{ agentKey: "innovation_director", mode: "proposeNextAction" }, { agentKey: "evaluation_committee", mode: "analyzeData" }, { agentKey: "r_and_d_manager", mode: "proposeNextAction" }, { agentKey: "pilot_manager", mode: "analyzeData" }, { agentKey: "commercialization_manager", mode: "proposeNextAction" }], initialInput: "Develop innovation", tier: "enterprise" },
      { name: "Workforce Transformation", description: "Assess → Plan → Reskill → Deploy → Measure", chain: [{ agentKey: "chro", mode: "analyzeData" }, { agentKey: "workforce_planner", mode: "proposeNextAction" }, { agentKey: "learning_director", mode: "proposeNextAction" }, { agentKey: "talent_manager", mode: "proposeNextAction" }, { agentKey: "hr_analytics", mode: "analyzeData" }], initialInput: "Transform workforce", tier: "enterprise" },
      { name: "Supply Chain Resilience", description: "Map → Assess → Diversify → Monitor → Optimize", chain: [{ agentKey: "supply_chain_director", mode: "analyzeData" }, { agentKey: "risk_manager", mode: "analyzeData" }, { agentKey: "procurement_director", mode: "proposeNextAction" }, { agentKey: "operations_director", mode: "analyzeData" }, { agentKey: "supply_chain_director", mode: "proposeNextAction" }], initialInput: "Build supply chain resilience", tier: "enterprise" },
      { name: "Customer Experience Transformation", description: "Research → Design → Implement → Measure → Optimize", chain: [{ agentKey: "cx_director", mode: "analyzeData" }, { agentKey: "ux_researcher", mode: "analyzeData" }, { agentKey: "cx_designer", mode: "proposeNextAction" }, { agentKey: "implementation_manager", mode: "proposeNextAction" }, { agentKey: "cx_analytics", mode: "analyzeData" }], initialInput: "Transform customer experience", tier: "enterprise" },
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
      // Solopreneur tier (10)
      { name: "Content Topic Selection", description: "Get consensus on best content topic", agents: ["content_strategist", "seo_optimizer", "audience_analyst"], question: "What content topic should we prioritize?", consensusThreshold: 0.7, tier: "solopreneur" },
      { name: "Brand Voice Decision", description: "Decide on brand voice direction", agents: ["brand_strategist", "copywriter", "marketing_manager"], question: "What brand voice should we adopt?", consensusThreshold: 0.7, tier: "solopreneur" },
      { name: "Pricing Strategy", description: "Determine optimal pricing", agents: ["pricing_analyst", "market_researcher", "sales_manager"], question: "What pricing strategy should we use?", consensusThreshold: 0.7, tier: "solopreneur" },
      { name: "Feature Prioritization", description: "Prioritize product features", agents: ["product_manager", "customer_success", "engineer"], question: "Which feature should we build next?", consensusThreshold: 0.7, tier: "solopreneur" },
      { name: "Marketing Channel Selection", description: "Choose best marketing channels", agents: ["marketing_manager", "growth_hacker", "data_analyst"], question: "Which marketing channels should we focus on?", consensusThreshold: 0.7, tier: "solopreneur" },
      { name: "Target Audience Definition", description: "Define target audience", agents: ["market_researcher", "marketing_manager", "sales_manager"], question: "Who is our ideal customer?", consensusThreshold: 0.7, tier: "solopreneur" },
      { name: "Content Format Decision", description: "Choose content format", agents: ["content_strategist", "video_producer", "social_media_manager"], question: "What content format should we use?", consensusThreshold: 0.7, tier: "solopreneur" },
      { name: "Partnership Evaluation", description: "Evaluate partnership opportunity", agents: ["business_development", "cfo", "marketing_manager"], question: "Should we pursue this partnership?", consensusThreshold: 0.7, tier: "solopreneur" },
      { name: "Product Launch Timing", description: "Decide when to launch", agents: ["product_manager", "marketing_manager", "sales_manager"], question: "When should we launch the product?", consensusThreshold: 0.7, tier: "solopreneur" },
      { name: "Tool Selection", description: "Choose business tools", agents: ["operations_manager", "cfo", "it_specialist"], question: "Which tool should we adopt?", consensusThreshold: 0.7, tier: "solopreneur" },
      
      // Startup tier (10)
      { name: "Hiring Decision", description: "Make hiring decisions", agents: ["hiring_manager", "team_lead", "hr_manager"], question: "Should we hire this candidate?", consensusThreshold: 0.75, tier: "startup" },
      { name: "Product Roadmap Priority", description: "Prioritize roadmap items", agents: ["product_manager", "cto", "customer_success"], question: "What should be our top roadmap priority?", consensusThreshold: 0.75, tier: "startup" },
      { name: "Market Positioning", description: "Define market position", agents: ["marketing_manager", "product_manager", "sales_manager"], question: "How should we position in the market?", consensusThreshold: 0.75, tier: "startup" },
      { name: "Investment Decision", description: "Evaluate investment opportunities", agents: ["cfo", "ceo", "board_advisor"], question: "Should we make this investment?", consensusThreshold: 0.8, tier: "startup" },
      { name: "Pivot Evaluation", description: "Decide on business pivot", agents: ["ceo", "cto", "cfo"], question: "Should we pivot our business model?", consensusThreshold: 0.8, tier: "startup" },
      { name: "Partnership Terms", description: "Agree on partnership terms", agents: ["partnership_manager", "legal_counsel", "cfo"], question: "Are these partnership terms acceptable?", consensusThreshold: 0.75, tier: "startup" },
      { name: "Customer Segment Focus", description: "Choose customer segment", agents: ["marketing_manager", "sales_manager", "product_manager"], question: "Which customer segment should we target?", consensusThreshold: 0.75, tier: "startup" },
      { name: "Technology Stack Decision", description: "Select technology stack", agents: ["cto", "lead_engineer", "devops_manager"], question: "What technology stack should we use?", consensusThreshold: 0.75, tier: "startup" },
      { name: "Funding Round Decision", description: "Decide on fundraising", agents: ["ceo", "cfo", "board_advisor"], question: "Should we raise another funding round?", consensusThreshold: 0.8, tier: "startup" },
      { name: "Expansion Market Selection", description: "Choose expansion market", agents: ["ceo", "market_researcher", "sales_director"], question: "Which market should we expand to?", consensusThreshold: 0.75, tier: "startup" },
      
      // SME tier (10)
      { name: "Strategic Initiative Approval", description: "Approve strategic initiatives", agents: ["ceo", "cfo", "strategy_consultant"], question: "Should we approve this strategic initiative?", consensusThreshold: 0.8, tier: "sme" },
      { name: "Vendor Selection", description: "Select enterprise vendor", agents: ["procurement_manager", "cfo", "operations_director"], question: "Which vendor should we select?", consensusThreshold: 0.75, tier: "sme" },
      { name: "Organizational Restructure", description: "Decide on restructuring", agents: ["ceo", "chro", "operations_director"], question: "Should we restructure the organization?", consensusThreshold: 0.8, tier: "sme" },
      { name: "Budget Allocation", description: "Allocate departmental budgets", agents: ["cfo", "department_heads", "ceo"], question: "How should we allocate the budget?", consensusThreshold: 0.75, tier: "sme" },
      { name: "Risk Mitigation Strategy", description: "Choose risk mitigation approach", agents: ["risk_manager", "cfo", "operations_director"], question: "What risk mitigation strategy should we adopt?", consensusThreshold: 0.75, tier: "sme" },
      { name: "Compliance Approach", description: "Decide compliance strategy", agents: ["compliance_officer", "legal_counsel", "cfo"], question: "What compliance approach should we take?", consensusThreshold: 0.8, tier: "sme" },
      { name: "Process Standardization", description: "Standardize business processes", agents: ["operations_director", "process_engineer", "quality_manager"], question: "Should we standardize this process?", consensusThreshold: 0.75, tier: "sme" },
      { name: "Technology Investment", description: "Approve technology investments", agents: ["cto", "cfo", "operations_director"], question: "Should we invest in this technology?", consensusThreshold: 0.75, tier: "sme" },
      { name: "Market Entry Strategy", description: "Decide market entry approach", agents: ["ceo", "market_researcher", "strategy_consultant"], question: "What market entry strategy should we use?", consensusThreshold: 0.75, tier: "sme" },
      { name: "Sustainability Initiative", description: "Approve sustainability programs", agents: ["ceo", "sustainability_officer", "cfo"], question: "Should we implement this sustainability initiative?", consensusThreshold: 0.75, tier: "sme" },
      
      // Enterprise tier (10)
      { name: "M&A Target Evaluation", description: "Evaluate acquisition targets", agents: ["ceo", "cfo", "m_and_a_specialist"], question: "Should we acquire this company?", consensusThreshold: 0.85, tier: "enterprise" },
      { name: "Global Strategy Decision", description: "Set global strategy", agents: ["ceo", "global_strategy", "board_members"], question: "What should our global strategy be?", consensusThreshold: 0.85, tier: "enterprise" },
      { name: "Digital Transformation Approach", description: "Choose transformation path", agents: ["ceo", "cto", "transformation_consultant"], question: "What digital transformation approach should we take?", consensusThreshold: 0.8, tier: "enterprise" },
      { name: "Portfolio Rationalization", description: "Rationalize business portfolio", agents: ["ceo", "cfo", "portfolio_manager"], question: "Should we divest this business unit?", consensusThreshold: 0.85, tier: "enterprise" },
      { name: "Enterprise Architecture", description: "Define enterprise architecture", agents: ["cto", "enterprise_architect", "cio"], question: "What enterprise architecture should we adopt?", consensusThreshold: 0.8, tier: "enterprise" },
      { name: "Regulatory Response Strategy", description: "Respond to regulations", agents: ["ceo", "legal_counsel", "compliance_officer"], question: "How should we respond to new regulations?", consensusThreshold: 0.85, tier: "enterprise" },
      { name: "Innovation Investment", description: "Invest in innovation", agents: ["ceo", "innovation_director", "cfo"], question: "Should we invest in this innovation?", consensusThreshold: 0.8, tier: "enterprise" },
      { name: "Workforce Strategy", description: "Set workforce strategy", agents: ["chro", "ceo", "workforce_planner"], question: "What workforce strategy should we adopt?", consensusThreshold: 0.8, tier: "enterprise" },
      { name: "Supply Chain Strategy", description: "Define supply chain approach", agents: ["supply_chain_director", "cfo", "operations_director"], question: "What supply chain strategy should we use?", consensusThreshold: 0.8, tier: "enterprise" },
      { name: "Customer Experience Vision", description: "Set CX vision", agents: ["cx_director", "ceo", "cmo"], question: "What should our customer experience vision be?", consensusThreshold: 0.8, tier: "enterprise" },
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
      message: "120 orchestrations initialized successfully",
      totalSeeded,
      breakdown: {
        parallel: parallelOrchestrations.length,
        chain: chainOrchestrations.length,
        consensus: consensusOrchestrations.length,
      },
    };
  },
});