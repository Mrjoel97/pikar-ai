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
  handler: async (ctx: any, args) => {
    if (!args.businessId) return [];

    let incidents = await ctx.db
      .query("securityIncidents")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!))
      .order("desc")
      .take(args.limit || 50);

    if (args.status) {
      incidents = incidents.filter((i: any) => i.status === args.status);
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
  handler: async (ctx: any, args) => {
    if (!args.businessId) return [];

    let alerts = await ctx.db
      .query("threatDetectionAlerts")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!))
      .order("desc")
      .take(args.limit || 100);

    if (typeof args.acknowledged === "boolean") {
      alerts = alerts.filter((a: any) => a.isAcknowledged === args.acknowledged);
    }

    return alerts;
  },
});

/**
 * Get compliance certifications
 */
export const getCertifications = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx: any, args) => {
    if (!args.businessId) return [];

    return await ctx.db
      .query("complianceCertifications")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!))
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
  handler: async (ctx: any, args) => {
    if (!args.businessId) return [];

    return await ctx.db
      .query("securityAudits")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!))
      .order("desc")
      .take(args.limit || 20);
  },
});

/**
 * Get security metrics overview
 */
export const getSecurityMetrics = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx: any, args) => {
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
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!))
      .collect();

    const alerts = await ctx.db
      .query("threatDetectionAlerts")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!))
      .collect();

    const certs = await ctx.db
      .query("complianceCertifications")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!))
      .collect();

    const audits = await ctx.db
      .query("securityAudits")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!))
      .order("desc")
      .take(1);

    const activeIncidents = incidents.filter(
      (i: any) => i.status === "open" || i.status === "investigating"
    ).length;

    const criticalAlerts = alerts.filter(
      (a: any) => !a.isAcknowledged && a.severity === "critical"
    ).length;

    const activeCerts = certs.filter((c: any) => c.status === "active").length;
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
 * Get threat intelligence data
 */
export const getThreatIntelligence = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx: any, args) => {
    if (!args.businessId) {
      return {
        threatLevel: "low",
        activeThreatCampaigns: [],
        vulnerabilities: [],
        indicators: [],
      };
    }

    const alerts = await ctx.db
      .query("threatDetectionAlerts")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!))
      .order("desc")
      .take(100);

    const criticalAlerts = alerts.filter((a: any) => a.severity === "critical" && !a.isAcknowledged);
    const highAlerts = alerts.filter((a: any) => a.severity === "high" && !a.isAcknowledged);

    const threatLevel = 
      criticalAlerts.length > 5 ? "critical" :
      criticalAlerts.length > 0 || highAlerts.length > 10 ? "high" :
      highAlerts.length > 0 ? "medium" : "low";

    // Aggregate threat patterns
    const threatTypes = alerts.reduce((acc: any, alert: any) => {
      acc[alert.alertType] = (acc[alert.alertType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const activeThreatCampaigns = Object.entries(threatTypes)
      .map(([type, count]) => ({
        campaignType: type,
        detectionCount: count as number,
        severity: (count as number) > 10 ? "high" : (count as number) > 5 ? "medium" : "low",
        firstSeen: alerts.find((a: any) => a.alertType === type)?.createdAt || Date.now(),
      }))
      .sort((a: any, b: any) => b.detectionCount - a.detectionCount)
      .slice(0, 5);

    return {
      threatLevel,
      activeThreatCampaigns,
      vulnerabilities: [],
      indicators: alerts.slice(0, 10).map((a: any) => ({
        type: a.alertType,
        severity: a.severity,
        timestamp: a.createdAt,
      })),
    };
  },
});

/**
 * Get anomaly detection results
 */
export const getAnomalyDetection = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx: any, args) => {
    if (!args.businessId) {
      return {
        anomalies: [],
        anomalyScore: 0,
        baselineMetrics: {},
      };
    }

    const alerts = await ctx.db
      .query("threatDetectionAlerts")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!))
      .order("desc")
      .take(50);

    // Simple anomaly detection based on alert frequency
    const now = Date.now();
    const last24h = alerts.filter((a: any) => now - a.createdAt < 24 * 60 * 60 * 1000);
    const last7d = alerts.filter((a: any) => now - a.createdAt < 7 * 24 * 60 * 60 * 1000);

    const avgDaily = last7d.length / 7;
    const todayCount = last24h.length;
    const anomalyScore = avgDaily > 0 ? (todayCount / avgDaily) * 100 : 0;

    const anomalies = last24h
      .filter((a: any) => a.severity === "critical" || a.severity === "high")
      .map((a: any) => ({
        _id: a._id,
        type: a.alertType,
        severity: a.severity,
        timestamp: a.createdAt,
        description: `Unusual ${a.alertType.replace(/_/g, " ")} detected`,
        score: anomalyScore,
      }));

    return {
      anomalies,
      anomalyScore: Math.round(anomalyScore),
      baselineMetrics: {
        avgDailyAlerts: Math.round(avgDaily),
        todayAlerts: todayCount,
        deviation: Math.round(anomalyScore - 100),
      },
    };
  },
});

/**
 * Calculate security score
 */
