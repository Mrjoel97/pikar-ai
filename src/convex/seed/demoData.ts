import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const seedDemoDataForBusiness = internalMutation({
  args: {
    businessId: v.id("businesses"),
    ownerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Seed tasks
    const tasksToCreate = [
      {
        title: "Plan weekly content",
        description: "Outline 3 blog posts and 5 social posts",
        priority: "high" as const,
        urgent: false,
        status: "todo" as const,
      },
      {
        title: "Send welcome newsletter",
        description: "Announce new features and tips",
        priority: "medium" as const,
        urgent: false,
        status: "todo" as const,
      },
      {
        title: "Review analytics",
        description: "Identify top channels and trends",
        priority: "low" as const,
        urgent: false,
        status: "todo" as const,
      },
      {
        title: "Setup approvals",
        description: "Add approvers for marketing workflows",
        priority: "high" as const,
        urgent: true,
        status: "in_progress" as const,
      },
      {
        title: "Clean contact list",
        description: "Remove bounces and unsubscribes",
        priority: "medium" as const,
        urgent: false,
        status: "todo" as const,
      },
    ];

    let tasksCreated = 0;
    for (const t of tasksToCreate) {
      await ctx.db.insert("tasks", {
        businessId: args.businessId,
        title: t.title,
        description: t.description,
        priority: t.priority,
        urgent: t.urgent,
        status: t.status,
        createdAt: now,
        updatedAt: now,
      });
      tasksCreated += 1;
    }

    // Seed contacts
    const contactsToCreate = [
      { email: "alex@example.com", name: "Alex Rivera" },
      { email: "sam@example.com", name: "Sam Lee" },
      { email: "jordan@example.com", name: "Jordan Kim" },
      { email: "devon@example.com", name: "Devon Patel" },
    ];

    let contactsCreated = 0;
    for (const c of contactsToCreate) {
      await ctx.db.insert("contacts", {
        businessId: args.businessId,
        email: c.email,
        name: c.name,
        tags: ["newsletter"],
        status: "subscribed",
        source: "seed",
        createdBy: args.ownerId,
        createdAt: now,
        lastEngagedAt: now,
      });
      contactsCreated += 1;
    }

    // Seed KPI snapshot
    const dateStr = new Date().toISOString().slice(0, 10);
    const existingKpi = await ctx.db
      .query("dashboardKpis")
      .withIndex("by_business_and_date", (q) => 
        q.eq("businessId", args.businessId).eq("date", dateStr)
      )
      .unique();

    let kpisCreated = 0;
    if (!existingKpi) {
      await ctx.db.insert("dashboardKpis", {
        businessId: args.businessId,
        date: dateStr,
        visitors: 1240,
        subscribers: 560,
        engagement: 68,
        revenue: 4200,
        data: {
          visitorsDelta: 12,
          subscribersDelta: 8,
          engagementDelta: 3,
          revenueDelta: 15,
        },
        createdAt: now,
      });
      kpisCreated = 1;
    }

    return { tasksCreated, contactsCreated, kpisCreated };
  },
});
