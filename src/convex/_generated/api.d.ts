/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as activity from "../activity.js";
import type * as activityFeed from "../activityFeed.js";
import type * as agentProfile from "../agentProfile.js";
import type * as aiAgents from "../aiAgents.js";
import type * as approvals from "../approvals.js";
import type * as audit from "../audit.js";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as auth from "../auth.js";
import type * as businesses from "../businesses.js";
import type * as contacts from "../contacts.js";
import type * as cron from "../cron.js";
import type * as diagnostics from "../diagnostics.js";
import type * as emails from "../emails.js";
import type * as emailsActions from "../emailsActions.js";
import type * as entitlements from "../entitlements.js";
import type * as featureFlags from "../featureFlags.js";
import type * as files from "../files.js";
import type * as governance from "../governance.js";
import type * as health from "../health.js";
import type * as http from "../http.js";
import type * as init from "../init.js";
import type * as initiatives from "../initiatives.js";
import type * as inspector from "../inspector.js";
import type * as kpis from "../kpis.js";
import type * as notifications from "../notifications.js";
import type * as nudges from "../nudges.js";
import type * as openai from "../openai.js";
import type * as schedule from "../schedule.js";
import type * as seed from "../seed.js";
import type * as solopreneur from "../solopreneur.js";
import type * as tasks from "../tasks.js";
import type * as telemetry from "../telemetry.js";
import type * as templatePins from "../templatePins.js";
import type * as templatesData from "../templatesData.js";
import type * as users from "../users.js";
import type * as utils from "../utils.js";
import type * as workflowAssignments from "../workflowAssignments.js";
import type * as workflowTemplates from "../workflowTemplates.js";
import type * as workflows from "../workflows.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  activityFeed: typeof activityFeed;
  agentProfile: typeof agentProfile;
  aiAgents: typeof aiAgents;
  approvals: typeof approvals;
  audit: typeof audit;
  "auth/emailOtp": typeof auth_emailOtp;
  auth: typeof auth;
  businesses: typeof businesses;
  contacts: typeof contacts;
  cron: typeof cron;
  diagnostics: typeof diagnostics;
  emails: typeof emails;
  emailsActions: typeof emailsActions;
  entitlements: typeof entitlements;
  featureFlags: typeof featureFlags;
  files: typeof files;
  governance: typeof governance;
  health: typeof health;
  http: typeof http;
  init: typeof init;
  initiatives: typeof initiatives;
  inspector: typeof inspector;
  kpis: typeof kpis;
  notifications: typeof notifications;
  nudges: typeof nudges;
  openai: typeof openai;
  schedule: typeof schedule;
  seed: typeof seed;
  solopreneur: typeof solopreneur;
  tasks: typeof tasks;
  telemetry: typeof telemetry;
  templatePins: typeof templatePins;
  templatesData: typeof templatesData;
  users: typeof users;
  utils: typeof utils;
  workflowAssignments: typeof workflowAssignments;
  workflowTemplates: typeof workflowTemplates;
  workflows: typeof workflows;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
