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
      daysUntilRenewal: Math.floor(((v.contractEnd || 0) - Date.now()) / (24 * 60 * 60 * 1000)),
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
 * Get vendor performance scorecard
 */
export const getVendorScorecard = query({
  args: {
    vendorId: v.id("vendors"),
  },
  handler: async (ctx, args) => {
    const vendor = await ctx.db.get(args.vendorId);
    if (!vendor) return null;

    const metrics = await ctx.db
      .query("vendorPerformanceMetrics")
      .filter((q) => q.eq(q.field("vendorId"), args.vendorId))
      .order("desc")
      .take(12);

    if (metrics.length === 0) {
      return {
        vendor,
        currentScore: 0,
        trend: "stable" as const,
        metrics: {
          onTimeDelivery: 0,
          qualityScore: 0,
          responsiveness: 0,
          costEfficiency: 0,
        },
        history: [],
      };
    }

    const latest = metrics[0];
    const previous = metrics[1];
    const trend = previous
      ? (latest.overallScore || 0) > (previous.overallScore || 0)
        ? ("improving" as const)
        : (latest.overallScore || 0) < (previous.overallScore || 0)
        ? ("declining" as const)
        : ("stable" as const)
      : ("stable" as const);

    return {
      vendor,
      currentScore: latest.overallScore,
      trend,
      metrics: {
        onTimeDelivery: latest.onTimeDelivery,
        qualityScore: latest.qualityScore,
        responsiveness: latest.responsiveness,
        costEfficiency: latest.costEfficiency,
      },
      history: metrics.map((m) => ({
        date: m.recordedAt,
        score: m.overallScore,
      })),
    };
  },
});

/**
 * Get contract timeline
 */
export const getContractTimeline = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const vendors = await ctx.db
      .query("vendors")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const now = Date.now();
    const timeline = vendors.map((v) => {
      const totalDays = Math.floor(((v.contractEnd || 0) - (v.contractStart || 0)) / (24 * 60 * 60 * 1000));
      const elapsedDays = Math.floor((now - (v.contractStart || 0)) / (24 * 60 * 60 * 1000));
      const remainingDays = Math.floor(((v.contractEnd || 0) - now) / (24 * 60 * 60 * 1000));
      const progress = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));

      return {
        vendorId: v._id,
        vendorName: v.name,
        contractStart: v.contractStart,
        contractEnd: v.contractEnd,
        totalDays,
        elapsedDays,
        remainingDays,
        progress,
        status: remainingDays <= 30 ? "expiring" : remainingDays <= 90 ? "warning" : "active",
      };
    });

    return timeline.sort((a, b) => a.remainingDays - b.remainingDays);
  },
});

/**
 * Get spend analytics
 */
export const getSpendAnalytics = query({
  args: {
    businessId: v.id("businesses"),
    timeRange: v.optional(v.union(v.literal("30d"), v.literal("90d"), v.literal("1y"))),
  },
  handler: async (ctx, args) => {
    const vendors = await ctx.db
      .query("vendors")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const totalSpend = vendors.reduce((sum, v) => sum + (v.contractValue || 0), 0);
    const activeSpend = vendors
      .filter((v) => v.status === "active")
      .reduce((sum, v) => sum + (v.contractValue || 0), 0);

    // Category breakdown
    const categorySpend: Record<string, number> = {};
    vendors.forEach((v) => {
      categorySpend[v.category] = (categorySpend[v.category] || 0) + (v.contractValue || 0);
    });

    const categoryBreakdown = Object.entries(categorySpend)
      .map(([category, spend]) => ({
        category,
        spend,
        percentage: (spend / totalSpend) * 100,
      }))
      .sort((a, b) => b.spend - a.spend);

    // Top vendors by spend
    const topVendors = vendors
      .sort((a, b) => (b.contractValue || 0) - (a.contractValue || 0))
      .slice(0, 10)
      .map((v) => ({
        vendorId: v._id,
        name: v.name,
        spend: v.contractValue || 0,
        percentage: ((v.contractValue || 0) / totalSpend) * 100,
      }));

    // Monthly spend projection (simplified)
    const monthlySpend = activeSpend / 12;

    return {
      totalSpend,
      activeSpend,
      monthlySpend,
      categoryBreakdown,
      topVendors,
      vendorCount: vendors.length,
      averageContractValue: totalSpend / vendors.length || 0,
    };
  },
});

/**
 * Get vendor risk assessment details
 */
