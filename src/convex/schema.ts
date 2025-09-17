import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const { users: _authUsers, ...authWithoutUsers } = authTables;

export default defineSchema({
  users: defineTable({
    // Make legacy fields compatible and optional
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // Accept legacy/seeded fields
    companyName: v.optional(v.string()),
    industry: v.optional(v.string()),
    businessTier: v.optional(v.string()),
    onboardingCompleted: v.optional(v.boolean()),
    // Add optional businessId to satisfy consumers that reference it
    businessId: v.optional(v.id("businesses")),
  }).index("by_email", ["email"]),

  businesses: defineTable({
    name: v.string(),
    industry: v.string(),
    size: v.optional(v.string()),
    ownerId: v.id("users"),
    teamMembers: v.array(v.id("users")),
    description: v.optional(v.string()),
    website: v.optional(v.string()),
    location: v.optional(v.string()),
    foundedYear: v.optional(v.number()),
    revenue: v.optional(v.string()),
    goals: v.optional(v.array(v.string())),
    challenges: v.optional(v.array(v.string())),
    currentSolutions: v.optional(v.array(v.string())),
    targetMarket: v.optional(v.string()),
    businessModel: v.optional(v.string()),
    // Allow legacy/seeded fields
    tier: v.optional(v.string()),
    settings: v.optional(
      v.object({
        aiAgentsEnabled: v.array(v.string()),
        complianceLevel: v.string(),
        dataIntegrations: v.array(v.string()),
      })
    ),
  })
    .index("by_owner", ["ownerId"])
    // Keep a single team member index
    .index("by_team_member", ["teamMembers"]),

  initiatives: defineTable({
    businessId: v.id("businesses"),
    // Make previously required fields optional to support legacy data
    name: v.optional(v.string()),
    industry: v.optional(v.string()),
    businessModel: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("paused"), v.literal("completed")),
    currentPhase: v.optional(v.number()),
    ownerId: v.optional(v.id("users")),
    onboardingProfile: v.optional(
      v.object({
        industry: v.string(),
        businessModel: v.string(),
        goals: v.array(v.string()),
      })
    ),
    featureFlags: v.optional(v.array(v.string())),
    updatedAt: v.optional(v.number()),

    // Allow legacy/seeded fields present in existing data
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    timeline: v.optional(v.any()),
    metrics: v.optional(v.any()),
    priority: v.optional(v.string()),
    aiAgents: v.optional(v.array(v.any())),
  })
    .index("by_business", ["businessId"])
    .index("by_owner", ["ownerId"])
    .index("by_business_and_phase", ["businessId", "currentPhase"]),

  diagnostics: defineTable({
    businessId: v.id("businesses"),
    createdBy: v.optional(v.id("users")),
    phase: v.union(v.literal("discovery"), v.literal("planning")),
    inputs: v.object({
      goals: v.array(v.string()),
      signals: v.record(v.string(), v.any()),
    }),
    outputs: v.object({
      tasks: v.array(v.object({
        title: v.string(),
        frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
        description: v.string(),
      })),
      workflows: v.array(v.object({
        name: v.string(),
        agentType: v.union(
          v.literal("content_creation"),
          v.literal("sales_intelligence"),
          v.literal("customer_support"),
          v.literal("marketing_automation"),
          v.literal("operations"),
          v.literal("analytics")
        ),
        templateId: v.string(),
      })),
      kpis: v.object({
        targetROI: v.number(),
        targetCompletionRate: v.number(),
      }),
    }),
    runAt: v.number(),
  }).index("by_business", ["businessId"]),

  aiAgents: defineTable({
    name: v.string(),
    type: v.string(),
    businessId: v.id("businesses"),
    description: v.optional(v.string()),
    config: v.optional(
      v.object({
        model: v.string(),
        temperature: v.number(),
        maxTokens: v.number(),
        systemPrompt: v.string(),
        tools: v.array(v.string()),
      })
    ),
    configuration: v.optional(
      v.object({
        model: v.string(),
        parameters: v.object({
          temperature: v.number(),
        }),
        triggers: v.array(v.string()),
      })
    ),
    capabilities: v.optional(v.array(v.string())),
    channels: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
    mmrPolicy: v.optional(v.string()),
    playbooks: v.optional(v.array(v.string())),
    performance: v.optional(
      v.object({
        lastActive: v.optional(v.number()),
        successRate: v.number(),
        tasksCompleted: v.number(),
      })
    ),
    status: v.optional(
      v.union(v.literal("active"), v.literal("inactive"), v.literal("training"))
    ),
    createdBy: v.optional(v.id("users")),
    metrics: v.optional(
      v.object({
        totalRuns: v.number(),
        successRate: v.number(),
        avgResponseTime: v.number(),
        lastRun: v.optional(v.number()),
      })
    ),
  })
    .index("by_business", ["businessId"])
    .index("by_type", ["type"])
    .index("by_status", ["status"]),
    // Removed duplicate:
    // .index("by_businessId", ["businessId"]),

  workflows: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    businessId: v.id("businesses"),
    // Structured fields (optional for backward compatibility)
    region: v.optional(v.string()),
    unit: v.optional(v.string()),
    channel: v.optional(v.union(
      v.literal("email"),
      v.literal("social"),
      v.literal("paid"),
      v.literal("referral")
    )),
    trigger: v.object({
      type: v.union(v.literal("manual"), v.literal("schedule"), v.literal("webhook")),
      cron: v.optional(v.string()),
      eventKey: v.optional(v.string()),
    }),
    approval: v.object({
      required: v.boolean(),
      threshold: v.number(),
    }),
    pipeline: v.array(v.any()),
    template: v.boolean(),
    tags: v.array(v.string()),
    createdBy: v.optional(v.id("users")),
    status: v.union(v.literal("draft"), v.literal("active"), v.literal("paused")),
    metrics: v.optional(
      v.object({
        totalRuns: v.number(),
        successRate: v.number(),
        avgExecutionTime: v.number(),
        lastRun: v.optional(v.number()),
      })
    ),
    // Add: governance health summary for SME/Enterprise enforcement visibility
    governanceHealth: v.optional(
      v.object({
        score: v.number(),
        issues: v.array(v.string()),
        updatedAt: v.optional(v.number()),
      })
    ),
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"])
    .index("by_business_and_template", ["businessId", "template"])
    .index("by_business_region", ["businessId", "region"])
    .index("by_business_unit", ["businessId", "unit"])
    .index("by_business_channel", ["businessId", "channel"]),
    // Removed duplicate:
    // .index("by_businessId", ["businessId"]),

  workflowExecutions: defineTable({
    workflowId: v.id("workflows"),
    // Denormalized fields for efficient analytics and filtering
    businessId: v.optional(v.id("businesses")),
    region: v.optional(v.string()),
    unit: v.optional(v.string()),
    channel: v.optional(v.union(
      v.literal("email"),
      v.literal("social"),
      v.literal("paid"),
      v.literal("referral")
    )),
    status: v.union(v.literal("succeeded"), v.literal("failed"), v.literal("running")),
    mode: v.union(v.literal("manual"), v.literal("schedule"), v.literal("webhook")),
    summary: v.string(),
    metrics: v.object({
      roi: v.number(),
    }),
  })
    .index("by_workflow", ["workflowId"])
    .index("by_business", ["businessId"])
    .index("by_business_region", ["businessId", "region"])
    .index("by_business_unit", ["businessId", "unit"])
    .index("by_business_channel", ["businessId", "channel"]),

  // Added: Table for workflow execution runs used by activity, telemetry, entitlements, etc.
  workflowRuns: defineTable({
    workflowId: v.id("workflows"),
    businessId: v.id("businesses"),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("succeeded"),
      v.literal("failed")
    ),
    // execution mode (optional)
    mode: v.optional(v.union(v.literal("auto"), v.literal("manual"))),
    errorMessage: v.optional(v.string()),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_workflow", ["workflowId"]),

  // Added: Table for workflow templates (used by template pinning and seeding)
  workflowTemplates: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    tier: v.optional(v.string()),
    category: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    // Add optional fields to match existing seeded documents
    industryTags: v.optional(v.array(v.string())),
    recommendedAgents: v.optional(v.array(v.string())),
    // Accept legacy 'tags' on existing documents
    tags: v.optional(v.array(v.string())),
    steps: v.optional(
      v.array(
        v.object({
          title: v.string(),
          type: v.string(),
          agentType: v.optional(v.string()),
          config: v.optional(v.any()),
        })
      )
    ),
  }).index("by_name", ["name"]),

  // Feature Flag System
  featureFlags: defineTable({
    businessId: v.optional(v.id("businesses")),
    flagName: v.string(),
    isEnabled: v.boolean(),
    rolloutPercentage: v.number(),
    conditions: v.optional(v.object({
      userTier: v.optional(v.array(v.string())),
      businessTier: v.optional(v.array(v.string())),
    })),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_flag_name", ["flagName"])
    .index("by_business", ["businessId"])
    .index("by_business_and_flag", ["businessId", "flagName"]),

  // Workflow Assignment Extensions
  workflowSteps: defineTable({
    workflowId: v.id("workflows"),
    businessId: v.id("businesses"),
    stepNumber: v.number(),
    name: v.string(),
    description: v.optional(v.string()),
    type: v.string(),
    config: v.any(),
    // New assignment fields
    assigneeId: v.optional(v.id("users")),
    dueDate: v.optional(v.number()),
    assignedAt: v.optional(v.number()),
    assignedBy: v.optional(v.id("users")),
    status: v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed"), v.literal("blocked")),
    completedAt: v.optional(v.number()),
    completedBy: v.optional(v.id("users")),
  })
    .index("by_workflow", ["workflowId"])
    .index("by_business", ["businessId"])
    .index("by_assignee", ["assigneeId"])
    .index("by_due_date", ["dueDate"])
    .index("by_status", ["status"]),

  // Approval Queue System
  approvalQueue: defineTable({
    businessId: v.id("businesses"),
    workflowId: v.id("workflows"),
    workflowRunId: v.id("workflowRuns"),
    stepIndex: v.number(),
    assigneeId: v.optional(v.id("users")),
    assigneeRole: v.optional(v.string()),
    title: v.string(),
    description: v.string(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    slaDeadline: v.optional(v.number()),
    createdBy: v.string(),
    reviewedBy: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
    comments: v.optional(v.string()),
  })
    .index("by_business", ["businessId"])
    .index("by_assignee", ["assigneeId"])
    .index("by_workflow", ["workflowId"])
    .index("by_sla_deadline", ["slaDeadline"]),

  // Notification System
  notifications: defineTable({
    businessId: v.id("businesses"),
    userId: v.id("users"),
    type: v.union(
      v.literal("assignment"),
      v.literal("approval"),
      v.literal("sla_warning"),
      v.literal("integration_error"),
      v.literal("workflow_completion"),
      v.literal("system_alert"),
      v.literal("sla_overdue")
    ),
    title: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
    isRead: v.boolean(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    createdAt: v.number(),
    readAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    // Add: snooze support
    snoozeUntil: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_business", ["businessId"])
    .index("by_user_and_read", ["userId", "isRead"])
    .index("by_created_at", ["createdAt"])
    .index("by_expires_at", ["expiresAt"])
    // Add: index for snooze queries
    .index("by_snooze_until", ["snoozeUntil"]),

  // Notification Preferences
  notificationPreferences: defineTable({
    userId: v.id("users"),
    businessId: v.id("businesses"),
    emailEnabled: v.boolean(),
    pushEnabled: v.boolean(),
    smsEnabled: v.boolean(),
    preferences: v.object({
      assignments: v.boolean(),
      approvals: v.boolean(),
      slaWarnings: v.boolean(),
      integrationErrors: v.boolean(),
      // Accept legacy misspelling from historical documents to prevent schema validation failures
      workflowColpmetions: v.optional(v.boolean()),
      workflowCompletions: v.boolean(),
      systemAlerts: v.boolean(),
    }),
    rateLimits: v.object({
      maxPerHour: v.number(),
      maxPerDay: v.number(),
    }),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_business", ["businessId"])
    // Composite index to enable efficient user+business lookups
    .index("by_user_and_business", ["userId", "businessId"]),

  // Telemetry Events
  telemetryEvents: defineTable({
    businessId: v.id("businesses"),
    userId: v.optional(v.id("users")),
    eventName: v.string(),
    eventData: v.any(),
    timestamp: v.number(),
    sessionId: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    source: v.optional(v.string()),
  })
    .index("by_business", ["businessId"])
    .index("by_user", ["userId"])
    .index("by_event_name", ["eventName"])
    .index("by_timestamp", ["timestamp"])
    .index("by_business_and_event", ["businessId", "eventName"]),

  // Marketing Suite Tables
  emailCampaigns: defineTable({
    businessId: v.id("businesses"),
    createdBy: v.id("users"),
    subject: v.string(),
    from: v.string(),
    previewText: v.optional(v.string()),
    blocks: v.array(
      v.object({
        type: v.union(
          v.literal("text"),
          v.literal("button"),
          v.literal("footer")
        ),
        content: v.optional(v.string()), // for text
        label: v.optional(v.string()), // for button
        url: v.optional(v.string()), // for button
        includeUnsubscribe: v.optional(v.boolean()), // footer flag
      })
    ),
    recipients: v.optional(v.array(v.string())), // raw emails, comma-separated parsed
    timezone: v.string(),
    scheduledAt: v.number(), // UTC timestamp (ms)
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("sending"),
      v.literal("sent"),
      v.literal("failed"),
      v.literal("canceled")
    ),
    sendIds: v.optional(v.array(v.string())),
    lastError: v.optional(v.string()),

    // Add: audience targeting
    audienceType: v.optional(v.union(v.literal("direct"), v.literal("list"))),
    audienceListId: v.optional(v.id("contactLists")),
  })
  .index("by_business_and_status", ["businessId", "status"])
  .index("by_audience_type", ["audienceType"])
  .index("by_audience_list_id", ["audienceListId"]),

  emailUnsubscribes: defineTable({
    businessId: v.id("businesses"),
    email: v.string(),
    token: v.string(),
    active: v.boolean(), // true means unsubscribed
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_business_and_email", ["businessId", "email"]),

  seoSuggestions: defineTable({
    businessId: v.id("businesses"),
    contentId: v.string(),
    contentType: v.string(),
    suggestions: v.object({
      title: v.array(v.string()),
      meta: v.array(v.string()),
      h1: v.array(v.string()),
      readability: v.object({
        score: v.number(),
        suggestions: v.array(v.string()),
      }),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
    clickedSuggestions: v.optional(v.array(v.string())),
  })
    .index("by_business", ["businessId"])
    .index("by_content_id", ["contentId"])
    .index("by_business_and_content", ["businessId", "contentId"]),

  // Analytics Platform Tables
  dashboards: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    layout: v.array(v.object({
      cardType: v.string(),
      config: v.any(),
      position: v.object({ 
        x: v.number(), 
        y: v.number(),
        width: v.number(),
        height: v.number(),
      }),
    })),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    isPublic: v.boolean(),
    sharedWith: v.optional(v.array(v.id("users"))),
  })
    .index("by_business", ["businessId"])
    .index("by_created_by", ["createdBy"])
    .index("by_public", ["isPublic"]),

  exportJobs: defineTable({
    businessId: v.id("businesses"),
    type: v.union(v.literal("csv"), v.literal("pdf")),
    config: v.any(),
    status: v.union(v.literal("queued"), v.literal("processing"), v.literal("completed"), v.literal("failed")),
    createdBy: v.id("users"),
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    downloadUrl: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"])
    .index("by_created_by", ["createdBy"])
    .index("by_created_at", ["createdAt"]),

  scheduledReports: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    dashboardId: v.id("dashboards"),
    schedule: v.string(), // cron expression
    recipients: v.array(v.string()),
    format: v.union(v.literal("pdf"), v.literal("csv")),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastRun: v.optional(v.number()),
    nextRun: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_dashboard", ["dashboardId"])
    .index("by_next_run", ["nextRun"])
    .index("by_active", ["isActive"]),

  // Compliance QMS Tables
  capaItems: defineTable({
    businessId: v.id("businesses"),
    incidentId: v.optional(v.string()),
    nonconformityId: v.optional(v.string()),
    title: v.string(),
    description: v.string(),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    status: v.union(v.literal("open"), v.literal("in_progress"), v.literal("verification"), v.literal("closed")),
    assigneeId: v.id("users"),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    slaDeadline: v.number(),
    verificationRequired: v.boolean(),
    verifiedBy: v.optional(v.id("users")),
    verifiedAt: v.optional(v.number()),
    closedAt: v.optional(v.number()),
    rootCause: v.optional(v.string()),
    correctiveAction: v.optional(v.string()),
    preventiveAction: v.optional(v.string()),
  })
    .index("by_business", ["businessId"])
    .index("by_assignee", ["assigneeId"])
    .index("by_status", ["status"])
    .index("by_severity", ["severity"])
    .index("by_sla_deadline", ["slaDeadline"]),

  riskRegister: defineTable({
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    probability: v.number(), // 1-5 scale
    impact: v.number(), // 1-5 scale
    riskScore: v.number(), // calculated
    mitigation: v.string(),
    ownerId: v.id("users"),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    status: v.union(v.literal("identified"), v.literal("assessed"), v.literal("mitigated"), v.literal("closed")),
    reviewDate: v.optional(v.number()),
    mitigationDeadline: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_owner", ["ownerId"])
    .index("by_status", ["status"])
    .index("by_risk_score", ["riskScore"])
    .index("by_review_date", ["reviewDate"]),

  // Governance/Compliance: Incidents
  incidents: defineTable({
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.string(),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    status: v.union(v.literal("open"), v.literal("investigating"), v.literal("resolved"), v.literal("closed")),
    ownerId: v.id("users"),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    slaDeadline: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_owner", ["ownerId"])
    .index("by_status", ["status"])
    .index("by_severity", ["severity"])
    .index("by_sla_deadline", ["slaDeadline"]),

  // Governance/Compliance: Nonconformities
  nonconformities: defineTable({
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.string(),
    category: v.optional(v.string()),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    status: v.union(v.literal("open"), v.literal("in_progress"), v.literal("verification"), v.literal("closed")),
    assigneeId: v.id("users"),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    correctiveAction: v.optional(v.string()),
    preventiveAction: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    closedAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_assignee", ["assigneeId"])
    .index("by_status", ["status"])
    .index("by_severity", ["severity"])
    .index("by_due_date", ["dueDate"]),

  // Governance/Compliance: Risks (parallel to existing riskRegister; used by upstream)
  risks: defineTable({
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    probability: v.number(),
    impact: v.number(),
    riskScore: v.number(),
    mitigation: v.string(),
    ownerId: v.id("users"),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    status: v.union(v.literal("identified"), v.literal("assessed"), v.literal("mitigated"), v.literal("closed")),
    reviewDate: v.optional(v.number()),
    mitigationDeadline: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_owner", ["ownerId"])
    .index("by_status", ["status"])
    .index("by_risk_score", ["riskScore"])
    .index("by_review_date", ["reviewDate"]),

  // Governance/Compliance: SOPs
  sops: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    version: v.string(),
    content: v.any(),
    status: v.union(v.literal("draft"), v.literal("active"), v.literal("deprecated")),
    tags: v.optional(v.array(v.string())),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"])
    .index("by_name", ["name"]),

  // Governance/Compliance: Compliance Checks
  compliance_checks: defineTable({
    businessId: v.id("businesses"),
    sopId: v.optional(v.id("sops")),
    name: v.string(),
    description: v.string(),
    status: v.union(v.literal("pending"), v.literal("passed"), v.literal("failed")),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    createdBy: v.id("users"),
    createdAt: v.number(),
    checkedAt: v.optional(v.number()),
    checkedBy: v.optional(v.id("users")),
    findings: v.optional(v.any()),
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"])
    .index("by_sop", ["sopId"]),

  // Governance/Compliance: Audit Logs
  audit_logs: defineTable({
    businessId: v.id("businesses"),
    userId: v.optional(v.id("users")),
    action: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    details: v.optional(v.any()),
    createdAt: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  })
    .index("by_business", ["businessId"])
    .index("by_entity", ["entityType"])
    .index("by_user", ["userId"])
    .index("by_created_at", ["createdAt"]),

  // Tasks table (added)
  tasks: defineTable({
    businessId: v.id("businesses"),
    initiativeId: v.optional(v.id("initiatives")),
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    urgent: v.boolean(),
    status: v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("blocked"),
      v.literal("done")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    dueDate: v.optional(v.number()),
  })
    .index("by_business", ["businessId"]),

  // Add KPIs for Dashboard snapshots (per-business, per-day)
  dashboardKpis: defineTable({
    businessId: v.id("businesses"),
    date: v.string(), // YYYY-MM-DD
    visitors: v.number(),
    subscribers: v.number(),
    engagement: v.number(), // percentage 0-100
    revenue: v.number(),
    visitorsDelta: v.optional(v.number()),
    subscribersDelta: v.optional(v.number()),
    engagementDelta: v.optional(v.number()),
    revenueDelta: v.optional(v.number()),
  })
    .index("by_business_and_date", ["businessId", "date"])
    .index("by_date", ["date"]),

  contacts: defineTable({
    businessId: v.id("businesses"),
    listId: v.optional(v.id("contactLists")),
    email: v.string(),
    name: v.optional(v.string()), // was required; make optional to match upsert usage
    tags: v.array(v.string()),
    status: v.union(
      v.literal("subscribed"),
      v.literal("unsubscribed"),
      v.literal("bounced"),
      v.literal("complained") // include complained to match backend usage
    ),
    source: v.string(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    lastEngagedAt: v.optional(v.number()),
    unsubscribeToken: v.optional(v.string()),
  })
    .index("by_business", ["businessId"])
    .index("by_business_and_email", ["businessId", "email"])
    .index("by_list", ["listId"])
    .index("by_created_by", ["createdBy"]),

  contactLists: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    tags: v.array(v.string()),
  })
    .index("by_business", ["businessId"])
    .index("by_business_and_name", ["businessId", "name"])
    .index("by_created_by", ["createdBy"]),

  contactListMembers: defineTable({
    businessId: v.id("businesses"),
    listId: v.id("contactLists"),
    contactId: v.id("contacts"),
    addedAt: v.number(),
    addedBy: v.id("users"),
  })
    .index("by_list", ["listId"])
    .index("by_contact", ["contactId"])
    .index("by_business_and_list", ["businessId", "listId"])
    .index("by_business_and_contact", ["businessId", "contactId"]),

  emails: defineTable({
    businessId: v.id("businesses"),
    campaignId: v.optional(v.id("emailCampaigns")),
    type: v.union(v.literal("campaign"), v.literal("transactional"), v.literal("test")),
    subject: v.string(),
    fromEmail: v.string(),
    fromName: v.optional(v.string()),
    replyTo: v.optional(v.string()),
    previewText: v.optional(v.string()),
    htmlContent: v.optional(v.string()),
    body: v.optional(v.string()),
    textContent: v.optional(v.string()),
    recipients: v.optional(v.array(v.string())), // make optional to support "list" campaigns
    audienceType: v.optional(v.union(v.literal("direct"), v.literal("list"))),
    audienceListId: v.optional(v.id("contactLists")),
    scheduledAt: v.optional(v.number()),
    sentAt: v.optional(v.number()),
    status: v.union(
      v.literal("draft"),
      v.literal("queued"),
      v.literal("scheduled"),
      v.literal("sending"),
      v.literal("sent"),
      v.literal("failed")
    ),
    lastError: v.optional(v.string()),
    sendIds: v.optional(v.array(v.string())),
    createdBy: v.optional(v.id("users")), // make optional to match current inserts
    createdAt: v.optional(v.number()), // make optional to match current inserts

    // Add: buttons used by campaign sends (optional)
    buttons: v.optional(
      v.array(
        v.object({
          text: v.string(),
          url: v.string(),
        })
      )
    ),
  })
    .index("by_business", ["businessId"])
    .index("by_campaign", ["campaignId"])
    .index("by_status", ["status"])
    .index("by_created_by", ["createdBy"]),

  // Agent Profiles for User-Trained Custom AI Agent (Solopreneur S1)
  agentProfiles: defineTable({
    userId: v.id("users"),
    businessId: v.id("businesses"),
    businessSummary: v.optional(v.string()),
    industry: v.optional(v.string()),
    brandVoice: v.optional(v.string()),
    timezone: v.optional(v.string()),
    preferences: v.optional(
      v.object({
        automations: v.object({
          invoicing: v.optional(v.boolean()),
          emailDrafts: v.optional(v.boolean()),
          socialPosts: v.optional(v.boolean()),
        }),
      })
    ),
    docRefs: v.optional(v.array(v.id("_storage"))),
    trainingNotes: v.optional(v.string()),
    onboardingScore: v.optional(v.number()),
    lastUpdated: v.optional(v.number()),
    // Add Agent Profile v2 fields
    tone: v.optional(v.union(v.literal("concise"), v.literal("friendly"), v.literal("premium"))),
    persona: v.optional(v.union(v.literal("maker"), v.literal("coach"), v.literal("executive"))),
    cadence: v.optional(v.union(v.literal("light"), v.literal("standard"), v.literal("aggressive"))),
  })
    .index("by_business", ["businessId"])
    .index("by_user", ["userId"])
    .index("by_user_and_business", ["userId", "businessId"]),

  // Upload metadata (references Convex storage system table via fileId)
  uploads: defineTable({
    userId: v.id("users"),
    businessId: v.id("businesses"),
    filename: v.string(),
    mimeType: v.string(),
    fileId: v.id("_storage"),
    uploadedAt: v.number(),
    vectorIndexId: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_business", ["businessId"]),

  // Key metrics for micro-analytics (90d revenue snapshot, etc.)
  key_metrics: defineTable({
    userId: v.optional(v.id("users")),
    businessId: v.optional(v.id("businesses")),
    metricKey: v.string(),
    value: v.number(),
    windowStart: v.number(), // ms
    windowEnd: v.number(),   // ms
    createdAt: v.number(),
  })
    .index("by_user_and_metricKey", ["userId", "metricKey"])
    .index("by_business_and_metricKey", ["businessId", "metricKey"]),

  // Brain dumps for initiatives (free-form idea capture)
  brainDumps: defineTable({
    businessId: v.id("businesses"),
    initiativeId: v.id("initiatives"),
    userId: v.id("users"),
    content: v.string(),
    createdAt: v.optional(v.number()),
    // Add optional compatibility fields referenced by inserts
    updatedAt: v.optional(v.number()),
    title: v.optional(v.string()),
    voice: v.optional(v.boolean()),
    transcript: v.optional(v.string()),
    summary: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    // Add: audio reference + soft delete fields
    audioFileId: v.optional(v.id("_storage")),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
  })
    .index("by_business", ["businessId"])
    .index("by_initiative", ["initiativeId"])
    .index("by_user", ["userId"])
    .index("by_voice", ["voice"])
    .index("by_transcript", ["transcript"])
    .index("by_summary", ["summary"])
    .index("by_tags", ["tags"]),

  // Add new table: templatePins for backend-persisted template pinning
  templatePins: defineTable({
    userId: v.id("users"),
    templateId: v.id("workflowTemplates"),
    pinnedAt: v.number(),
  })
    .index("by_user", ["userId", "pinnedAt"])
    .index("by_user_and_template", ["userId", "templateId"]),

  // Add new table: scheduleSlots for persisted schedule assistant slots
  scheduleSlots: defineTable({
    userId: v.id("users"),
    businessId: v.optional(v.id("businesses")),
    label: v.string(),
    channel: v.union(v.literal("email"), v.literal("post"), v.literal("other")),
    scheduledAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_user_and_time", ["userId", "scheduledAt"]),

  /**
   * Per-business email configuration (tenant-level).
   * Stores workspace-scoped Resend key, inbox, and base URL overrides.
   */
  emailConfigs: defineTable({
    businessId: v.id("businesses"),
    resendApiKey: v.optional(v.string()),
    salesInbox: v.optional(v.string()),
    publicBaseUrl: v.optional(v.string()),
    fromEmail: v.optional(v.string()),
    fromName: v.optional(v.string()),
    replyTo: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_business", ["businessId"]),

  admins: defineTable({
    email: v.string(),
    role: v.union(v.literal("superadmin"), v.literal("admin")),
    createdAt: v.number(),
  })
    .index("by_email", ["email"]),

  // Append Convex Auth required tables inside the schema (excluding users to avoid conflicts)
  ...authWithoutUsers,
});