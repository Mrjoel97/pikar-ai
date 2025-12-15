import { defineSchema } from "convex/server";
import { coreSchema } from "./core";
import { teamSchema } from "./team";
import { docsSchema } from "./docs";
import { winsSchema } from "./wins";
import { calendarIntegrations, appointments } from "./calendar";

export default defineSchema({
  ...coreSchema,
  ...teamSchema,
  ...docsSchema,
  ...winsSchema,
  calendarIntegrations,
  appointments,
});