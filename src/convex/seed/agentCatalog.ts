import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const applyAgentCatalogSeed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const defaults: Array<{
      agent_key: string;
      display_name: string;
      short_desc: string;
      long_desc: string;
      capabilities: string[];
      default_model: string;
      model_routing: string;
      prompt_template_version: string;
      prompt_templates: string;
      input_schema: string;
      output_schema: string;
      tier_restrictions: string[];
      confidence_hint: number;
      active: boolean;
    }> = [
      {
        agent_key: "strategic_planning",
        display_name: "Strategic Planning",
        short_desc: "Creates strategic roadmaps and OKRs.",
        long_desc: "Analyzes business context and drafts clear OKRs and roadmaps.",
        capabilities: ["plan", "prioritize", "okr"],
        default_model: "gpt-4o-mini",
        model_routing: "",
        prompt_template_version: "v1",
        prompt_templates: "",
        input_schema: "{}",
        output_schema: "{}",
        tier_restrictions: [],
        confidence_hint: 0.8,
        active: true,
      },
      {
        agent_key: "customer_support",
        display_name: "Customer Support",
        short_desc: "Drafts helpful, empathetic replies.",
        long_desc: "Summarizes tickets and proposes tiered responses.",
        capabilities: ["summarize", "reply", "triage"],
        default_model: "gpt-4o-mini",
        model_routing: "",
        prompt_template_version: "v1",
        prompt_templates: "",
        input_schema: "{}",
        output_schema: "{}",
        tier_restrictions: [],
        confidence_hint: 0.8,
        active: true,
      },
      {
        agent_key: "sales_intelligence",
        display_name: "Sales Intelligence",
        short_desc: "Discovers leads and crafts outreach.",
        long_desc: "Surfaces ideal prospects and produces tailored messaging.",
        capabilities: ["prospect", "enrich", "outreach"],
        default_model: "gpt-4o-mini",
        model_routing: "",
        prompt_template_version: "v1",
        prompt_templates: "",
        input_schema: "{}",
        output_schema: "{}",
        tier_restrictions: [],
        confidence_hint: 0.8,
        active: true,
      },
      {
        agent_key: "content_creation",
        display_name: "Content Creation",
        short_desc: "Generates posts, emails, and pages.",
        long_desc: "Converts briefs into multi-format marketing content.",
        capabilities: ["draft", "edit", "repurpose"],
        default_model: "gpt-4o-mini",
        model_routing: "",
        prompt_template_version: "v1",
        prompt_templates: "",
        input_schema: "{}",
        output_schema: "{}",
        tier_restrictions: [],
        confidence_hint: 0.8,
        active: true,
      },
      {
        agent_key: "data_analysis",
        display_name: "Data Analysis",
        short_desc: "Explains metrics and trends.",
        long_desc: "Produces narratives for KPI movements with clear takeaways.",
        capabilities: ["analyze", "explain", "visualize"],
        default_model: "gpt-4o-mini",
        model_routing: "",
        prompt_template_version: "v1",
        prompt_templates: "",
        input_schema: "{}",
        output_schema: "{}",
        tier_restrictions: [],
        confidence_hint: 0.8,
        active: true,
      },
      {
        agent_key: "marketing_automation",
        display_name: "Marketing Automation",
        short_desc: "Coordinates campaigns and experiments.",
        long_desc: "Plans multi-step campaigns and suggests experiments.",
        capabilities: ["plan", "schedule", "optimize"],
        default_model: "gpt-4o-mini",
        model_routing: "",
        prompt_template_version: "v1",
        prompt_templates: "",
        input_schema: "{}",
        output_schema: "{}",
        tier_restrictions: [],
        confidence_hint: 0.8,
        active: true,
      },
      {
        agent_key: "financial_analysis",
        display_name: "Financial Analysis",
        short_desc: "Models costs, ROI, and forecasts.",
        long_desc: "Runs scenario planning and returns concise reports.",
        capabilities: ["model", "forecast", "roi"],
        default_model: "gpt-4o-mini",
        model_routing: "",
        prompt_template_version: "v1",
        prompt_templates: "",
        input_schema: "{}",
        output_schema: "{}",
        tier_restrictions: [],
        confidence_hint: 0.8,
        active: true,
      },
      {
        agent_key: "operations_optimization",
        display_name: "Operations Optimization",
        short_desc: "Improves process efficiency.",
        long_desc: "Finds bottlenecks and proposes rollout plans.",
        capabilities: ["diagnose", "optimize", "rollout"],
        default_model: "gpt-4o-mini",
        model_routing: "",
        prompt_template_version: "v1",
        prompt_templates: "",
        input_schema: "{}",
        output_schema: "{}",
        tier_restrictions: [],
        confidence_hint: 0.8,
        active: true,
      },
      {
        agent_key: "compliance_risk",
        display_name: "Compliance & Risk",
        short_desc: "Flags policy and regulatory issues.",
        long_desc: "Validates proposed changes and highlights risk.",
        capabilities: ["validate", "assess", "flag"],
        default_model: "gpt-4o-mini",
        model_routing: "",
        prompt_template_version: "v1",
        prompt_templates: "",
        input_schema: "{}",
        output_schema: "{}",
        tier_restrictions: [],
        confidence_hint: 0.8,
        active: true,
      },
      {
        agent_key: "hr_recruitment",
        display_name: "HR & Recruitment",
        short_desc: "Assists with hiring workflows.",
        long_desc: "Drafts JDs, screens candidates, and suggests questions.",
        capabilities: ["draft", "screen", "recommend"],
        default_model: "gpt-4o-mini",
        model_routing: "",
        prompt_template_version: "v1",
        prompt_templates: "",
        input_schema: "{}",
        output_schema: "{}",
        tier_restrictions: [],
        confidence_hint: 0.8,
        active: true,
      },
    ];

    const now = Date.now();
    const all = await ctx.db.query("agentCatalog").collect();

    let inserted = 0;
    let updated = 0;

    for (const def of defaults) {
      const existing = all.find((a: any) => a.agent_key === def.agent_key);
      if (existing) {
        await ctx.db.patch(existing._id, { ...def, updatedAt: now });
        updated += 1;
      } else {
        await ctx.db.insert("agentCatalog", { ...def, createdAt: now, updatedAt: now });
        inserted += 1;
      }
    }

    return { inserted, updated, total: defaults.length };
  },
});
