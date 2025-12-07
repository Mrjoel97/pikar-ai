import { defineSchema } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { coreSchema } from "./core";
import { riskSchema } from "./risk";
import { kpiSchema } from "./kpi";

const { users: _authUsers, ...authWithoutUsers } = authTables;

// Merge all schema modules
const schema = defineSchema({
  ...authWithoutUsers,
  ...coreSchema,
  ...riskSchema,
  ...kpiSchema,
  // Note: The remaining 180+ tables need to be migrated to domain-specific modules
  // This is a starting point showing the modular pattern
});

export default schema;
