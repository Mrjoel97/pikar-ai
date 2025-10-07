export const demoData = {
  solopreneur: {
    agents: [
      { id: "1", name: "Content Creator", status: "active", tasksCompleted: 45, efficiency: 92 },
      { id: "2", name: "Email Assistant", status: "active", tasksCompleted: 23, efficiency: 88 },
      { id: "3", name: "Social Media Manager", status: "paused", tasksCompleted: 12, efficiency: 85 }
    ],
    workflows: [
      { id: "1", name: "Newsletter Campaign", status: "running", completionRate: 95 },
      { id: "2", name: "Content Publishing", status: "running", completionRate: 87 },
      { id: "3", name: "Lead Follow-up", status: "paused", completionRate: 78 }
    ],
    kpis: {
      totalRevenue: 12500,
      activeCustomers: 45,
      conversionRate: 3.2,
      taskCompletion: 89
    },
    tasks: [
      { id: "1", title: "Review blog post draft", priority: "high", dueDate: "Today" },
      { id: "2", title: "Send weekly newsletter", priority: "medium", dueDate: "Tomorrow" },
      { id: "3", title: "Update social media", priority: "low", dueDate: "This week" }
    ],
    notifications: [
      { id: "1", message: "Newsletter campaign completed successfully", type: "success" },
      { id: "2", message: "New lead captured from website", type: "info" },
      { id: "3", message: "Content approval needed", type: "warning" }
    ],
    socialPosts: [
      {
        id: "sp1",
        content: "🚀 Just launched my new productivity guide! Check it out and let me know what you think. #productivity #solopreneur",
        platforms: ["twitter", "linkedin"],
        status: "posted",
        scheduledAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
        postedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
        aiGenerated: true,
        performanceMetrics: {
          impressions: 1250,
          engagements: 87,
          likes: 52,
          shares: 18,
          comments: 17,
          clicks: 35
        }
      },
      {
        id: "sp2",
        content: "💡 Quick tip: Batch your content creation to save 5+ hours per week. Here's how I do it...",
        platforms: ["twitter"],
        status: "posted",
        scheduledAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
        postedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
        aiGenerated: false,
        performanceMetrics: {
          impressions: 890,
          engagements: 64,
          likes: 41,
          shares: 12,
          comments: 11,
          clicks: 28
        }
      },
      {
        id: "sp3",
        content: "Working on something exciting for next week! Stay tuned 👀 #comingsoon",
        platforms: ["twitter", "linkedin"],
        status: "scheduled",
        scheduledAt: Date.now() + 2 * 24 * 60 * 60 * 1000,
        aiGenerated: true
      }
    ],
    scheduledPosts: [
      {
        id: "sched1",
        content: "📊 New case study: How I grew my email list by 300% in 3 months",
        platforms: ["linkedin"],
        scheduledAt: Date.now() + 1 * 24 * 60 * 60 * 1000,
        status: "scheduled"
      },
      {
        id: "sched2",
        content: "🎯 Monday motivation: Your biggest competitor is your own potential",
        platforms: ["twitter", "linkedin"],
        scheduledAt: Date.now() + 3 * 24 * 60 * 60 * 1000,
        status: "scheduled"
      }
    ],
    socialAnalytics: {
      totalPosts: 15,
      totalEngagement: 1247,
      avgEngagementRate: 4.2,
      totalReach: 18500,
      platformBreakdown: {
        twitter: { posts: 8, engagement: 542, reach: 9200 },
        linkedin: { posts: 7, engagement: 705, reach: 9300 }
      },
      topPost: {
        content: "🚀 Just launched my new productivity guide!",
        engagement: 87,
        platform: "linkedin"
      }
    },
    connectedAccounts: [
      { platform: "twitter", username: "@demo_user", connected: true, health: "active" },
      { platform: "linkedin", username: "Demo User", connected: true, health: "active" }
    ]
  },
  startup: {
    agents: [
      { id: "1", name: "Sales Assistant", status: "active", tasksCompleted: 156, efficiency: 94 },
      { id: "2", name: "Customer Support", status: "active", tasksCompleted: 89, efficiency: 91 },
      { id: "3", name: "Marketing Automation", status: "active", tasksCompleted: 67, efficiency: 88 },
      { id: "4", name: "HR Assistant", status: "paused", tasksCompleted: 34, efficiency: 82 }
    ],
    workflows: [
      { id: "1", name: "Lead Qualification", status: "running", completionRate: 92 },
      { id: "2", name: "Onboarding Process", status: "running", completionRate: 89 },
      { id: "3", name: "Customer Feedback Loop", status: "running", completionRate: 85 },
      { id: "4", name: "Team Standup Automation", status: "paused", completionRate: 76 }
    ],
    kpis: {
      totalRevenue: 125000,
      activeCustomers: 234,
      conversionRate: 4.8,
      taskCompletion: 91,
      teamProductivity: 87,
      customerSatisfaction: 4.6
    },
    tasks: [
      { id: "1", title: "Review Q1 growth metrics", priority: "high", dueDate: "Today" },
      { id: "2", title: "Approve marketing budget", priority: "high", dueDate: "Today" },
      { id: "3", title: "Team performance review", priority: "medium", dueDate: "This week" },
      { id: "4", title: "Product roadmap planning", priority: "medium", dueDate: "Next week" }
    ],
    notifications: [
      { id: "1", message: "Sales target exceeded by 15%", type: "success" },
      { id: "2", message: "New team member onboarded", type: "info" },
      { id: "3", message: "Customer churn rate increased", type: "warning" },
      { id: "4", message: "Budget approval required", type: "urgent" }
    ],
    socialPosts: [
      {
        id: "sp1",
        content: "🎉 Excited to announce our Series A funding! Thank you to our amazing team and investors. #startup #funding",
        platforms: ["twitter", "linkedin", "facebook"],
        status: "posted",
        scheduledAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
        postedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
        aiGenerated: false,
        approvalStatus: "approved",
        performanceMetrics: {
          impressions: 8500,
          engagements: 542,
          likes: 312,
          shares: 89,
          comments: 141,
          clicks: 267
        }
      },
      {
        id: "sp2",
        content: "📈 Our platform just hit 10,000 active users! Here's what we learned along the way...",
        platforms: ["linkedin"],
        status: "posted",
        scheduledAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
        postedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
        aiGenerated: true,
        approvalStatus: "approved",
        performanceMetrics: {
          impressions: 5200,
          engagements: 387,
          likes: 234,
          shares: 67,
          comments: 86,
          clicks: 189
        }
      },
      {
        id: "sp3",
        content: "🚀 Product update dropping next week! Get ready for some game-changing features.",
        platforms: ["twitter", "linkedin"],
        status: "scheduled",
        scheduledAt: Date.now() + 2 * 24 * 60 * 60 * 1000,
        aiGenerated: true,
        approvalStatus: "pending"
      }
    ],
    scheduledPosts: [
      {
        id: "sched1",
        content: "💼 We're hiring! Join our growing team. Check out open positions on our careers page.",
        platforms: ["linkedin", "twitter"],
        scheduledAt: Date.now() + 1 * 24 * 60 * 60 * 1000,
        status: "scheduled",
        approvalStatus: "approved"
      },
      {
        id: "sched2",
        content: "🎯 Customer success story: How @ClientName increased productivity by 40%",
        platforms: ["linkedin", "twitter", "facebook"],
        scheduledAt: Date.now() + 4 * 24 * 60 * 60 * 1000,
        status: "scheduled",
        approvalStatus: "pending"
      }
    ],
    socialAnalytics: {
      totalPosts: 47,
      totalEngagement: 8934,
      avgEngagementRate: 5.8,
      totalReach: 156000,
      platformBreakdown: {
        twitter: { posts: 18, engagement: 3245, reach: 58000 },
        linkedin: { posts: 21, engagement: 4512, reach: 72000 },
        facebook: { posts: 8, engagement: 1177, reach: 26000 }
      },
      topPost: {
        content: "🎉 Excited to announce our Series A funding!",
        engagement: 542,
        platform: "linkedin"
      }
    },
    connectedAccounts: [
      { platform: "twitter", username: "@startup_demo", connected: true, health: "active" },
      { platform: "linkedin", username: "Startup Demo Inc", connected: true, health: "active" },
      { platform: "facebook", username: "Startup Demo", connected: true, health: "active" }
    ]
  },
  sme: {
    agents: [
      { id: "1", name: "Compliance Monitor", status: "active", tasksCompleted: 234, efficiency: 96 },
      { id: "2", name: "Financial Analyst", status: "active", tasksCompleted: 189, efficiency: 93 },
      { id: "3", name: "Operations Manager", status: "active", tasksCompleted: 156, efficiency: 90 },
      { id: "4", name: "Quality Assurance", status: "active", tasksCompleted: 123, efficiency: 88 },
      { id: "5", name: "Risk Assessment", status: "paused", tasksCompleted: 67, efficiency: 85 }
    ],
    workflows: [
      { id: "1", name: "Regulatory Compliance", status: "running", completionRate: 98 },
      { id: "2", name: "Financial Reporting", status: "running", completionRate: 95 },
      { id: "3", name: "Department Coordination", status: "running", completionRate: 89 },
      { id: "4", name: "Audit Preparation", status: "running", completionRate: 87 },
      { id: "5", name: "Risk Management", status: "paused", completionRate: 82 }
  ],
    kpis: {
      totalRevenue: 2500000,
      activeCustomers: 1250,
      conversionRate: 6.2,
      taskCompletion: 94,
      complianceScore: 98,
      departmentEfficiency: 91,
      riskScore: 15
    },
    tasks: [
      { id: "1", title: "Quarterly compliance review", priority: "high", dueDate: "Today" },
      { id: "2", title: "Department budget allocation", priority: "high", dueDate: "Tomorrow" },
      { id: "3", title: "Risk assessment update", priority: "medium", dueDate: "This week" },
      { id: "4", title: "Audit documentation", priority: "medium", dueDate: "Next week" }
    ],
    notifications: [
      { id: "1", message: "Compliance audit passed successfully", type: "success" },
      { id: "2", message: "New regulatory requirement identified", type: "warning" },
      { id: "3", message: "Department performance review due", type: "info" },
      { id: "4", message: "Risk threshold exceeded in Operations", type: "urgent" }
    ],
    socialPosts: [
      {
        id: "sp1",
        content: "🏆 Proud to announce we've been recognized as Industry Leader of the Year! Thank you to our dedicated team and loyal customers.",
        platforms: ["linkedin", "twitter", "facebook"],
        status: "posted",
        scheduledAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
        postedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
        aiGenerated: false,
        approvalStatus: "approved",
        performanceMetrics: {
          impressions: 45000,
          engagements: 2847,
          likes: 1654,
          shares: 487,
          comments: 706,
          clicks: 1289
        }
      },
      {
        id: "sp2",
        content: "📊 Q3 Results: 25% YoY growth, expanded to 3 new markets, and launched 5 innovative products. Read our full report.",
        platforms: ["linkedin"],
        status: "posted",
        scheduledAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
        postedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
        aiGenerated: true,
        approvalStatus: "approved",
        performanceMetrics: {
          impressions: 28000,
          engagements: 1567,
          likes: 892,
          shares: 234,
          comments: 441,
          clicks: 876
        }
      },
      {
        id: "sp3",
        content: "🌍 Sustainability update: We've reduced our carbon footprint by 40% this year. Here's how we did it...",
        platforms: ["linkedin", "twitter", "facebook"],
        status: "scheduled",
        scheduledAt: Date.now() + 3 * 24 * 60 * 60 * 1000,
        aiGenerated: true,
        approvalStatus: "approved"
      }
    ],
    scheduledPosts: [
      {
        id: "sched1",
        content: "💼 Join our webinar: 'Future of Industry Innovation' - Register now!",
        platforms: ["linkedin", "twitter"],
        scheduledAt: Date.now() + 2 * 24 * 60 * 60 * 1000,
        status: "scheduled",
        approvalStatus: "approved"
      },
      {
        id: "sched2",
        content: "🎓 Employee spotlight: Meet Sarah, our Head of Innovation, and learn about her journey.",
        platforms: ["linkedin", "facebook"],
        scheduledAt: Date.now() + 5 * 24 * 60 * 60 * 1000,
        status: "scheduled",
        approvalStatus: "pending"
      }
    ],
    socialAnalytics: {
      totalPosts: 156,
      totalEngagement: 34567,
      avgEngagementRate: 6.4,
      totalReach: 542000,
      platformBreakdown: {
        twitter: { posts: 52, engagement: 11234, reach: 178000 },
        linkedin: { posts: 68, engagement: 18945, reach: 267000 },
        facebook: { posts: 36, engagement: 4388, reach: 97000 }
      },
      topPost: {
        content: "🏆 Proud to announce we've been recognized as Industry Leader",
        engagement: 2847,
        platform: "linkedin"
      }
    },
    connectedAccounts: [
      { platform: "twitter", username: "@sme_demo_corp", connected: true, health: "active" },
      { platform: "linkedin", username: "SME Demo Corporation", connected: true, health: "active" },
      { platform: "facebook", username: "SME Demo Corp", connected: true, health: "active" }
    ]
  },
  enterprise: {
    agents: [
      { id: "1", name: "Global Operations", status: "active", tasksCompleted: 567, efficiency: 97 },
      { id: "2", name: "Strategic Planning", status: "active", tasksCompleted: 445, efficiency: 95 },
      { id: "3", name: "Compliance Oversight", status: "active", tasksCompleted: 389, efficiency: 94 },
      { id: "4", name: "Performance Analytics", status: "active", tasksCompleted: 334, efficiency: 92 },
      { id: "5", name: "Risk Management", status: "active", tasksCompleted: 278, efficiency: 90 },
      { id: "6", name: "Innovation Hub", status: "paused", tasksCompleted: 156, efficiency: 87 }
    ],
    workflows: [
      { id: "1", name: "Global Coordination", status: "running", completionRate: 99 },
      { id: "2", name: "Strategic Initiatives", status: "running", completionRate: 96 },
      { id: "3", name: "Enterprise Compliance", status: "running", completionRate: 94 },
      { id: "4", name: "Performance Monitoring", status: "running", completionRate: 92 },
      { id: "5", name: "Innovation Pipeline", status: "running", completionRate: 88 },
      { id: "6", name: "Crisis Management", status: "standby", completionRate: 100 }
    ],
    kpis: {
      totalRevenue: 50000000,
      activeCustomers: 15000,
      conversionRate: 8.5,
      taskCompletion: 96,
      globalEfficiency: 94,
      complianceScore: 99,
      innovationIndex: 87,
      riskScore: 8
    },
    tasks: [
      { id: "1", title: "Global strategy review", priority: "high", dueDate: "Today" },
      { id: "2", title: "Board presentation prep", priority: "high", dueDate: "Tomorrow" },
      { id: "3", title: "Innovation portfolio assessment", priority: "medium", dueDate: "This week" },
      { id: "4", title: "Compliance framework update", priority: "medium", dueDate: "Next week" }
    ],
    notifications: [
      { id: "1", message: "Global revenue target exceeded", type: "success" },
      { id: "2", message: "New market opportunity identified", type: "info" },
      { id: "3", message: "Regulatory change requires attention", type: "warning" },
      { id: "4", message: "Strategic initiative approval needed", type: "urgent" }
    ],
    socialPosts: [
      {
        id: "sp1",
        content: "🌐 Global expansion update: We're now operating in 50+ countries, serving millions of customers worldwide. Thank you for your trust!",
        platforms: ["linkedin", "twitter", "facebook"],
        status: "posted",
        scheduledAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
        postedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
        aiGenerated: false,
        approvalStatus: "approved",
        performanceMetrics: {
          impressions: 250000,
          engagements: 18945,
          likes: 11234,
          shares: 3456,
          comments: 4255,
          clicks: 8934
        }
      },
      {
        id: "sp2",
        content: "💡 Innovation spotlight: Our AI-powered platform is transforming how enterprises operate. Read the latest case studies.",
        platforms: ["linkedin", "twitter"],
        status: "posted",
        scheduledAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
        postedAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
        aiGenerated: true,
        approvalStatus: "approved",
        performanceMetrics: {
          impressions: 178000,
          engagements: 12456,
          likes: 7234,
          shares: 2145,
          comments: 3077,
          clicks: 6789
        }
      },
      {
        id: "sp3",
        content: "🏅 Fortune 500 recognition: Named one of the Most Innovative Companies of 2024. Full story coming soon.",
        platforms: ["linkedin", "twitter", "facebook"],
        status: "scheduled",
        scheduledAt: Date.now() + 1 * 24 * 60 * 60 * 1000,
        aiGenerated: false,
        approvalStatus: "approved"
      }
    ],
    scheduledPosts: [
      {
        id: "sched1",
        content: "📈 Annual Report 2024: Record growth, strategic acquisitions, and bold vision for the future. Download now.",
        platforms: ["linkedin", "twitter", "facebook"],
        scheduledAt: Date.now() + 2 * 24 * 60 * 60 * 1000,
        status: "scheduled",
        approvalStatus: "approved"
      },
      {
        id: "sched2",
        content: "🌱 ESG Report: Our commitment to sustainability, diversity, and corporate responsibility. Read more.",
        platforms: ["linkedin"],
        scheduledAt: Date.now() + 4 * 24 * 60 * 60 * 1000,
        status: "scheduled",
        approvalStatus: "approved"
      },
      {
        id: "sched3",
        content: "🎯 Q4 Product Launch: Revolutionary features that will redefine the industry. Stay tuned!",
        platforms: ["twitter", "linkedin", "facebook"],
        scheduledAt: Date.now() + 6 * 24 * 60 * 60 * 1000,
        status: "scheduled",
        approvalStatus: "pending"
      }
    ],
    socialAnalytics: {
      totalPosts: 487,
      totalEngagement: 156789,
      avgEngagementRate: 7.8,
      totalReach: 2340000,
      platformBreakdown: {
        twitter: { posts: 178, engagement: 54234, reach: 856000 },
        linkedin: { posts: 203, engagement: 87456, reach: 1124000 },
        facebook: { posts: 106, engagement: 15099, reach: 360000 }
      },
      topPost: {
        content: "🌐 Global expansion update: We're now operating in 50+ countries",
        engagement: 18945,
        platform: "linkedin"
      }
    },
    connectedAccounts: [
      { platform: "twitter", username: "@enterprise_global", connected: true, health: "active" },
      { platform: "linkedin", username: "Enterprise Global Corp", connected: true, health: "active" },
      { platform: "facebook", username: "Enterprise Global", connected: true, health: "active" }
    ]
  }
};

export function getDemoData(tier: "solopreneur" | "startup" | "sme" | "enterprise") {
  return demoData[tier] || demoData.solopreneur;
}
