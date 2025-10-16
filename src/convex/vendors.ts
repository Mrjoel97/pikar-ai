import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

/**
 * List vendors for a business
 */
export const listVendors = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("pending"))),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      // Guest-safe: return demo data
      return [
        {
          _id: "demo1" as Id<"vendors">,
          businessId: "demo" as Id<"businesses">,
          name: "CloudTech Solutions",
          category: "Software",
          status: "active" as const,
          contactName: "John Smith",
          contactEmail: "john@cloudtech.com",
          contractStart: Date.now() - 365 * 24 * 60 * 60 * 1000,
          contractEnd: Date.now() + 180 * 24 * 60 * 60 * 1000,
          contractValue: 120000,
          performanceScore: 92,
          riskLevel: "low" as const,
          lastReviewDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          _id: "demo2" as Id<"vendors">,
          businessId: "demo" as Id<"businesses">,
          name: "Global Logistics Inc",
          category: "Logistics",
          status: "active" as const,
          contactName: "Sarah Johnson",
          contactEmail: "sarah@globallogistics.com",
          contractStart: Date.now() - 180 * 24 * 60 * 60 * 1000,
          contractEnd: Date.now() + 45 * 24 * 60 * 60 * 1000,
          contractValue: 85000,
          performanceScore: 78,
          riskLevel: "medium" as const,
          lastReviewDate: Date.now() - 60 * 24 * 60 * 60 * 1000,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];
    }

    let vendorsQuery = ctx.db
      .query("vendors")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId as Id<"businesses">));

    const vendors = await vendorsQuery.collect();

    if (args.status) {
      return vendors.filter((v) => v.status === args.status);
    }

    return vendors;
  },
});

/**
 * Get vendor by ID
 */
export const getVendor = query({
  args: {
    vendorId: v.id("vendors"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.vendorId);
  },
});

/**
 * Get vendor performance metrics
 */
export const getVendorPerformance = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    vendorId: v.optional(v.id("vendors")),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      // Demo data
      return {
        averageScore: 85,
        onTimeDelivery: 92,
        qualityScore: 88,
        responsiveness: 90,
        costEfficiency: 82,
        trend: [78, 82, 85, 87, 88, 85],
      };
    }

    // Use a conditional filter instead of returning a literal `true` inside filter
    let metricsQuery = ctx.db
      .query("vendorPerformanceMetrics")
      .withIndex("by_business", (qb) =>
        qb.eq("businessId", args.businessId as Id<"businesses">)
      );

    if (args.vendorId) {
      metricsQuery = metricsQuery.filter((qb) =>
        qb.eq(qb.field("vendorId"), args.vendorId!)
      );
    }

    const metrics = await metricsQuery.collect();

    if (metrics.length === 0) {
      return {
        averageScore: 0,
        onTimeDelivery: 0,
        qualityScore: 0,
        responsiveness: 0,
        costEfficiency: 0,
        trend: [],
      };
    }

    const latest = metrics[metrics.length - 1];
    return {
      averageScore: latest.overallScore,
      onTimeDelivery: latest.onTimeDelivery,
      qualityScore: latest.qualityScore,
      responsiveness: latest.responsiveness,
      costEfficiency: latest.costEfficiency,
      trend: metrics.slice(-6).map((m) => m.overallScore),
    };
  },
});

/**
 * Get upcoming contract renewals
 */
export const getUpcomingRenewals = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    daysAhead: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      return [];
    }

    const days = args.daysAhead || 90;
    const cutoff = Date.now() + days * 24 * 60 * 60 * 1000;

    const vendors = await ctx.db
      .query("vendors")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId as Id<"businesses">))
      .filter((q) => q.lte(q.field("contractEnd"), cutoff))
      .collect();

    return vendors.map((v) => ({
      ...v,
      daysUntilRenewal: Math.floor((v.contractEnd - Date.now()) / (24 * 60 * 60 * 1000)),
    }));
  },
});

/**
 * Get vendor risk assessment
 */
export const getVendorRiskAssessment = query({
  args: {
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      return {
        highRisk: 1,
        mediumRisk: 3,
        lowRisk: 8,
        totalVendors: 12,
      };
    }

    const vendors = await ctx.db
      .query("vendors")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId as Id<"businesses">))
      .collect();

    const riskCounts = {
      highRisk: vendors.filter((v) => v.riskLevel === "high").length,
      mediumRisk: vendors.filter((v) => v.riskLevel === "medium").length,
      lowRisk: vendors.filter((v) => v.riskLevel === "low").length,
      totalVendors: vendors.length,
    };

    return riskCounts;
  },
});

/**
 * Create vendor
 */
export const createVendor = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    category: v.string(),
    contactName: v.string(),
    contactEmail: v.string(),
    contactPhone: v.optional(v.string()),
    contractStart: v.number(),
    contractEnd: v.number(),
    contractValue: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const vendorId = await ctx.db.insert("vendors", {
      businessId: args.businessId,
      name: args.name,
      category: args.category,
      status: "active",
      contactName: args.contactName,
      contactEmail: args.contactEmail,
      contactPhone: args.contactPhone,
      contractStart: args.contractStart,
      contractEnd: args.contractEnd,
      contractValue: args.contractValue,
      performanceScore: 0,
      riskLevel: "medium",
      lastReviewDate: Date.now(),
      notes: args.notes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Audit log
    await ctx.db.insert("audit_logs", {
      businessId: args.businessId,
      action: "vendor_created",
      entityType: "vendor",
      entityId: vendorId,
      details: { name: args.name, category: args.category },
      createdAt: Date.now(),
    });

    // Schedule renewal alert check
    await ctx.scheduler.runAfter(
      0,
      internal.vendors.checkRenewalAlerts,
      { businessId: args.businessId }
    );

    return vendorId;
  },
});

