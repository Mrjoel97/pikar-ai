import { v } from "convex/values";
import { query } from "../_generated/server";

export const getSkillsInventory = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    return {
      criticalGaps: [
        { skill: "AI/ML", currentLevel: 45, targetLevel: 80, gap: 35 },
        { skill: "Cloud Architecture", currentLevel: 62, targetLevel: 85, gap: 23 },
      ],
      skillDistribution: [
        { skill: "Project Management", employees: 12, proficiency: 78 },
        { skill: "Software Development", employees: 25, proficiency: 82 },
      ],
    };
  },
});
