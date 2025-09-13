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
    ]
  }
};
