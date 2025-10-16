import { v } from "convex/values";
import { query, mutation, action, internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * List security incidents
 */
export const listIncidents = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    status: v.optional(
      v.union(
        v.literal("open"),
        v.literal("investigating"),
        v.literal("contained"),
        v.literal("resolved"),
        v.literal("closed")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) return [];

    let incidents = await ctx.db
      .query("securityIncidents")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .order("desc")
      .take(args.limit || 50);

    if (args.status) {
      incidents = incidents.filter((i) => i.status === args.status);
    }

    return incidents;
  },
});

/**
 * Get threat detection alerts
 */
export const getThreatAlerts = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    acknowledged: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) return [];

    let alerts = await ctx.db
      .query("threatDetectionAlerts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .order("desc")
      .take(args.limit || 100);

    if (typeof args.acknowledged === "boolean") {
      alerts = alerts.filter((a) => a.isAcknowledged === args.acknowledged);
    }

    return alerts;
  },
});

/**
 * Get compliance certifications
 */
export const getCertifications = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx, args) => {
    if (!args.businessId) return [];

    return await ctx.db
      .query("complianceCertifications")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .collect();
  },
});

/**
 * Get security audits
 */
export const getSecurityAudits = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) return [];

    return await ctx.db
      .query("securityAudits")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .order("desc")
      .take(args.limit || 20);
  },
});

/**
 * Get security metrics overview
 */
export const getSecurityMetrics = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      return {
        activeIncidents: 0,
        criticalAlerts: 0,
        complianceScore: 0,
        lastAuditDate: null,
      };
    }

    const incidents = await ctx.db
      .query("securityIncidents")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .collect();

    const alerts = await ctx.db
      .query("threatDetectionAlerts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .collect();

    const certs = await ctx.db
      .query("complianceCertifications")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .collect();

    const audits = await ctx.db
      .query("securityAudits")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .order("desc")
      .take(1);

    const activeIncidents = incidents.filter(
      (i) => i.status === "open" || i.status === "investigating"
    ).length;

    const criticalAlerts = alerts.filter(
      (a) => !a.isAcknowledged && a.severity === "critical"
    ).length;

    const activeCerts = certs.filter((c) => c.status === "active").length;
    const complianceScore = certs.length > 0 ? (activeCerts / certs.length) * 100 : 0;

    return {
      activeIncidents,
      criticalAlerts,
      complianceScore: Math.round(complianceScore),
      lastAuditDate: audits[0]?.completedAt || null,
    };
  },
});

/**
 * Create security incident
 */
export const createIncident = mutation({
  args: {
    businessId: v.id("businesses"),
    type: v.union(
      v.literal("data_breach"),
      v.literal("unauthorized_access"),
      v.literal("malware"),
      v.literal("phishing"),
      v.literal("ddos"),
      v.literal("insider_threat"),
      v.literal("other")
    ),
    severity: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    title: v.string(),
    description: v.string(),
    affectedSystems: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();
    if (!user) throw new Error("User not found");

    const now = Date.now();
    const incidentId = await ctx.db.insert("securityIncidents", {
      businessId: args.businessId,
      type: args.type,
      severity: args.severity,
      status: "open",
      title: args.title,
      description: args.description,
      detectedAt: now,
      affectedSystems: args.affectedSystems,
      createdBy: user._id,
      updatedAt: now,
    });

    // Audit log
    await ctx.db.insert("audit_logs", {
      businessId: args.businessId,
      userId: user._id,
      action: "security_incident_created",
      entityType: "security_incident",
      entityId: incidentId,
      details: { title: args.title, severity: args.severity },
      createdAt: now,
    });

    return incidentId;
  },
});

/**
 * Update security incident
 */
export const updateIncident = mutation({
  args: {
    incidentId: v.id("securityIncidents"),
    status: v.optional(
      v.union(
        v.literal("open"),
        v.literal("investigating"),
        v.literal("contained"),
        v.literal("resolved"),
        v.literal("closed")
      )
    ),
    mitigation: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const { incidentId, ...updates } = args;
    const incident = await ctx.db.get(incidentId);
    if (!incident) throw new Error("Incident not found");

    const now = Date.now();
    await ctx.db.patch(incidentId, {
      ...updates,
      resolvedAt: args.status === "resolved" || args.status === "closed" ? now : incident.resolvedAt,
      updatedAt: now,
    });

    return incidentId;
  },
});

/**
 * Acknowledge threat alert
 */
export const acknowledgeAlert = mutation({
  args: { alertId: v.id("threatDetectionAlerts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.alertId, {
      isAcknowledged: true,
      acknowledgedBy: user._id,
      acknowledgedAt: Date.now(),
    });

    return true;
  },
});

/**
 * Add compliance certification
 */
export const addCertification = mutation({
  args: {
    businessId: v.id("businesses"),
    certType: v.union(
      v.literal("SOC2"),
      v.literal("ISO27001"),
      v.literal("GDPR"),
      v.literal("HIPAA"),
      v.literal("PCI_DSS"),
      v.literal("other")
    ),
    issueDate: v.number(),
    expiryDate: v.number(),
    auditor: v.string(),
    documents: v.array(v.id("_storage")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const now = Date.now();
    const certId = await ctx.db.insert("complianceCertifications", {
      ...args,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    return certId;
  },
});

/**
 * Detect threats (internal action for cron)
 */
export const detectThreats = internalAction({
  args: {},
  handler: async (ctx) => {
    // Simulate threat detection (in production, this would analyze logs, patterns, etc.)
    const businesses = await ctx.runQuery("businesses:listAllBusinesses" as any, {});

    for (const business of businesses) {
      // Random threat detection for demo
      if (Math.random() < 0.1) {
        await ctx.runMutation(internal.enterpriseSecurity.createThreatAlert as any, {
          businessId: business._id,
          alertType: "anomaly_detected",
          severity: "medium",
          source: "automated_scan",
          details: { message: "Unusual activity pattern detected" },
        });
      }
    }
  },
});

/**
 * Create threat alert (internal mutation)
 */
export const createThreatAlert = internalMutation({
  args: {
    businessId: v.id("businesses"),
    alertType: v.union(
      v.literal("suspicious_login"),
      v.literal("unusual_activity"),
      v.literal("policy_violation"),
      v.literal("anomaly_detected"),
      v.literal("vulnerability_found")
    ),
    severity: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    source: v.string(),
    details: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("threatDetectionAlerts", {
      ...args,
      isAcknowledged: false,
      createdAt: Date.now(),
    });
  },
});

/**
 * Check certification expiry (internal action for cron)
 */
export const checkCertificationExpiry = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    const certs = await ctx.runQuery(internal.enterpriseSecurity.getAllCertifications as any, {});

    for (const cert of certs) {
      if (cert.status === "active" && cert.expiryDate - now < thirtyDays) {
        await ctx.runMutation(internal.enterpriseSecurity.updateCertificationStatus as any, {
          certId: cert._id,
          status: "in_renewal",
        });
      }
    }
  },
});

/**
 * Get all certifications (internal query)
 */
export const getAllCertifications = internalMutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("complianceCertifications").collect();
  },
});

/**
 * Update certification status (internal mutation)
 */
export const updateCertificationStatus = internalMutation({
  args: {
    certId: v.id("complianceCertifications"),
    status: v.union(
      v.literal("active"),
      v.literal("pending"),
      v.literal("expired"),
      v.literal("in_renewal")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.certId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});
