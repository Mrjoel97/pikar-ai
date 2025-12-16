import { defineSchema } from "convex/server";
import { coreSchema } from "./core";
import { teamSchema } from "./team";
import { docsSchema } from "./docs";
import { winsSchema } from "./wins";
import { socialSchema } from "./social";
import { calendarIntegrations, appointments, availabilityBlocks } from "./calendar";

export default defineSchema({
  ...coreSchema,
  ...teamSchema,
  ...docsSchema,
  ...winsSchema,
  ...socialSchema,
  calendarIntegrations,
  appointments,
  availabilityBlocks,
});