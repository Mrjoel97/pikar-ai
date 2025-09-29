// Shared constants and helpers for playbooks data

export const INDUSTRIES = [
  { key: "saas", display: "SaaS" },
  { key: "ecommerce", display: "eCommerce" },
  { key: "healthcare", display: "Healthcare" },
  { key: "fintech", display: "Fintech" },
  { key: "education", display: "Education" },
  { key: "real_estate", display: "Real Estate" },
  { key: "logistics", display: "Logistics" },
  { key: "hospitality", display: "Hospitality" },
  { key: "manufacturing", display: "Manufacturing" },
  { key: "agencies", display: "Agencies" },
  { key: "nonprofit", display: "Nonprofit" },
  { key: "retail", display: "Retail" },
  { key: "media", display: "Media" },
  { key: "gaming", display: "Gaming" },
  { key: "legal", display: "Legal" },
  { key: "hr_tech", display: "HR Tech" },
  { key: "travel", display: "Travel" },
  { key: "fitness_wellness", display: "Fitness & Wellness" },
  { key: "consumer_apps", display: "Consumer Apps" },
  { key: "marketplaces", display: "Marketplaces" },
];

export const PLAYBOOK_CATEGORIES = {
  CONTENT_OPS: "contentOps",
  GROWTH: "growth",
  SUPPORT: "support",
  ANALYTICS: "analytics",
  GOVERNANCE: "governance",
  OPS: "ops",
} as const;

export const TIER_DISTRIBUTION = {
  solopreneur: 5,
  startup: 6,
  sme: 5,
  enterprise: 4,
} as const;

// Helper to generate playbook keys
export const generatePlaybookKey = (industry: string, shortKey: string) =>
  `${industry}_${shortKey}_v1`;
