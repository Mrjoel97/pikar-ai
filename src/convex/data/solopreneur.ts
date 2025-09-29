// Solopreneur-focused default playbooks

export const SOLOPRENEUR_PLAYBOOKS = [
  {
    playbook_key: "weekly_momentum_capsule",
    display_name: "Weekly Momentum Capsule",
    version: "v1.0",
    triggers: [{ type: "http", path: "/api/playbooks/weekly_momentum_capsule/trigger", method: "POST" }],
    input_schema: { type: "object", required: ["businessId"] },
    output_schema: { type: "object" },
    steps: [
      {
        step_id: "content_1",
        name: "Draft newsletter content",
        agent_key: "content_creation",
        action: "create_newsletter_draft",
        input_map: {
          brief: "weekly momentum update",
          brand_voice: "$.company_profile.brand_voice",
        },
        output_map: { newsletter_content: "$.steps.content_1.output" },
      },
      {
        step_id: "social_1",
        name: "Create social posts",
        agent_key: "content_creation",
        action: "create_social_posts",
        input_map: {
          count: 2,
          theme: "$.steps.content_1.output.theme",
        },
        output_map: { social_posts: "$.steps.social_1.output" },
      },
      {
        step_id: "schedule_1",
        name: "Schedule content",
        agent_key: "marketing_automation",
        action: "schedule_content_batch",
        input_map: {
          newsletter: "$.steps.content_1.output",
          posts: "$.steps.social_1.output",
        },
        output_map: { scheduled_items: "$.steps.schedule_1.output" },
      },
    ],
    metadata: { owner_role: "solopreneur", human_in_loop: false, auto_execute: true, audit: true },
    active: true,
  },
  {
    playbook_key: "quick_newsletter_sprint",
    display_name: "Quick Newsletter Sprint",
    version: "v1.0",
    triggers: [{ type: "http", path: "/api/playbooks/quick_newsletter_sprint/trigger", method: "POST" }],
    input_schema: { type: "object", required: ["businessId", "subject_hint"] },
    output_schema: { type: "object" },
    steps: [
      {
        step_id: "optimize_1",
        name: "Optimize subject line",
        agent_key: "marketing_automation",
        action: "optimize_subject",
        input_map: { hint: "$.subject_hint" },
        output_map: { optimized_subject: "$.steps.optimize_1.output" },
      },
      {
        step_id: "content_1",
        name: "Generate newsletter body",
        agent_key: "content_creation",
        action: "create_newsletter_body",
        input_map: {
          subject: "$.steps.optimize_1.output",
          cta_focus: "engagement",
        },
        output_map: { newsletter_body: "$.steps.content_1.output" },
      },
      {
        step_id: "preflight_1",
        name: "Compliance preflight",
        agent_key: "compliance_risk",
        action: "check_email_compliance",
        input_map: {
          content: "$.steps.content_1.output",
          sender_config: "$.company_profile.email_config",
        },
        output_map: { compliance_check: "$.steps.preflight_1.output" },
      },
    ],
    metadata: { owner_role: "solopreneur", human_in_loop: false, auto_execute: true, audit: true },
    active: true,
  },
  {
    playbook_key: "social_micro_calendar",
    display_name: "Social Micro-Calendar (5-day)",
    version: "v1.0",
    triggers: [{ type: "http", path: "/api/playbooks/social_micro_calendar/trigger", method: "POST" }],
    input_schema: { type: "object", required: ["businessId", "theme"] },
    output_schema: { type: "object" },
    steps: [
      {
        step_id: "plan_1",
        name: "Plan 5-day content calendar",
        agent_key: "marketing_automation",
        action: "plan_micro_calendar",
        input_map: {
          theme: "$.theme",
          post_count: 5,
          cadence: "daily",
        },
        output_map: { content_plan: "$.steps.plan_1.output" },
      },
      {
        step_id: "create_1",
        name: "Generate micro-posts",
        agent_key: "content_creation",
        action: "create_micro_posts",
        input_map: {
          plan: "$.steps.plan_1.output",
          hooks: ["question", "tip", "story", "insight", "cta"],
        },
        output_map: { micro_posts: "$.steps.create_1.output" },
      },
      {
        step_id: "schedule_1",
        name: "Schedule with balanced cadence",
        agent_key: "marketing_automation",
        action: "schedule_balanced_posts",
        input_map: {
          posts: "$.steps.create_1.output",
          optimal_times: ["9am", "2pm", "6pm"],
        },
        output_map: { scheduled_posts: "$.steps.schedule_1.output" },
      },
    ],
    metadata: { owner_role: "solopreneur", human_in_loop: false, auto_execute: true, audit: true },
    active: true,
  },
];