export const getSecurityScore = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx: any, args) => {
    if (!args.businessId) {
      return {
        overallScore: 0,
        categoryScores: {},
        trend: "stable",
        recommendations: [],
      };
    }

    const incidents = await ctx.db
      .query("securityIncidents")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!))
      .collect();

    const alerts = await ctx.db
      .query("threatDetectionAlerts")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!))
      .collect();

    const certs = await ctx.db
      .query("complianceCertifications")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!))
      .collect();

    // Calculate scores (0-100)
    const incidentScore = Math.max(0, 100 - incidents.filter((i: any) => i.status === "open").length * 10);
    const alertScore = Math.max(0, 100 - alerts.filter((a: any) => !a.isAcknowledged).length * 5);
    const complianceScore = certs.length > 0 ? (certs.filter((c: any) => c.status === "active").length / certs.length) * 100 : 50;

    const overallScore = Math.round((incidentScore + alertScore + complianceScore) / 3);

    return {
      overallScore,
      categoryScores: {
        incidentManagement: incidentScore,
        threatDetection: alertScore,
        compliance: Math.round(complianceScore),
      },
      trend: overallScore > 75 ? "improving" : overallScore > 50 ? "stable" : "declining",
      recommendations: [
        overallScore < 70 ? "Address open security incidents" : null,
        alertScore < 70 ? "Acknowledge and investigate pending alerts" : null,
        complianceScore < 80 ? "Renew expiring certifications" : null,
      ].filter(Boolean) as string[],
    };
  },
});

/**
 * Get incident response workflow status
 */
export const getIncidentResponseWorkflow = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx: any, args) => {
    if (!args.businessId) {
      return {
        activeWorkflows: [],
        completedWorkflows: [],
        avgResponseTime: 0,
      };
    }

    const incidents = await ctx.db
      .query("securityIncidents")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!))
      .order("desc")
      .take(50);

    const activeWorkflows = incidents
      .filter((i: any) => i.status === "open" || i.status === "investigating")
      .map((i: any) => ({
        _id: i._id,
        title: i.title,
        status: i.status,
        severity: i.severity,
        assignedTo: i.assignedTo,
        createdAt: i.detectedAt,
        steps: [
          { name: "Detection", status: "completed", timestamp: i.detectedAt },
          { name: "Investigation", status: i.status === "investigating" ? "in_progress" : "pending", timestamp: null },
          { name: "Containment", status: "pending", timestamp: null },
          { name: "Resolution", status: "pending", timestamp: null },
        ],
      }));

    const completedWorkflows = incidents
      .filter((i: any) => i.status === "resolved" || i.status === "closed")
      .slice(0, 10);

    const responseTimes = completedWorkflows
      .filter((i: any) => i.resolvedAt)
      .map((i: any) => i.resolvedAt! - i.detectedAt);

    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum: any, t: any) => sum + t, 0) / responseTimes.length
      : 0;

    return {
      activeWorkflows,
      completedWorkflows: completedWorkflows.map((i: any) => ({
        _id: i._id,
        title: i.title,
        severity: i.severity,
        responseTime: i.resolvedAt ? i.resolvedAt - i.detectedAt : 0,
      })),
      avgResponseTime: Math.round(avgResponseTime / (1000 * 60 * 60)), // Convert to hours
    };
  },
});

/**
 * Get compliance monitoring status
 */
export const getComplianceMonitoring = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx: any, args) => {
    if (!args.businessId) {
      return {
        overallCompliance: 0,
        frameworks: [],
        upcomingAudits: [],
        violations: [],
      };
    }

    const certs = await ctx.db
      .query("complianceCertifications")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!))
      .collect();

    const audits = await ctx.db
      .query("securityAudits")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!))
      .order("desc")
      .take(10);

    const activeCerts = certs.filter((c: any) => c.status === "active");
    const overallCompliance = certs.length > 0 ? (activeCerts.length / certs.length) * 100 : 0;

    const frameworks = certs.map((cert: any) => {
      const daysUntilExpiry = Math.floor((cert.expiryDate - Date.now()) / (1000 * 60 * 60 * 24));
      return {
        _id: cert._id,
        name: cert.certType,
        status: cert.status,
        expiryDate: cert.expiryDate,
        daysUntilExpiry,
        complianceLevel: cert.status === "active" ? 100 : 50,
      };
    });

    const upcomingAudits = audits
      .filter((a: any) => a.scheduledDate && a.scheduledDate > Date.now())
      .map((a: any) => ({
        _id: a._id,
        auditType: a.auditType,
        scheduledDate: a.scheduledDate,
        auditor: a.auditor,
      }));

    return {
      overallCompliance: Math.round(overallCompliance),
      frameworks,
      upcomingAudits,
      violations: [],
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
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q: any) => q.eq("email", identity.email!))
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
  handler: async (ctx: any, args) => {
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
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q: any) => q.eq("email", identity.email!))
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
  handler: async (ctx: any, args) => {
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
  handler: async (ctx: any) => {
    // Simulate threat detection (in production, this would analyze logs, patterns, etc.)
    const businesses = await ctx.runQuery("businesses:listAllBusinesses" as any, {});

    for (const business of businesses) {
      // Random threat detection for demo
      if (Math.random() < 0.1) {
        await ctx.runMutation("enterpriseSecurity:createThreatAlert" as any, {
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
  handler: async (ctx: any, args) => {
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
  handler: async (ctx: any) => {
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    const certs = await ctx.runQuery("enterpriseSecurity:getAllCertifications" as any, {});

    for (const cert of certs) {
      if (cert.status === "active" && cert.expiryDate - now < thirtyDays) {
        await ctx.runMutation("enterpriseSecurity:updateCertificationStatus" as any, {
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
  handler: async (ctx: any) => {
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
  handler: async (ctx: any, args) => {
    await ctx.db.patch(args.certId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});