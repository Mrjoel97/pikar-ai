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
import type * as admin from "../admin.js";
import type * as adminAssistant from "../adminAssistant.js";
import type * as adminAuth from "../adminAuth.js";
import type * as adminAuthData from "../adminAuthData.js";
import type * as agentDatasets from "../agentDatasets.js";
import type * as agentProfile from "../agentProfile.js";
import type * as agentRouter from "../agentRouter.js";
import type * as aiAgents from "../aiAgents.js";
import type * as approvalAnalytics from "../approvalAnalytics.js";
import type * as approvals from "../approvals.js";
import type * as audit from "../audit.js";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as auth from "../auth.js";
import type * as billing from "../billing.js";
import type * as billingInternal from "../billingInternal.js";
import type * as branding from "../branding.js";
import type * as brands from "../brands.js";
import type * as businesses from "../businesses.js";
import type * as calendar from "../calendar.js";
import type * as capa from "../capa.js";
import type * as chunking from "../chunking.js";
import type * as complianceReports from "../complianceReports.js";
import type * as contacts from "../contacts.js";
import type * as crisisManagement from "../crisisManagement.js";
import type * as crmIntegrations from "../crmIntegrations.js";
import type * as cron from "../cron.js";
import type * as customApis from "../customApis.js";
import type * as data_playbooksSeed from "../data/playbooksSeed.js";
import type * as departmentKpis from "../departmentKpis.js";
import type * as diagnostics from "../diagnostics.js";
import type * as docProcessing from "../docProcessing.js";
import type * as docs from "../docs.js";
import type * as docsInternal from "../docsInternal.js";
import type * as emailAnalytics from "../emailAnalytics.js";
import type * as emailConfig from "../emailConfig.js";
import type * as emailDraftAgent from "../emailDraftAgent.js";
import type * as emailDraftAgentData from "../emailDraftAgentData.js";
import type * as emailDrafts from "../emailDrafts.js";
import type * as emails from "../emails.js";
import type * as emailsActions from "../emailsActions.js";
import type * as enterpriseMetrics from "../enterpriseMetrics.js";
import type * as enterpriseSupport from "../enterpriseSupport.js";
import type * as entitlements from "../entitlements.js";
import type * as evals from "../evals.js";
import type * as evalsInternal from "../evalsInternal.js";
import type * as experiments from "../experiments.js";
import type * as experimentsActions from "../experimentsActions.js";
import type * as featureFlags from "../featureFlags.js";
import type * as files from "../files.js";
import type * as governance from "../governance.js";
import type * as governanceAutomation from "../governanceAutomation.js";
import type * as health from "../health.js";
import type * as http from "../http.js";
import type * as init from "../init.js";
import type * as initiatives from "../initiatives.js";
import type * as inspector from "../inspector.js";
import type * as invoices from "../invoices.js";
import type * as invoicesActions from "../invoicesActions.js";
import type * as kgraph from "../kgraph.js";
import type * as kms from "../kms.js";
import type * as kmsActions from "../kmsActions.js";
import type * as knowledge from "../knowledge.js";
import type * as kpis from "../kpis.js";
import type * as lib_aiAgents_admin from "../lib/aiAgents/admin.js";
import type * as lib_aiAgents_config from "../lib/aiAgents/config.js";
import type * as lib_aiAgents_datasets from "../lib/aiAgents/datasets.js";
import type * as lib_aiAgents_publish from "../lib/aiAgents/publish.js";
import type * as lib_aiAgents_training from "../lib/aiAgents/training.js";
import type * as lib_aiAgents_versions from "../lib/aiAgents/versions.js";
import type * as lib_errors from "../lib/errors.js";
import type * as notifications from "../notifications.js";
import type * as nudges from "../nudges.js";
import type * as oidc from "../oidc.js";
import type * as oidcActions from "../oidcActions.js";
import type * as onboarding from "../onboarding.js";
import type * as openai from "../openai.js";
import type * as openapi from "../openapi.js";
import type * as passwordAuth from "../passwordAuth.js";
import type * as passwordAuthData from "../passwordAuthData.js";
import type * as playbookExecutions from "../playbookExecutions.js";
import type * as playbookVersions from "../playbookVersions.js";
import type * as playbooks from "../playbooks.js";
import type * as riskAnalytics from "../riskAnalytics.js";
import type * as roiCalculations from "../roiCalculations.js";
import type * as saml from "../saml.js";
import type * as samlActions from "../samlActions.js";
import type * as schedule from "../schedule.js";
import type * as scim from "../scim.js";
import type * as seed from "../seed.js";
import type * as socialAnalytics from "../socialAnalytics.js";
import type * as socialContentAgent_analytics from "../socialContentAgent/analytics.js";
import type * as socialContentAgent_optimization from "../socialContentAgent/optimization.js";
import type * as socialContentAgent from "../socialContentAgent.js";
import type * as socialIntegrations from "../socialIntegrations.js";
import type * as socialIntegrationsActions from "../socialIntegrationsActions.js";
import type * as socialMediaDocs from "../socialMediaDocs.js";
import type * as socialPosts from "../socialPosts.js";
import type * as socialPostsCron from "../socialPostsCron.js";
import type * as solopreneur from "../solopreneur.js";
import type * as strategicInitiatives from "../strategicInitiatives.js";
import type * as tasks from "../tasks.js";
import type * as teamChat from "../teamChat.js";
import type * as teamGoals from "../teamGoals.js";
import type * as teamOnboarding from "../teamOnboarding.js";
import type * as telemetry from "../telemetry.js";
import type * as templatePins from "../templatePins.js";
import type * as templatesData from "../templatesData.js";
import type * as users from "../users.js";
import type * as utils from "../utils.js";
import type * as vectors from "../vectors.js";
import type * as webhooks from "../webhooks.js";
import type * as webhooksActions from "../webhooksActions.js";
import type * as workflowAssignments from "../workflowAssignments.js";
import type * as workflowHandoffs from "../workflowHandoffs.js";
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
  admin: typeof admin;
  adminAssistant: typeof adminAssistant;
  adminAuth: typeof adminAuth;
  adminAuthData: typeof adminAuthData;
  agentDatasets: typeof agentDatasets;
  agentProfile: typeof agentProfile;
  agentRouter: typeof agentRouter;
  aiAgents: typeof aiAgents;
  approvalAnalytics: typeof approvalAnalytics;
  approvals: typeof approvals;
  audit: typeof audit;
  "auth/emailOtp": typeof auth_emailOtp;
  auth: typeof auth;
  billing: typeof billing;
  billingInternal: typeof billingInternal;
  branding: typeof branding;
  brands: typeof brands;
  businesses: typeof businesses;
  calendar: typeof calendar;
  capa: typeof capa;
  chunking: typeof chunking;
  complianceReports: typeof complianceReports;
  contacts: typeof contacts;
  crisisManagement: typeof crisisManagement;
  crmIntegrations: typeof crmIntegrations;
  cron: typeof cron;
  customApis: typeof customApis;
  "data/playbooksSeed": typeof data_playbooksSeed;
  departmentKpis: typeof departmentKpis;
  diagnostics: typeof diagnostics;
  docProcessing: typeof docProcessing;
  docs: typeof docs;
  docsInternal: typeof docsInternal;
  emailAnalytics: typeof emailAnalytics;
  emailConfig: typeof emailConfig;
  emailDraftAgent: typeof emailDraftAgent;
  emailDraftAgentData: typeof emailDraftAgentData;
  emailDrafts: typeof emailDrafts;
  emails: typeof emails;
  emailsActions: typeof emailsActions;
  enterpriseMetrics: typeof enterpriseMetrics;
  enterpriseSupport: typeof enterpriseSupport;
  entitlements: typeof entitlements;
  evals: typeof evals;
  evalsInternal: typeof evalsInternal;
  experiments: typeof experiments;
  experimentsActions: typeof experimentsActions;
  featureFlags: typeof featureFlags;
  files: typeof files;
  governance: typeof governance;
  governanceAutomation: typeof governanceAutomation;
  health: typeof health;
  http: typeof http;
  init: typeof init;
  initiatives: typeof initiatives;
  inspector: typeof inspector;
  invoices: typeof invoices;
  invoicesActions: typeof invoicesActions;
  kgraph: typeof kgraph;
  kms: typeof kms;
  kmsActions: typeof kmsActions;
  knowledge: typeof knowledge;
  kpis: typeof kpis;
  "lib/aiAgents/admin": typeof lib_aiAgents_admin;
  "lib/aiAgents/config": typeof lib_aiAgents_config;
  "lib/aiAgents/datasets": typeof lib_aiAgents_datasets;
  "lib/aiAgents/publish": typeof lib_aiAgents_publish;
  "lib/aiAgents/training": typeof lib_aiAgents_training;
  "lib/aiAgents/versions": typeof lib_aiAgents_versions;
  "lib/errors": typeof lib_errors;
  notifications: typeof notifications;
  nudges: typeof nudges;
  oidc: typeof oidc;
  oidcActions: typeof oidcActions;
  onboarding: typeof onboarding;
  openai: typeof openai;
  openapi: typeof openapi;
  passwordAuth: typeof passwordAuth;
  passwordAuthData: typeof passwordAuthData;
  playbookExecutions: typeof playbookExecutions;
  playbookVersions: typeof playbookVersions;
  playbooks: typeof playbooks;
  riskAnalytics: typeof riskAnalytics;
  roiCalculations: typeof roiCalculations;
  saml: typeof saml;
  samlActions: typeof samlActions;
  schedule: typeof schedule;
  scim: typeof scim;
  seed: typeof seed;
  socialAnalytics: typeof socialAnalytics;
  "socialContentAgent/analytics": typeof socialContentAgent_analytics;
  "socialContentAgent/optimization": typeof socialContentAgent_optimization;
  socialContentAgent: typeof socialContentAgent;
  socialIntegrations: typeof socialIntegrations;
  socialIntegrationsActions: typeof socialIntegrationsActions;
  socialMediaDocs: typeof socialMediaDocs;
  socialPosts: typeof socialPosts;
  socialPostsCron: typeof socialPostsCron;
  solopreneur: typeof solopreneur;
  strategicInitiatives: typeof strategicInitiatives;
  tasks: typeof tasks;
  teamChat: typeof teamChat;
  teamGoals: typeof teamGoals;
  teamOnboarding: typeof teamOnboarding;
  telemetry: typeof telemetry;
  templatePins: typeof templatePins;
  templatesData: typeof templatesData;
  users: typeof users;
  utils: typeof utils;
  vectors: typeof vectors;
  webhooks: typeof webhooks;
  webhooksActions: typeof webhooksActions;
  workflowAssignments: typeof workflowAssignments;
  workflowHandoffs: typeof workflowHandoffs;
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
