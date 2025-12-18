import { defineSchema } from "convex/server";
import { coreSchema } from "./core";
import { teamSchema } from "./team";
import { docsSchema } from "./docs";
import { winsSchema } from "./wins";
import { socialSchema } from "./social";
import { emailSchema } from "./email";
import { calendarIntegrations, appointments, availabilityBlocks, scheduleSlots } from "./calendar";
import { workflowsSchema } from "./workflows";
import { agentsSchema } from "./agents";
import { adminSchema } from "./admin";
import { enterpriseSchema } from "./enterprise";
import { securitySchema } from "./security";
import { activitySchema } from "./activity";
import { integrationsSchema } from "./integrations";
import { supportSchema } from "./support";
import { contactsSchema } from "./contacts";
import { contentSchema } from "./content";
import { initiativesSchema } from "./initiatives";
import { kpiSchema } from "./kpi";
import { onboardingSchema } from "./onboarding";
import { riskSchema } from "./risk";
import { testingSchema } from "./testing";
import { vectorsSchema } from "./vectors";
import { whiteLabelSchema } from "./whiteLabel";

export default defineSchema({
  ...coreSchema,
  ...teamSchema,
  ...docsSchema,
  ...winsSchema,
  ...socialSchema,
  ...emailSchema,
  ...workflowsSchema,
  ...agentsSchema,
  ...adminSchema,
  ...enterpriseSchema,
  ...securitySchema,
  ...activitySchema,
  ...integrationsSchema,
  ...supportSchema,
  ...contactsSchema,
  ...contentSchema,
  ...initiativesSchema,
  ...kpiSchema,
  ...onboardingSchema,
  ...riskSchema,
  ...testingSchema,
  ...vectorsSchema,
  ...whiteLabelSchema,
  calendarIntegrations,
  appointments,
  availabilityBlocks,
  scheduleSlots,
});