import { defineSchema } from "convex/server";
import { coreSchema } from "./core";
import { teamSchema } from "./team";
import { docsSchema } from "./docs";
import { winsSchema } from "./wins";
import { socialSchema } from "./social";
import { emailSchema } from "./email";
import { riskSchema } from "./risk";
import { calendarIntegrations, appointments, availabilityBlocks } from "./calendar";
import { contactsSchema } from "./contacts";
import { initiativesSchema } from "./initiatives";
import { contentSchema } from "./content";
import { workflowsSchema } from "./workflows";
import { kpiSchema } from "./kpi";
import { onboardingSchema } from "./onboarding";
import { whiteLabelSchema } from "./whiteLabel";

export default defineSchema({
  ...coreSchema,
  ...teamSchema,
  ...docsSchema,
  ...winsSchema,
  ...socialSchema,
  ...emailSchema,
  ...riskSchema,
  ...contactsSchema,
  ...initiativesSchema,
  ...contentSchema,
  ...workflowsSchema,
  ...kpiSchema,
  ...onboardingSchema,
  ...whiteLabelSchema,
  calendarIntegrations,
  appointments,
  availabilityBlocks,
});