export const getVendorRiskDetails = query({
  args: {
    vendorId: v.id("vendors"),
  },
  handler: async (ctx, args) => {
    const vendor = await ctx.db.get(args.vendorId);
    if (!vendor) return null;

    const metrics = await ctx.db
      .query("vendorPerformanceMetrics")
      .filter((q) => q.eq(q.field("vendorId"), args.vendorId))
      .order("desc")
      .take(6);

    const now = Date.now();
    const daysUntilExpiry = Math.floor(((vendor.contractEnd || 0) - now) / (24 * 60 * 60 * 1000));

    // Calculate risk factors
    const riskFactors = [];
    let riskScore = 0;

    // Performance risk
    if ((vendor.performanceScore || 0) < 60) {
      riskFactors.push({ factor: "Low Performance Score", severity: "high", impact: 30 });
      riskScore += 30;
    } else if ((vendor.performanceScore || 0) < 75) {
      riskFactors.push({ factor: "Below Average Performance", severity: "medium", impact: 15 });
      riskScore += 15;
    }

    // Contract expiry risk
    if (daysUntilExpiry <= 30) {
      riskFactors.push({ factor: "Contract Expiring Soon", severity: "high", impact: 25 });
      riskScore += 25;
    } else if (daysUntilExpiry <= 90) {
      riskFactors.push({ factor: "Contract Renewal Approaching", severity: "medium", impact: 10 });
      riskScore += 10;
    }

    // Performance trend risk
    if (metrics.length >= 3) {
      const recentScores = metrics.slice(0, 3).map((m) => m.overallScore || 0);
      const isDecreasing = (recentScores[0] || 0) < (recentScores[1] || 0) && (recentScores[1] || 0) < (recentScores[2] || 0);
      if (isDecreasing) {
        riskFactors.push({ factor: "Declining Performance Trend", severity: "medium", impact: 20 });
        riskScore += 20;
      }
    }

    // High value risk
    if ((vendor.contractValue || 0) > 100000) {
      riskFactors.push({ factor: "High Contract Value", severity: "low", impact: 10 });
      riskScore += 10;
    }

    const riskLevel =
      riskScore >= 50 ? "high" : riskScore >= 25 ? "medium" : "low";

    return {
      vendor,
      riskScore: Math.min(100, riskScore),
      riskLevel,
      riskFactors,
      daysUntilExpiry,
      recommendations: generateRiskRecommendations(riskFactors, vendor),
    };
  },
});

function generateRiskRecommendations(riskFactors: any[], vendor: any): string[] {
  const recommendations: string[] = [];

  riskFactors.forEach((factor) => {
    if (factor.factor.includes("Performance")) {
      recommendations.push("Schedule performance review meeting");
      recommendations.push("Implement performance improvement plan");
    }
    if (factor.factor.includes("Expiring")) {
      recommendations.push("Initiate contract renewal discussions immediately");
      recommendations.push("Evaluate alternative vendors");
    }
    if (factor.factor.includes("Declining")) {
      recommendations.push("Conduct root cause analysis");
      recommendations.push("Set up weekly performance monitoring");
    }
  });

  if (recommendations.length === 0) {
    recommendations.push("Continue regular monitoring");
    recommendations.push("Maintain current vendor relationship");
  }

  return [...new Set(recommendations)].slice(0, 5);
}

/**
 * Compare vendors
 */
export const compareVendors = query({
  args: {
    vendorIds: v.array(v.id("vendors")),
  },
  handler: async (ctx, args) => {
    if (args.vendorIds.length === 0) return [];

    const comparisons = await Promise.all(
      args.vendorIds.map(async (vendorId) => {
        const vendor = await ctx.db.get(vendorId);
        if (!vendor) return null;

        const metrics = await ctx.db
          .query("vendorPerformanceMetrics")
          .filter((q) => q.eq(q.field("vendorId"), vendorId))
          .order("desc")
          .take(1);

        const latestMetric = metrics[0];

        return {
          vendorId: vendor._id,
          name: vendor.name,
          category: vendor.category,
          contractValue: vendor.contractValue,
          performanceScore: vendor.performanceScore,
          riskLevel: vendor.riskLevel,
          onTimeDelivery: latestMetric?.onTimeDelivery || 0,
          qualityScore: latestMetric?.qualityScore || 0,
          responsiveness: latestMetric?.responsiveness || 0,
          costEfficiency: latestMetric?.costEfficiency || 0,
          contractEnd: vendor.contractEnd,
        };
      })
    );

    return comparisons.filter((c) => c !== null);
  },
});

/**
 * Get vendor performance trends
 */
