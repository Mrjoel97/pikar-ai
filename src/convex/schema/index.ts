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

const { users: _authUsers, ...authWithoutUsers } = authTables;

// Merge all schema modules
const schema = defineSchema({
  ...authWithoutUsers,
  ...coreSchema,
  ...riskSchema,
  ...kpiSchema,
  ...agentsSchema,
  ...workflowsSchema,
  ...teamSchema,
  ...supportSchema,
  ...contentSchema,
  ...whiteLabelSchema,
  ...securitySchema,
  // Note: Additional tables (CRM, social, governance, analytics, etc.) can be added as needed
});

export default schema;