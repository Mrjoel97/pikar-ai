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
import { adminSchema } from "./admin";
import { agentsSchema } from "./agents";
import { enterpriseSchema } from "./enterprise";
import { integrationsSchema } from "./integrations";
import { securitySchema } from "./security";
import { supportSchema } from "./support";
import { testingSchema } from "./testing";
import { vectorsSchema } from "./vectors";
import { activitySchema } from "./activity";

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
  ...adminSchema,
  ...agentsSchema,
  ...enterpriseSchema,
  ...integrationsSchema,
  ...securitySchema,
  ...supportSchema,
  ...testingSchema,
  ...vectorsSchema,
  ...activitySchema,
  calendarIntegrations,
  appointments,
  availabilityBlocks,
});