export const getVendorPerformanceTrends = query({
  args: {
    businessId: v.id("businesses"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 180;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const vendors = await ctx.db
      .query("vendors")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const trends = await Promise.all(
      vendors.map(async (vendor) => {
        const metrics = await ctx.db
          .query("vendorPerformanceMetrics")
          .filter((q) =>
            q.and(
              q.eq(q.field("vendorId"), vendor._id),
              q.gte(q.field("recordedAt"), cutoff)
            )
          )
          .order("asc")
          .collect();

        return {
          vendorId: vendor._id,
          vendorName: vendor.name,
          dataPoints: metrics.map((m) => ({
            date: m.recordedAt,
            score: m.overallScore,
          })),
        };
      })
    );

    return trends.filter((t) => t.dataPoints.length > 0);
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

    const updates: any = {};
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
      metricType: "performance_review",
      onTimeDelivery: args.onTimeDelivery,
      qualityScore: args.qualityScore,
      responsiveness: args.responsiveness,
      costEfficiency: args.costEfficiency,
      overallScore,
      recordedAt: Date.now(),
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
      const daysUntilRenewal = Math.floor(((vendor.contractEnd || 0) - now) / (24 * 60 * 60 * 1000));
      
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
            message: `Contract expires in ${daysUntilRenewal} days. Value: ${(vendor.contractValue || 0).toLocaleString()}`,
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

// Add new mutation to calculate and update vendor performance score
export const calculatePerformanceScore = mutation({
  args: {
    vendorId: v.id("vendors"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const vendor = await ctx.db.get(args.vendorId);
    if (!vendor) throw new Error("Vendor not found");

    // Get recent performance metrics (last 6 months)
    const sixMonthsAgo = Date.now() - (180 * 24 * 60 * 60 * 1000);
    const metrics = await ctx.db
      .query("vendorPerformanceMetrics")
      .filter((q) =>
        q.and(
          q.eq(q.field("vendorId"), args.vendorId),
          q.gte(q.field("recordedAt"), sixMonthsAgo)
        )
      )
      .collect();

    if (metrics.length === 0) {
      return { score: 0, message: "No performance data available" };
    }

    // Calculate weighted average score
    const weights = {
      onTimeDelivery: 0.3,
      qualityScore: 0.3,
      responsiveness: 0.2,
      costEfficiency: 0.2,
    };

    let totalScore = 0;
    for (const metric of metrics) {
      const weightedScore = 
        ((metric.onTimeDelivery || 0) * weights.onTimeDelivery) +
        ((metric.qualityScore || 0) * weights.qualityScore) +
        ((metric.responsiveness || 0) * weights.responsiveness) +
        ((metric.costEfficiency || 0) * weights.costEfficiency);
      totalScore += weightedScore;
    }

    const avgScore = Math.round(totalScore / metrics.length);

    // Calculate trend (improving/declining/stable)
    let trend: "improving" | "declining" | "stable" = "stable";
    if (metrics.length >= 3) {
      const recent = metrics.slice(-3).map(m => m.overallScore || 0);
      const older = metrics.slice(0, 3).map(m => m.overallScore || 0);
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
      
      if (recentAvg > olderAvg + 5) trend = "improving";
      else if (recentAvg < olderAvg - 5) trend = "declining";
    }

    // Determine risk level based on score
    let riskLevel: "low" | "medium" | "high" = "medium";
    if (avgScore >= 80) riskLevel = "low";
    else if (avgScore < 60) riskLevel = "high";

    // Update vendor with calculated score
    await ctx.db.patch(args.vendorId, {
      performanceScore: avgScore,
      riskLevel,
      lastReviewDate: Date.now(),
    });

    // Audit log
    await ctx.db.insert("audit_logs", {
      businessId: vendor.businessId,
      action: "vendor_score_calculated",
      entityType: "vendor",
      entityId: args.vendorId,
      details: { score: avgScore, trend, riskLevel, metricsCount: metrics.length },
      createdAt: Date.now(),
    });

    return { 
      score: avgScore, 
      trend, 
      riskLevel,
      metricsAnalyzed: metrics.length,
      message: "Performance score calculated successfully" 
    };
  },
});

// Add new query to get vendor performance insights
export const getVendorPerformanceInsights = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const vendors = await ctx.db
      .query("vendors")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const insights = {
      topPerformers: vendors
        .filter(v => (v.performanceScore || 0) >= 80)
        .sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0))
        .slice(0, 5),
      atRisk: vendors
        .filter(v => (v.performanceScore || 0) < 60 || v.riskLevel === "high")
        .sort((a, b) => (a.performanceScore || 0) - (b.performanceScore || 0))
        .slice(0, 5),
      needsReview: vendors
        .filter(v => {
          const daysSinceReview = (Date.now() - (v.lastReviewDate || 0)) / (24 * 60 * 60 * 1000);
          return daysSinceReview > 90;
        })
        .slice(0, 5),
      averageScore: vendors.length > 0
        ? Math.round(vendors.reduce((sum, v) => sum + (v.performanceScore || 0), 0) / vendors.length)
        : 0,
    };

    return insights;
  },
});