/**
 * Aggregated re-exports for playbooks seed data.
 * This file stays as the single import surface to avoid changing other modules.
 */

export { DEFAULT_PLAYBOOKS } from "./defaults";
export { SOLOPRENEUR_PLAYBOOKS } from "./solopreneur";
export { INDUSTRIES, PLAYBOOK_CATEGORIES, TIER_DISTRIBUTION } from "./constants";
export { generateIndustryPlaybooks, INDUSTRY_PLAYBOOKS } from "./generators";

// Convenience combined export (unchanged API)
import { DEFAULT_PLAYBOOKS as BASE_DEFAULTS } from "./defaults";
import { SOLOPRENEUR_PLAYBOOKS as SOLO_DEFAULTS } from "./solopreneur";
import { INDUSTRY_PLAYBOOKS as ALL_INDUSTRY } from "./generators";

export const DEFAULT_PLAYBOOKS_EXTENDED = [
  ...BASE_DEFAULTS,
  ...SOLO_DEFAULTS,
  ...ALL_INDUSTRY,
];