/**
 * Update vendor
 */
export const updateVendor = mutation({
  args: {
    vendorId: v.id("vendors"),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("pending"))),
    contactName: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    contractStart: v.optional(v.number()),
    contractEnd: v.optional(v.number()),
    contractValue: v.optional(v.number()),
    riskLevel: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const vendor = await ctx.db.get(args.vendorId);
    if (!vendor) throw new Error("Vendor not found");

    const updates: any = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.category !== undefined) updates.category = args.category;
    if (args.status !== undefined) updates.status = args.status;
    if (args.contactName !== undefined) updates.contactName = args.contactName;
    if (args.contactEmail !== undefined) updates.contactEmail = args.contactEmail;
    if (args.contactPhone !== undefined) updates.contactPhone = args.contactPhone;
    if (args.contractStart !== undefined) updates.contractStart = args.contractStart;
    if (args.contractEnd !== undefined) updates.contractEnd = args.contractEnd;
    if (args.contractValue !== undefined) updates.contractValue = args.contractValue;
    if (args.riskLevel !== undefined) updates.riskLevel = args.riskLevel;
    if (args.notes !== undefined) updates.notes = args.notes;

    await ctx.db.patch(args.vendorId, updates);

    // Audit log
    await ctx.db.insert("audit_logs", {
      businessId: vendor.businessId,
      action: "vendor_updated",
      entityType: "vendor",
      entityId: args.vendorId,
      details: updates,
      createdAt: Date.now(),
    });

    return args.vendorId;
  },
});

/**
 * Record vendor performance
 */
export const recordPerformance = mutation({
  args: {
    vendorId: v.id("vendors"),
    onTimeDelivery: v.number(),
    qualityScore: v.number(),
    responsiveness: v.number(),
    costEfficiency: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const vendor = await ctx.db.get(args.vendorId);
    if (!vendor) throw new Error("Vendor not found");

    const overallScore = Math.round(
      (args.onTimeDelivery + args.qualityScore + args.responsiveness + args.costEfficiency) / 4
    );

    const metricId = await ctx.db.insert("vendorPerformanceMetrics", {
      businessId: vendor.businessId,
      vendorId: args.vendorId,
      onTimeDelivery: args.onTimeDelivery,
      qualityScore: args.qualityScore,
      responsiveness: args.responsiveness,
      costEfficiency: args.costEfficiency,
      overallScore,
      notes: args.notes,
      recordedAt: Date.now(),
      recordedBy: identity.email || "unknown",
    });

    // Update vendor's performance score
    await ctx.db.patch(args.vendorId, {
      performanceScore: overallScore,
      lastReviewDate: Date.now(),
    });

    // Audit log
    await ctx.db.insert("audit_logs", {
      businessId: vendor.businessId,
      action: "vendor_performance_recorded",
      entityType: "vendor",
      entityId: args.vendorId,
      details: { overallScore, metricId },
      createdAt: Date.now(),
    });

    return metricId;
  },
});

/**
 * Internal: Check renewal alerts
 */
export const checkRenewalAlerts = internalMutation({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const sixtyDays = 60 * 24 * 60 * 60 * 1000;
    const ninetyDays = 90 * 24 * 60 * 60 * 1000;

    const vendors = await ctx.db
      .query("vendors")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const business = await ctx.db.get(args.businessId);
    if (!business) return;

    for (const vendor of vendors) {
      const daysUntilRenewal = Math.floor((vendor.contractEnd - now) / (24 * 60 * 60 * 1000));
      
      if (daysUntilRenewal <= 90 && daysUntilRenewal > 0) {
        // Check if alert already exists
        const [existingAlert] = await ctx.db
          .query("notifications")
          .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
          .filter((q) =>
            q.and(
              q.eq(q.field("type"), "system_alert"),
              q.eq(q.field("title"), `Contract Renewal: ${vendor.name}`)
            )
          )
          .take(1);

        if (!existingAlert) {
          let priority: "low" | "medium" | "high" = "low";
          if (daysUntilRenewal <= 30) priority = "high";
          else if (daysUntilRenewal <= 60) priority = "medium";

          await ctx.db.insert("notifications", {
            businessId: args.businessId,
            userId: business.ownerId,
            type: "system_alert",
            title: `Contract Renewal: ${vendor.name}`,
            message: `Contract expires in ${daysUntilRenewal} days. Value: $${vendor.contractValue.toLocaleString()}`,
            data: {
              kind: "vendor_renewal",
              vendorId: vendor._id,
              daysUntilRenewal,
              contractValue: vendor.contractValue,
            },
            isRead: false,
            priority,
            createdAt: Date.now(),
          });
        }
      }
    }
  },
});