import { defineSchema } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { coreSchema } from "./core";
import { riskSchema } from "./risk";
import { kpiSchema } from "./kpi";
import { agentsSchema } from "./agents";
import { workflowsSchema } from "./workflows";
import { teamSchema } from "./team";
import { supportSchema } from "./support";
import { contentSchema } from "./content";
import { whiteLabelSchema } from "./whiteLabel";
import { securitySchema } from "./security";
import { enterpriseSchema } from "./enterprise";
import { integrationsSchema } from "./integrations";
import { docsSchema } from "./docs";
import { testingSchema } from "./testing";
import { onboardingSchema } from "./onboarding";
import { vectorsSchema } from "./vectors";
import { activitySchema } from "./activity";

const { users: _authUsers, ...authWithoutUsers } = authTables;

// Merge all schema modules
export default defineSchema({
  ...coreSchema,
  ...agentsSchema,
  ...workflowsSchema,
  ...contentSchema,
  ...teamSchema,
  ...supportSchema,
  ...kpiSchema,
  ...riskSchema,
  ...whiteLabelSchema,
  ...securitySchema,
  ...enterpriseSchema,
  ...integrationsSchema,
  ...docsSchema,
  ...testingSchema,
  ...onboardingSchema,
  ...vectorsSchema,
  ...activitySchema,
});