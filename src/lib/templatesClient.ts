export type Tier = "solopreneur" | "startup" | "sme" | "enterprise";
type TriggerType = "manual" | "schedule" | "webhook";

export type BuiltInTemplate = {
  _id: string;
  name: string;
  description: string;
  tier: Tier;
  tags: string[];
  trigger: {
    type: TriggerType;
    cron?: string;
    eventKey?: string;
  };
  approval: {
    required: boolean;
    threshold: number;
  };
  pipeline: Array<{
    step: number;
    type: string;
    name: string;
    config: Record<string, any>;
  }>;
};

const COUNT_PER_TIER = 120;

const TIER_LABEL: Record<Tier, string> = {
  solopreneur: "Solopreneur",
  startup: "Startup",
  sme: "SME",
  enterprise: "Enterprise",
};

const TIER_TAGS: Record<Tier, string[]> = {
  solopreneur: ["content", "newsletter", "seo", "email", "brand", "solo", "quick-win", "roi", "brand-booster"],
  startup: ["growth", "activation", "retention", "analytics", "team", "scale"],
  sme: ["governance", "compliance", "workflow", "process", "risk", "dept"],
  enterprise: ["enterprise", "global", "command", "security", "ops", "slo"],
};

const CATEGORIES: string[] = [
  "Lead Capture",
  "Newsletter",
  "SEO Boost",
  "Product Launch",
  "Churn Recovery",
  "Upsell Campaign",
  "Abandoned Cart",
  "NPS Survey",
  "Customer Re-engagement",
  "Weekly Digest",
  "Webinar Promo",
  "Feature Announcement",
];

function leftPad3(n: number) {
  return String(n).padStart(3, "0");
}
function pick<T>(arr: T[], n: number) {
  return arr[n % arr.length]!;
}
function buildTrigger(i: number): BuiltInTemplate["trigger"] {
  const t: TriggerType = i % 6 === 0 ? "webhook" : i % 3 === 0 ? "schedule" : "manual";
  if (t === "schedule") {
    const cron = i % 2 === 0 ? "0 9 * * 1" : "0 8 * * *";
    return { type: t, cron };
  }
  if (t === "webhook") {
    return { type: t, eventKey: `evt_${i.toString(36)}` };
  }
  return { type: t };
}
function buildPipeline(tier: Tier, i: number): BuiltInTemplate["pipeline"] {
  const base = tier === "solopreneur" ? 3 : tier === "startup" ? 4 : tier === "sme" ? 5 : 6;
  const steps: BuiltInTemplate["pipeline"] = [];
  for (let s = 0; s < base; s++) {
    const kind = pick(["collect", "enrich", "generate", "review", "publish", "notify"], i + s);
    steps.push({
      step: s + 1,
      type: kind,
      name: `${kind.charAt(0).toUpperCase() + kind.slice(1)} Step ${s + 1}`,
      config: {
        variant: pick(["email", "social", "paid", "referral", "report"], i + s * 7),
        intensity: (i + s) % 3,
      },
    });
  }
  return steps;
}
function buildApproval(tier: Tier, i: number): BuiltInTemplate["approval"] {
  const needs = tier === "sme" || tier === "enterprise" ? i % 4 === 0 : false;
  const threshold = tier === "enterprise" ? (needs ? 2 : 0) : needs ? 1 : 0;
  return { required: needs, threshold };
}
function generateTemplatesForTier(tier: Tier, count = COUNT_PER_TIER): BuiltInTemplate[] {
  const label = TIER_LABEL[tier];
  const tags = TIER_TAGS[tier];
  const out: BuiltInTemplate[] = [];

  if (tier === "solopreneur") {
    out.push({
      _id: "builtin:solopreneur:brand-booster",
      name: `${label} • Brand Booster • Quick Win`,
      description: "Create a weekly LinkedIn post and email draft with a quick human review. Designed for immediate value and minimal setup.",
      tier,
      tags: Array.from(new Set(["brand-booster", "quick-win", "roi", "email", "social", "brand"])),
      trigger: { type: "manual" },
      approval: { required: true, threshold: 1 },
      pipeline: [
        { step: 1, type: "collect", name: "Collect recent wins and updates", config: { variant: "referral", intensity: 0 } },
        { step: 2, type: "generate", name: "Draft LinkedIn post + email blurb", config: { variant: "social", intensity: 1 } },
        { step: 3, type: "review", name: "Quick human review", config: { approverRole: "Owner" } },
        { step: 4, type: "publish", name: "Publish & schedule", config: { variant: "email", intensity: 0 } },
      ],
    });
  }
  if (tier === "startup") {
    out.push({
      _id: "builtin:startup:standard-handoff",
      name: `${label} • Standard Handoff • Quick Start`,
      description: "Introduce a standard approval + handoff with a short delay to represent SLAs.",
      tier,
      tags: Array.from(new Set(["standardize", "handoff", "sla", "alignment"])),
      trigger: { type: "manual" },
      approval: { required: true, threshold: 1 },
      pipeline: [
        { step: 1, type: "generate", name: "Agent drafts task/output", config: { variant: "report", intensity: 1 } },
        { step: 2, type: "review", name: "Team approval", config: { approverRole: "Manager" } },
        { step: 3, type: "notify", name: "Handoff to next role", config: { variant: "email", intensity: 0 } },
        { step: 4, type: "delay", name: "SLA buffer", config: { delayMinutes: 60 } },
      ],
    });
  }

  for (let i = 1; i <= count; i++) {
    const idx = i - 1;
    const cat = pick(CATEGORIES, idx);
    const key = `builtin:${tier}:${leftPad3(i)}`;
    out.push({
      _id: key,
      name: `${label} • ${cat} • #${leftPad3(i)}`,
      description: `Prebuilt ${label} workflow for ${cat.toLowerCase()} with a ${
        (idx % 6 === 0 && "webhook") || (idx % 3 === 0 && "scheduled") || "manual"
      } trigger.`,
      tier,
      tags: Array.from(new Set([cat.toLowerCase().replace(/\s+/g, "-"), pick(tags, idx), pick(tags, idx + 1)])),
      trigger: buildTrigger(idx),
      approval: buildApproval(tier, idx),
      pipeline: buildPipeline(tier, idx),
    });
  }
  return out;
}

let CACHE_ALL: BuiltInTemplate[] | null = null;

export function getAllBuiltInTemplates(): BuiltInTemplate[] {
  if (CACHE_ALL) return CACHE_ALL;
  const all: BuiltInTemplate[] = [
    ...generateTemplatesForTier("solopreneur"),
    ...generateTemplatesForTier("startup"),
    ...generateTemplatesForTier("sme"),
    ...generateTemplatesForTier("enterprise"),
  ];
  CACHE_ALL = all;
  return all;
}

export function getBuiltInTemplateByKey(key: string): BuiltInTemplate | undefined {
  return getAllBuiltInTemplates().find((t) => t._id === key);
}
