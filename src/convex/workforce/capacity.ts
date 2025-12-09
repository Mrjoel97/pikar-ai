import { v } from "convex/values";
import { query } from "../_generated/server";

export const getCapacityPlanning = query({
  args: {
    businessId: v.id("businesses"),
    timeHorizon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const business = await ctx.db.get(args.businessId);
    const currentHeadcount = business?.teamMembers?.length || 0;

    const projectedDemand = [
      { quarter: "Q1 2025", demand: currentHeadcount * 1.1, projects: 12, workload: 85 },
      { quarter: "Q2 2025", demand: currentHeadcount * 1.25, projects: 15, workload: 92 },
      { quarter: "Q3 2025", demand: currentHeadcount * 1.4, projects: 18, workload: 98 },
      { quarter: "Q4 2025", demand: currentHeadcount * 1.5, projects: 20, workload: 105 },
    ];

    return {
      currentCapacity: currentHeadcount,
      projectedDemand,
      capacityGap: projectedDemand.map((p) => ({
        quarter: p.quarter,
        gap: Math.round(p.demand - currentHeadcount),
        severity: p.workload > 100 ? "critical" : p.workload > 90 ? "high" : "medium",
      })),
    };
  },
});
