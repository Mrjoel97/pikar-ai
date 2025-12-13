import { v } from "convex/values";
import { query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Get resource allocation overview
 */
export const getResourceAllocation = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    // Demo data for now - would integrate with actual resource/project data
    const resources = [
      { id: "1", name: "Engineering Team", type: "team", totalCapacity: 160 },
      { id: "2", name: "Marketing Team", type: "team", totalCapacity: 120 },
      { id: "3", name: "Sales Team", type: "team", totalCapacity: 100 },
      { id: "4", name: "Operations Team", type: "team", totalCapacity: 80 },
    ];

    const allocations = resources.map(resource => {
      const allocated = Math.floor(resource.totalCapacity * (0.6 + Math.random() * 0.3));
      const utilization = (allocated / resource.totalCapacity) * 100;

      return {
        resourceId: resource.id,
        resourceName: resource.name,
        type: resource.type,
        totalCapacity: resource.totalCapacity,
        allocated,
        available: resource.totalCapacity - allocated,
        utilization: Math.round(utilization),
        status: utilization > 90 ? "overallocated" : utilization > 75 ? "high" : utilization > 50 ? "optimal" : "underutilized",
      };
    });

    return allocations;
  },
});

/**
 * Get resource utilization metrics
 */
export const getResourceUtilization = query({
  args: {
    businessId: v.id("businesses"),
    timeframe: v.optional(v.union(v.literal("week"), v.literal("month"), v.literal("quarter"))),
  },
  handler: async (ctx, args) => {
    const timeframe = args.timeframe || "month";
    
    // Demo data - would calculate from actual time tracking
    const utilizationData = [
      { resource: "Engineering", billable: 75, nonBillable: 15, available: 10 },
      { resource: "Marketing", billable: 60, nonBillable: 25, available: 15 },
      { resource: "Sales", billable: 85, nonBillable: 10, available: 5 },
      { resource: "Operations", billable: 50, nonBillable: 30, available: 20 },
    ];

    return {
      timeframe,
      data: utilizationData,
      averageUtilization: Math.round(
        utilizationData.reduce((sum, d) => sum + d.billable + d.nonBillable, 0) / utilizationData.length
      ),
    };
  },
});

/**
 * Get resource capacity planning
 */
export const getResourceCapacity = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    // Demo capacity vs demand data
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const capacityData = months.map((month, i) => ({
      month,
      capacity: 400 + i * 20,
      demand: 350 + i * 35,
      gap: (400 + i * 20) - (350 + i * 35),
    }));

    return {
      capacityData,
      projectedShortfall: capacityData.filter(d => d.gap < 0).length,
      recommendedHiring: Math.max(0, Math.ceil(-Math.min(...capacityData.map(d => d.gap)) / 40)),
    };
  },
});

/**
 * Identify resource bottlenecks
 */
export const getBottlenecks = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const bottlenecks = [
      {
        resource: "Senior Engineers",
        severity: "high",
        utilization: 95,
        impact: "Delaying 3 projects",
        recommendation: "Hire 2 senior engineers or promote from within",
      },
      {
        resource: "Design Team",
        severity: "medium",
        utilization: 88,
        impact: "Slowing marketing campaigns",
        recommendation: "Contract freelance designers for peak periods",
      },
    ];

    return bottlenecks;
  },
});
