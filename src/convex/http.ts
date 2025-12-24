import { httpRouter } from "convex/server";
import { auth } from "./auth";
import * as workflows from "./http/workflows";
import * as audit from "./http/audit";
import * as emails from "./http/emails";
import * as payments from "./http/payments";
import * as authHandlers from "./http/auth";
import * as scim from "./http/scim";

const http = httpRouter();

// Register auth HTTP routes (CRITICAL: Required for auth to work)
auth.addHttpRoutes(http);

// Workflows & Incidents
http.route({
  path: "/api/trigger",
  method: "POST",
  handler: workflows.triggerWorkflow,
});

http.route({
  path: "/api/workflows/webhook/:eventKey",
  method: "POST",
  handler: workflows.workflowWebhook,
});

http.route({
  path: "/api/incidents/report",
  method: "POST",
  handler: workflows.reportIncident,
});

http.route({
  path: "/api/compliance/scan",
  method: "POST",
  handler: workflows.scanCompliance,
});

// Audit
http.route({
  path: "/api/audit/export",
  method: "GET",
  handler: audit.exportAuditLogs,
});

// Emails
http.route({
  path: "/api/unsubscribe",
  method: "GET",
  handler: emails.unsubscribe,
});

http.route({
  path: "/api/cron/sweep-scheduled-campaigns",
  method: "POST",
  handler: emails.sweepScheduledCampaigns,
});

http.route({
  path: "/api/email/track/open",
  method: "GET",
  handler: emails.trackOpen,
});

http.route({
  path: "/api/email/track/click",
  method: "GET",
  handler: emails.trackClick,
});

http.route({
  path: "/api/resend/webhook",
  method: "POST",
  handler: emails.resendWebhook,
});

// Payments
http.route({
  path: "/api/stripe/webhook",
  method: "POST",
  handler: payments.stripeWebhook,
});

http.route({
  path: "/api/webhooks/paypal",
  method: "POST",
  handler: payments.paypalWebhook,
});

// OAuth Callbacks
http.route({
  path: "/auth/callback/twitter",
  method: "GET",
  handler: authHandlers.twitterCallback,
});

http.route({
  path: "/auth/callback/linkedin",
  method: "GET",
  handler: authHandlers.linkedinCallback,
});

http.route({
  path: "/auth/callback/facebook",
  method: "GET",
  handler: authHandlers.facebookCallback,
});

// SSO
http.route({
  path: "/auth/saml/acs",
  method: "POST",
  handler: authHandlers.samlAcs,
});

http.route({
  path: "/auth/oidc/callback",
  method: "GET",
  handler: authHandlers.oidcCallback,
});

// SCIM
http.route({
  path: "/scim/v2/Users",
  method: "GET",
  handler: scim.getUsers,
});

http.route({
  path: "/scim/v2/Users",
  method: "POST",
  handler: scim.createUser,
});

http.route({
  path: "/scim/v2/Groups",
  method: "GET",
  handler: scim.getGroups,
});

http.route({
  path: "/scim/v2/Groups",
  method: "POST",
  handler: scim.createGroup,
});

export default http;