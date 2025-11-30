import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const { users: _authUsers, ...authWithoutUsers } = authTables;

const evalTestValidator = v.object({
  tool: v.string(), // e.g., "health" | "flags" | "alerts"
  input: v.optional(v.string()), // optional input string
  expectedContains: v.optional(v.string()), // simple expectation check
});

const schema = defineSchema({
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
    // Add tokenIdentifier for auth
    tokenIdentifier: v.optional(v.string()),
  }).index("email", ["email"])
    .index("by_token", ["tokenIdentifier"]),

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
        // Add Stripe-related plan fields (all optional to preserve backward compatibility)
        plan: v.optional(v.string()),
        status: v.optional(v.string()),
        stripeCustomerId: v.optional(v.string()),
        stripeSubscriptionId: v.optional(v.string()),
        // Add trial tracking fields
        trialStart: v.optional(v.number()),
        trialEnd: v.optional(v.number()),
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
    metadata: v.optional(v.any()),
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
    // A/B testing fields
    experimentId: v.optional(v.id("experiments")),
    variantId: v.optional(v.id("experimentVariants")),
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
        hourlyRate: v.optional(v.number()),
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
    role: v.union(
      v.literal("superadmin"),
      v.literal("senior"),
      v.literal("pending_senior"),
      v.literal("admin"),
    ),
    createdAt: v.number(),
  })
    .index("by_email", ["email"]),

  // Independent admin authentication tables
  adminAuths: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    createdAt: v.number(),
  })
    .index("by_email", ["email"]),

  adminSessions: defineTable({
    token: v.string(),
    email: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_email", ["email"]),

  // New table: API keys for tenants
  api_keys: defineTable({
    tenantId: v.id("businesses"),
    keyHash: v.string(),
    name: v.string(),
    scopes: v.array(v.string()),
    createdAt: v.number(),
    revokedAt: v.optional(v.number()),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_and_name", ["tenantId", "name"]),

  // Add: Docs module tables for Phase 6 (docs population)
  docsPages: defineTable({
    title: v.string(),
    slug: v.string(),
    contentMarkdown: v.string(),
    sections: v.optional(v.array(v.object({ heading: v.string(), body: v.string() }))),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index("by_slug", ["slug"]),

  docsProposals: defineTable({
    source: v.string(), // e.g., "seed:readme", "url:https://...", "manual"
    title: v.string(),
    slug: v.string(),
    diffPreview: v.string(), // PR-style diff preview (text)
    contentMarkdown: v.string(),
    sections: v.optional(v.array(v.object({ heading: v.string(), body: v.string() }))),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    decidedAt: v.optional(v.number()),
  }).index("by_status", ["status"]),

  // Add password auth tables
  userCredentials: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    passwordResetToken: v.optional(v.string()),
    passwordResetExpires: v.optional(v.number()),
  }).index("by_email", ["email"]),

  userLoginTokens: defineTable({
    token: v.string(),
    email: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_email", ["email"]),

  // Append Convex Auth required tables inside the schema (excluding users to avoid conflicts)
  ...authWithoutUsers,

  crmConnections: defineTable({
    businessId: v.id("businesses"),
    userId: v.id("users"),
    platform: v.union(v.literal("salesforce"), v.literal("hubspot"), v.literal("pipedrive")),
    accountName: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
    isActive: v.boolean(),
    connectedAt: v.number(),
    lastSyncAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_user", ["userId"])
    .index("by_business_and_platform", ["businessId", "platform"]),

  crmSyncConflicts: defineTable({
    businessId: v.id("businesses"),
    connectionId: v.id("crmConnections"),
    contactEmail: v.string(),
    conflictType: v.string(),
    localData: v.any(),
    remoteData: v.any(),
    status: v.union(v.literal("pending"), v.literal("resolved")),
    resolution: v.optional(v.union(v.literal("keep_local"), v.literal("keep_remote"), v.literal("merge"))),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_connection", ["connectionId"])
    .index("by_status", ["status"]),

  crmDeals: defineTable({
    businessId: v.id("businesses"),
    connectionId: v.id("crmConnections"),
    name: v.string(),
    value: v.optional(v.number()),
    stage: v.string(),
    contactName: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    closeDate: v.optional(v.number()),
    probability: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_connection", ["connectionId"])
    .index("by_stage", ["stage"]),

  evalSets: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
    createdBy: v.optional(v.id("users")),
    tests: v.array(evalTestValidator),
  }).index("by_name", ["name"]),

  evalRuns: defineTable({
    setId: v.id("evalSets"),
    startedAt: v.number(),
    finishedAt: v.optional(v.number()),
    status: v.union(v.literal("running"), v.literal("completed"), v.literal("failed")),
    passCount: v.number(),
    failCount: v.number(),
    results: v.array(
      v.object({
        testIndex: v.number(),
        passed: v.boolean(),
        actualPreview: v.string(),
        error: v.optional(v.string()),
      })
    ),
  }).index("by_set", ["setId"]),

  agentCatalog: defineTable({
    agent_key: v.string(),
    display_name: v.string(),
    short_desc: v.string(),
    long_desc: v.string(),
    capabilities: v.array(v.string()),
    default_model: v.string(),
    model_routing: v.string(), // JSON string
    prompt_template_version: v.string(),
    prompt_templates: v.string(), // JSON string or large text
    input_schema: v.string(), // JSON string
    output_schema: v.string(), // JSON string
    tier_restrictions: v.array(v.string()),
    confidence_hint: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_agent_key", ["agent_key"])
    .index("by_active", ["active"]),

  playbooks: defineTable({
    playbook_key: v.string(),
    display_name: v.string(),
    version: v.string(),
    // Store complex JSONs permissively to avoid over-constraining schema
    triggers: v.any(),
    input_schema: v.any(),
    output_schema: v.any(),
    steps: v.any(),
    metadata: v.any(),
    active: v.boolean(),
  })
    .index("by_key_and_version", ["playbook_key", "version"])
    .index("by_active", ["active"]),

  agentVersions: defineTable({
    agent_key: v.string(),
    version: v.string(), // e.g., 'v1-<timestamp>'
    snapshot: v.object({
      agent_key: v.string(),
      display_name: v.string(),
      short_desc: v.string(),
      long_desc: v.string(),
      capabilities: v.array(v.string()),
      default_model: v.string(),
      model_routing: v.string(),
      prompt_template_version: v.string(),
      prompt_templates: v.string(),
      input_schema: v.string(),
      output_schema: v.string(),
      tier_restrictions: v.array(v.string()),
      confidence_hint: v.number(),
      active: v.boolean(),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    }),
    createdAt: v.number(),
    createdBy: v.optional(v.id("users")),
    note: v.optional(v.string()),
  })
    .index("by_agent_key", ["agent_key"])
    .index("by_agent_key_and_version", ["agent_key", "version"]),

  playbookVersions: defineTable({
    playbook_key: v.string(),
    version: v.string(),
    snapshot: v.object({
      playbook_key: v.string(),
      display_name: v.string(),
      version: v.string(),
      triggers: v.any(),
      input_schema: v.any(),
      output_schema: v.any(),
      steps: v.any(),
      metadata: v.any(),
      active: v.boolean(),
    }),
    createdAt: v.number(),
    createdBy: v.optional(v.id("users")),
    note: v.optional(v.string()),
  })
    .index("by_playbook_key", ["playbook_key"])
    .index("by_playbook_key_and_version", ["playbook_key", "version"]),

  agentDatasets: defineTable({
    title: v.string(),
    sourceType: v.union(v.literal("url"), v.literal("note")), // keep lightweight
    sourceUrl: v.optional(v.string()),
    noteText: v.optional(v.string()),
    linkedAgentKeys: v.array(v.string()), // agent_key references
    businessScope: v.optional(v.id("businesses")),
    createdAt: v.number(),
    createdBy: v.optional(v.id("users")),
    status: v.optional(v.union(v.literal("new"), v.literal("ready"))),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_agent_link", ["title"]) // lightweight generic index to support listings
    .index("by_status", ["status"]),

  // Vector database tables for Phase A
  vectorChunks: defineTable({
    scope: v.union(v.literal("global"), v.literal("dataset"), v.literal("business")),
    businessId: v.optional(v.id("businesses")),
    datasetId: v.optional(v.id("agentDatasets")),
    agentKeys: v.array(v.string()),
    content: v.string(),
    meta: v.any(),
    embedding: v.array(v.number()),
    createdAt: v.number(),
  })
    .index("by_scope", ["scope"])
    .index("by_business", ["businessId"])
    .index("by_dataset", ["datasetId"]),

  // Knowledge graph tables for Phase B
  kgraphNodes: defineTable({
    businessId: v.optional(v.id("businesses")),
    type: v.string(),
    key: v.string(),
    attrs: v.any(),
    summary: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_type_and_key", ["type", "key"])
    .index("by_business_and_type", ["businessId", "type"]),

  kgraphEdges: defineTable({
    businessId: v.optional(v.id("businesses")),
    srcNodeId: v.id("kgraphNodes"),
    dstNodeId: v.id("kgraphNodes"),
    relation: v.string(),
    weight: v.optional(v.number()),
    attrs: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_business_and_src", ["businessId", "srcNodeId"])
    .index("by_business_and_dst", ["businessId", "dstNodeId"]),

  // Agent configuration for Phase C
  agentConfigs: defineTable({
    agent_key: v.string(),
    useRag: v.optional(v.boolean()),
    useKgraph: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_agent_key", ["agent_key"]),

  // Agent Memory System
  agentMemories: defineTable({
    agentId: v.id("aiAgents"),
    businessId: v.id("businesses"),
    memoryType: v.union(
      v.literal("conversation"),
      v.literal("pattern"),
      v.literal("context"),
      v.literal("feedback")
    ),
    content: v.string(),
    metadata: v.optional(v.any()),
    importance: v.number(),
    createdAt: v.number(),
    accessCount: v.number(),
    lastAccessed: v.number(),
  })
    .index("by_agent", ["agentId"])
    .index("by_business", ["businessId"]),

  // Agent Collaboration
  agentCollaborations: defineTable({
    businessId: v.id("businesses"),
    agentIds: v.array(v.id("aiAgents")),
    taskDescription: v.string(),
    coordinatorAgentId: v.id("aiAgents"),
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("failed")),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    messages: v.array(v.object({
      agentId: v.id("aiAgents"),
      message: v.string(),
      messageType: v.union(v.literal("task"), v.literal("result"), v.literal("question")),
      timestamp: v.number(),
    })),
    sharedContext: v.any(),
  })
    .index("by_business", ["businessId"]),

  // Agent Learning Events
  agentLearningEvents: defineTable({
    agentId: v.id("aiAgents"),
    businessId: v.id("businesses"),
    eventType: v.union(
      v.literal("success"),
      v.literal("failure"),
      v.literal("feedback"),
      v.literal("correction")
    ),
    context: v.string(),
    outcome: v.string(),
    learningPoints: v.array(v.string()),
    timestamp: v.number(),
    applied: v.boolean(),
  })
    .index("by_agent", ["agentId"])
    .index("by_business", ["businessId"]),

  // Agent Executions (for analytics)
  agentExecutions: defineTable({
    agentId: v.id("aiAgents"),
    businessId: v.id("businesses"),
    status: v.union(v.literal("success"), v.literal("failure")),
    responseTime: v.optional(v.number()),
    timestamp: v.number(),
    errorMessage: v.optional(v.string()),
  })
    .index("by_agent", ["agentId"])
    .index("by_business", ["businessId"]),

  // Agent Marketplace Listings
  agentMarketplaceListings: defineTable({
    agentId: v.id("aiAgents"),
    publisherId: v.id("users"),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    price: v.number(),
    rating: v.number(),
    downloads: v.number(),
    isPublished: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_published", ["isPublished"])
    .index("by_category", ["category"]),

  // Integration Platform
  integrationTemplates: defineTable({
    name: v.string(),
    description: v.string(),
    category: v.string(),
    config: v.any(),
    requiredFields: v.array(v.string()),
    documentation: v.string(),
    isPublic: v.boolean(),
    createdAt: v.number(),
    usageCount: v.number(),
    rating: v.number(),
  }),

  customIntegrations: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.string(),
    type: v.union(
      v.literal("api"),
      v.literal("webhook"),
      v.literal("database"),
      v.literal("custom")
    ),
    config: v.any(),
    authConfig: v.optional(v.any()),
    endpoints: v.array(v.object({
      method: v.string(),
      path: v.string(),
      description: v.string(),
      requestSchema: v.any(),
      responseSchema: v.any(),
    })),
    status: v.union(
      v.literal("draft"),
      v.literal("testing"),
      v.literal("active"),
      v.literal("deprecated")
    ),
    version: v.string(),
    createdAt: v.number(),
    lastModified: v.number(),
    installedFrom: v.optional(v.id("integrationMarketplace")),
    installedAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"]),

  integrationTests: defineTable({
    integrationId: v.id("customIntegrations"),
    testName: v.string(),
    testType: v.union(
      v.literal("unit"),
      v.literal("integration"),
      v.literal("e2e")
    ),
    testConfig: v.any(),
    expectedResult: v.any(),
    status: v.string(),
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  }),

  integrationTestResults: defineTable({
    testId: v.id("integrationTests"),
    integrationId: v.id("customIntegrations"),
    status: v.string(),
    executionTime: v.number(),
    result: v.any(),
    timestamp: v.number(),
  })
    .index("by_integration", ["integrationId"]),

  integrationMetrics: defineTable({
    integrationId: v.id("customIntegrations"),
    metricType: v.union(
      v.literal("request"),
      v.literal("error"),
      v.literal("latency"),
      v.literal("success")
    ),
    value: v.number(),
    metadata: v.optional(v.any()),
    timestamp: v.number(),
  })
    .index("by_integration", ["integrationId"]),

  integrationMarketplace: defineTable({
    integrationId: v.id("customIntegrations"),
    publisherId: v.id("users"),
    name: v.string(),
    description: v.string(),
    price: v.number(),
    category: v.string(),
    tags: v.array(v.string()),
    rating: v.number(),
    downloads: v.number(),
    isPublished: v.boolean(),
    publishedAt: v.number(),
  }),

  // Workforce Analytics Tables
  workforceOptimizationPlans: defineTable({
    businessId: v.id("businesses"),
    planName: v.string(),
    recommendations: v.array(v.any()),
    status: v.string(),
    targetDate: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"]),

  // Analytics Engine Tables
  customMetrics: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.string(),
    metricType: v.union(
      v.literal("count"),
      v.literal("sum"),
      v.literal("average"),
      v.literal("percentage"),
      v.literal("ratio")
    ),
    dataSource: v.string(),
    aggregationField: v.optional(v.string()),
    filters: v.optional(v.array(v.object({
      field: v.string(),
      operator: v.string(),
      value: v.any(),
    }))),
    groupBy: v.optional(v.array(v.string())),
    formula: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    lastCalculated: v.optional(v.number()),
    currentValue: v.optional(v.number()),
  })
    .index("by_business", ["businessId"]),

  metricHistory: defineTable({
    metricId: v.id("customMetrics"),
    value: v.number(),
    timestamp: v.number(),
  })
    .index("by_metric", ["metricId"]),

  analyticsEvents: defineTable({
    businessId: v.id("businesses"),
    eventType: v.string(),
    eventName: v.string(),
    properties: v.any(),
    userId: v.optional(v.id("users")),
    sessionId: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_business", ["businessId"]),

  analyticsDashboards: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    layout: v.array(v.object({
      widgetId: v.string(),
      type: v.string(),
      position: v.object({
        x: v.number(),
        y: v.number(),
        w: v.number(),
        h: v.number(),
      }),
      config: v.any(),
    })),
    isPublic: v.boolean(),
    createdAt: v.number(),
    lastModified: v.number(),
  })
    .index("by_business", ["businessId"]),

  scheduledReports: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    dashboardId: v.optional(v.id("analyticsDashboards")),
    metrics: v.array(v.id("customMetrics")),
    schedule: v.object({
      frequency: v.union(
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("monthly")
      ),
      time: v.string(),
      dayOfWeek: v.optional(v.number()),
      dayOfMonth: v.optional(v.number()),
    }),
    recipients: v.array(v.string()),
    format: v.union(v.literal("pdf"), v.literal("csv"), v.literal("excel")),
    isActive: v.boolean(),
    createdAt: v.number(),
    lastRun: v.union(v.number(), v.null()),
    nextRun: v.number(),
  })
    .index("by_business", ["businessId"]),

  reportHistory: defineTable({
    reportId: v.id("scheduledReports"),
    businessId: v.id("businesses"),
    generatedAt: v.number(),
    data: v.any(),
    format: v.union(v.literal("pdf"), v.literal("csv"), v.literal("excel")),
    status: v.string(),
    changeNotes: v.optional(v.string()),
    version: v.optional(v.number()),
    previousVersionId: v.optional(v.id("generatedReports")),
  })
    .index("by_business", ["businessId"]),

  dataExports: defineTable({
    businessId: v.id("businesses"),
    dataType: v.union(
      v.literal("metrics"),
      v.literal("events"),
      v.literal("dashboard"),
      v.literal("custom")
    ),
    format: v.union(v.literal("csv"), v.literal("json"), v.literal("excel")),
    filters: v.optional(v.any()),
    dateRange: v.optional(v.object({
      start: v.number(),
      end: v.number(),
    })),
    status: v.string(),
    createdAt: v.number(),
    completedAt: v.union(v.number(), v.null()),
    downloadUrl: v.union(v.string(), v.null()),
  })
    .index("by_business", ["businessId"]),

  // Add new tables for enhanced notifications and search
  pushSubscriptions: defineTable({
    userId: v.id("users"),
    subscription: v.any(), // PushSubscription object
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  savedSearches: defineTable({
    userId: v.id("users"),
    name: v.string(),
    query: v.string(),
    entityTypes: v.optional(v.array(v.string())),
    filters: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  searchHistory: defineTable({
    userId: v.id("users"),
    query: v.string(),
    entityTypes: v.optional(v.array(v.string())),
    resultCount: v.number(),
    searchedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Social Media API Configurations (Admin-managed + Enterprise white-label)
  socialApiConfigs: defineTable({
    platform: v.union(
      v.literal("twitter"),
      v.literal("linkedin"),
      v.literal("meta"),
      v.literal("youtube"),
      v.literal("google"),
    ),
    scope: v.union(v.literal("platform"), v.literal("enterprise")),
    businessId: v.optional(v.id("businesses")), // Only for enterprise scope
    clientId: v.string(),
    clientSecret: v.string(), // Should be encrypted in production
    callbackUrl: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_platform_and_scope", ["platform", "scope"])
    .index("by_business_and_platform", ["businessId", "platform"])
    .index("by_scope", ["scope"]),

  // Demo Videos Management
  demoVideos: defineTable({
    tier: v.string(), // "solopreneur" | "startup" | "sme" | "enterprise"
    videoUrl: v.string(),
    thumbnail: v.optional(v.string()),
    duration: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_tier", ["tier"]),

  // Documentation FAQs
  docsFaqs: defineTable({
    question: v.string(),
    answer: v.string(),
    category: v.string(),
    order: v.number(),
    isPublished: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_published", ["isPublished"])
    .index("by_category", ["category"]),

  // Documentation Videos
  docsVideos: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    videoUrl: v.string(),
    thumbnail: v.optional(v.string()),
    duration: v.optional(v.string()),
    category: v.string(),
    order: v.number(),
    isPublished: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_published", ["isPublished"])
    .index("by_category", ["category"]),

  contentCapsules: defineTable({
    businessId: v.id("businesses"),
    createdBy: v.id("users"),
    title: v.string(),
    content: v.object({
      weeklyPost: v.string(),
      emailSubject: v.string(),
      emailBody: v.string(),
      tweets: v.array(v.string()),
      linkedinPost: v.string(),
      facebookPost: v.string(),
    }),
    platforms: v.array(v.union(v.literal("twitter"), v.literal("linkedin"), v.literal("facebook"))),
    scheduledAt: v.optional(v.number()),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("publishing"),
      v.literal("published"),
      v.literal("failed")
    ),
    postIds: v.optional(v.record(v.string(), v.string())),
    publishedAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"])
    .index("by_business_and_status", ["businessId", "status"]),

  voiceNotes: defineTable({
    businessId: v.id("businesses"),
    userId: v.string(),
    storageId: v.id("_storage"),
    duration: v.number(),
    title: v.string(),
    status: v.union(
      v.literal("processing"),
      v.literal("transcribed"),
      v.literal("completed"),
      v.literal("failed")
    ),
    transcription: v.union(v.string(), v.null()),
    summary: v.union(v.string(), v.null()),
    tags: v.array(v.string()),
    initiativeId: v.union(v.id("initiatives"), v.null()),
  })
    .index("by_business", ["businessId"])
    .index("by_user", ["userId"])
    .index("by_initiative", ["initiativeId"]),

  setupWizard: defineTable({
    businessId: v.id("businesses"),
    userId: v.id("users"),
    currentStep: v.number(),
    completedSteps: v.array(v.string()),
    steps: v.array(v.object({
      id: v.string(),
      title: v.string(),
      completed: v.boolean(),
    })),
    data: v.any(),
    status: v.union(v.literal("in_progress"), v.literal("completed"), v.literal("skipped")),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  learningCourses: defineTable({
    title: v.string(),
    description: v.string(),
    category: v.string(),
    difficulty: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    availableTiers: v.array(v.string()),
    totalLessons: v.number(),
    estimatedDuration: v.string(), // e.g., "2 hours"
    thumbnailUrl: v.optional(v.string()),
    instructorName: v.string(),
    tags: v.array(v.string()),
    isPublished: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_published", ["isPublished"])
    .index("by_category", ["category"]),

  courseLessons: defineTable({
    courseId: v.id("learningCourses"),
    lessonNumber: v.number(),
    title: v.string(),
    description: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    duration: v.optional(v.string()),
    content: v.string(), // Markdown content
    quiz: v.optional(v.object({
      questions: v.array(v.object({
        question: v.string(),
        options: v.array(v.string()),
        correctAnswer: v.number(),
        explanation: v.optional(v.string()),
      })),
    })),
    resources: v.optional(v.array(v.object({
      title: v.string(),
      url: v.string(),
      type: v.string(),
    }))),
  })
    .index("by_course", ["courseId"]),

  courseProgress: defineTable({
    userId: v.id("users"),
    courseId: v.id("learningCourses"),
    completedLessons: v.array(v.string()),
    progressPercentage: v.number(),
    isCompleted: v.boolean(),
    startedAt: v.number(),
    lastAccessedAt: v.number(),
    completedAt: v.optional(v.number()),
    quizScores: v.record(v.string(), v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_course", ["userId", "courseId"]),

  // API Management Tables
  apiVersions: defineTable({
    apiId: v.id("customApis"),
    version: v.string(),
    convexFunction: v.string(),
    isActive: v.boolean(),
    changeNotes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_api", ["apiId"]),

  apiCallLogs: defineTable({
    apiId: v.id("customApis"),
    clientId: v.string(),
    statusCode: v.number(),
    responseTime: v.number(),
    endpoint: v.string(),
    timestamp: v.number(),
  })
    .index("by_api_and_timestamp", ["apiId", "timestamp"]),

  ssoAnalytics: defineTable({
    businessId: v.id("businesses"),
    configId: v.union(v.id("samlConfigs"), v.id("oidcConfigs")),
    configType: v.union(v.literal("saml"), v.literal("oidc")),
    eventType: v.string(),
    userId: v.optional(v.id("users")),
    success: v.boolean(),
    details: v.optional(v.any()),
    timestamp: v.number(),
  })
    .index("by_business_and_timestamp", ["businessId", "timestamp"])
    .index("by_config", ["configId"])
    .index("by_user", ["userId"]),

  etlPipelines: defineTable({
    businessId: v.id("businesses"),
    sourceId: v.id("dataWarehouseSources"),
    name: v.string(),
    description: v.optional(v.string()),
    transformations: v.array(v.object({
      type: v.union(
        v.literal("filter"),
        v.literal("map"),
        v.literal("aggregate"),
        v.literal("join"),
        v.literal("custom")
      ),
      config: v.any(),
    })),
    schedule: v.optional(v.string()),
    enabled: v.boolean(),
    status: v.union(
      v.literal("idle"),
      v.literal("running"),
      v.literal("error")
    ),
    lastRunTime: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_source", ["sourceId"]),

  pipelineExecutions: defineTable({
    pipelineId: v.id("etlPipelines"),
    businessId: v.id("businesses"),
    status: v.union(v.literal("completed"), v.literal("failed")),
    startTime: v.number(),
    endTime: v.number(),
    recordsProcessed: v.number(),
    errors: v.optional(v.array(v.string())),
  })
    .index("by_business", ["businessId"])
    .index("by_pipeline", ["pipelineId"]),

  exportSchedules: defineTable({
    businessId: v.id("businesses"),
    sourceId: v.id("dataWarehouseSources"),
    name: v.string(),
    format: v.union(v.literal("csv"), v.literal("json"), v.literal("parquet")),
    destination: v.string(),
    schedule: v.string(),
    filters: v.optional(v.any()),
    enabled: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_source", ["sourceId"]),

  exportHistory: defineTable({
    businessId: v.id("businesses"),
    scheduleId: v.optional(v.id("exportSchedules")),
    fileName: v.string(),
    format: v.union(v.literal("csv"), v.literal("json"), v.literal("parquet")),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    fileUrl: v.optional(v.string()),
    recordCount: v.number(),
    exportedAt: v.number(),
  })
    .index("by_business", ["businessId"]),

  qualityChecks: defineTable({
    businessId: v.id("businesses"),
    sourceId: v.id("dataWarehouseSources"),
    name: v.string(),
    checkType: v.union(
      v.literal("completeness"),
      v.literal("accuracy"),
      v.literal("consistency"),
      v.literal("timeliness"),
      v.literal("validity")
    ),
    rules: v.array(v.object({
      field: v.string(),
      condition: v.string(),
      threshold: v.number(),
    })),
    schedule: v.string(),
    enabled: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_source", ["sourceId"]),

  // Workflow Versioning
  workflowVersions: defineTable({
    workflowId: v.id("workflows"),
    version: v.number(),
    snapshot: v.object({
      name: v.string(),
      description: v.optional(v.string()),
      pipeline: v.array(v.any()),
      trigger: v.any(),
      approval: v.any(),
    }),
    changeNotes: v.string(),
    createdAt: v.number(),
  })
    .index("by_workflow", ["workflowId"]),

  // Playbook Executions
  playbookExecutions: defineTable({
    playbookId: v.id("playbooks"),
    businessId: v.id("businesses"),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed")
    ),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    result: v.optional(v.any()),
    errorMessage: v.optional(v.string()),
  })
    .index("by_playbook", ["playbookId"])
    .index("by_business", ["businessId"]),

  // Custom APIs
  customApis: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    path: v.string(),
    method: v.union(v.literal("GET"), v.literal("POST"), v.literal("PUT"), v.literal("DELETE")),
    requiresAuth: v.boolean(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"]),

  brandingAnalytics: defineTable({
    businessId: v.id("businesses"),
    brandId: v.optional(v.id("brands")),
    eventType: v.string(),
    metadata: v.optional(v.any()),
    timestamp: v.number(),
  }).index("by_business", ["businessId"]),

  // Brand Assets
  brandAssets: defineTable({
    businessId: v.id("businesses"),
    brandId: v.optional(v.id("brands")),
    name: v.string(),
    type: v.union(v.literal("logo"), v.literal("image"), v.literal("document"), v.literal("other")),
    fileId: v.id("_storage"),
    url: v.optional(v.string()),
    tags: v.array(v.string()),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_brand", ["brandId"]),

  // Custom Domains
  customDomains: defineTable({
    businessId: v.id("businesses"),
    brandId: v.optional(v.id("brands")),
    domain: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("verified"),
      v.literal("active"),
      v.literal("failed")
    ),
    verificationToken: v.optional(v.string()),
    createdAt: v.number(),
    verifiedAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_domain", ["domain"]),

  // Email Drafts
  emailDrafts: defineTable({
    businessId: v.id("businesses"),
    userId: v.id("users"),
    subject: v.string(),
    body: v.string(),
    recipients: v.optional(v.array(v.string())),
    status: v.union(v.literal("draft"), v.literal("sent")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_user", ["userId"]),

  // Data Warehouse Sources
  dataWarehouseSources: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    type: v.union(v.literal("database"), v.literal("api"), v.literal("file")),
    config: v.any(),
    isActive: v.boolean(),
    createdAt: v.number(),
    lastSyncAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"]),

  // Data Warehouse Jobs
  dataWarehouseJobs: defineTable({
    businessId: v.id("businesses"),
    sourceId: v.id("dataWarehouseSources"),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed")
    ),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    recordsProcessed: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  })
    .index("by_business", ["businessId"])
    .index("by_source", ["sourceId"]),

  // Portfolio Risks
  portfolioRisks: defineTable({
    businessId: v.id("businesses"),
    initiativeId: v.optional(v.id("initiatives")),
    title: v.string(),
    description: v.string(),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    probability: v.number(),
    impact: v.number(),
    mitigation: v.optional(v.string()),
    status: v.union(v.literal("open"), v.literal("mitigated"), v.literal("closed")),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"]),

  // Security Tables
  threatDetectionAlerts: defineTable({
    businessId: v.id("businesses"),
    alertType: v.string(),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    description: v.string(),
    status: v.union(v.literal("open"), v.literal("investigating"), v.literal("resolved")),
    detectedAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"]),

  securityIncidents: defineTable({
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.string(),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    status: v.union(v.literal("open"), v.literal("investigating"), v.literal("resolved"), v.literal("closed")),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"]),

  complianceCertifications: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    standard: v.string(),
    status: v.union(v.literal("active"), v.literal("expired"), v.literal("pending")),
    issuedAt: v.number(),
    expiresAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"]),

  securityAudits: defineTable({
    businessId: v.id("businesses"),
    auditType: v.string(),
    findings: v.array(v.any()),
    status: v.union(v.literal("scheduled"), v.literal("in_progress"), v.literal("completed")),
    scheduledAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"]),

  // Governance Tables
  governanceEscalations: defineTable({
    businessId: v.id("businesses"),
    violationId: v.optional(v.id("governanceViolations")),
    title: v.string(),
    description: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    status: v.union(v.literal("pending"), v.literal("in_progress"), v.literal("resolved")),
    assignedTo: v.optional(v.id("users")),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"]),

  governanceRules: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.string(),
    ruleType: v.string(),
    conditions: v.any(),
    actions: v.any(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"]),

  governanceViolations: defineTable({
    businessId: v.id("businesses"),
    ruleId: v.id("governanceRules"),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    description: v.string(),
    status: v.union(v.literal("open"), v.literal("acknowledged"), v.literal("resolved")),
    detectedAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_rule", ["ruleId"]),

  // Policy Tables
  policies: defineTable({
    businessId: v.id("businesses"),
    title: v.string(),
    content: v.string(),
    version: v.string(),
    status: v.union(v.literal("draft"), v.literal("active"), v.literal("archived")),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"]),

  policyApprovals: defineTable({
    businessId: v.id("businesses"),
    policyId: v.id("policies"),
    approverId: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    comments: v.optional(v.string()),
    createdAt: v.number(),
    decidedAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_policy", ["policyId"]),

  // Report Templates
  reportTemplates: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    template: v.any(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"]),

  generatedReports: defineTable({
    businessId: v.id("businesses"),
    templateId: v.optional(v.id("reportTemplates")),
    name: v.string(),
    data: v.any(),
    format: v.union(v.literal("pdf"), v.literal("csv"), v.literal("excel")),
    generatedAt: v.number(),
    downloadUrl: v.optional(v.string()),
  })
    .index("by_business", ["businessId"]),

  // Customer Segments
  customerSegments: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    criteria: v.any(),
    contactCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"]),

  // Support Tickets
  supportTickets: defineTable({
    businessId: v.id("businesses"),
    userId: v.optional(v.id("users")),
    subject: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("closed")
    ),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    assignedTo: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"]),

  // Team Goals
  teamGoals: defineTable({
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.optional(v.string()),
    targetValue: v.number(),
    currentValue: v.number(),
    unit: v.string(),
    deadline: v.optional(v.number()),
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("cancelled")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"]),

  // Experiments
  experiments: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    hypothesis: v.string(),
    status: v.union(v.literal("draft"), v.literal("running"), v.literal("completed"), v.literal("cancelled")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"]),

  experimentVariants: defineTable({
    experimentId: v.id("experiments"),
    name: v.string(),
    description: v.optional(v.string()),
    config: v.any(),
    trafficAllocation: v.number(),
  })
    .index("by_experiment", ["experimentId"]),

  experimentResults: defineTable({
    experimentId: v.id("experiments"),
    variantId: v.id("experimentVariants"),
    metric: v.string(),
    value: v.number(),
    timestamp: v.number(),
  })
    .index("by_experiment", ["experimentId"]),

  // Invoices
  invoices: defineTable({
    businessId: v.id("businesses"),
    invoiceNumber: v.string(),
    clientName: v.string(),
    clientEmail: v.string(),
    amount: v.number(),
    currency: v.string(),
    status: v.union(v.literal("draft"), v.literal("sent"), v.literal("paid"), v.literal("overdue")),
    dueDate: v.number(),
    createdAt: v.number(),
    paidAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"]),

  // KMS Configuration
  kmsConfigs: defineTable({
    businessId: v.id("businesses"),
    keyId: v.string(),
    keyType: v.string(),
    algorithm: v.string(),
    status: v.union(v.literal("active"), v.literal("rotating"), v.literal("disabled")),
    createdAt: v.number(),
    rotatedAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"]),

  kmsEncryptionPolicies: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    rules: v.any(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"]),

  // Theme Versions
  themeVersions: defineTable({
    businessId: v.id("businesses"),
    brandId: v.optional(v.id("brands")),
    version: v.string(),
    theme: v.any(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_brand", ["brandId"]),

  // Brands table
  brands: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    colors: v.optional(v.any()),
    fonts: v.optional(v.any()),
    logo: v.optional(v.string()),
    // Add missing fields
    isDefault: v.optional(v.boolean()),
    logoUrl: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_business_and_default", ["businessId", "isDefault"]),

  // SAML Configs
  samlConfigs: defineTable({
    businessId: v.id("businesses"),
    entityId: v.string(),
    ssoUrl: v.string(),
    certificate: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"]),

  // OIDC Configs
  oidcConfigs: defineTable({
    businessId: v.id("businesses"),
    issuer: v.string(),
    clientId: v.string(),
    clientSecret: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"]),

  // SCIM User Mappings
  scimUserMappings: defineTable({
    businessId: v.id("businesses"),
    externalId: v.string(),
    userId: v.id("users"),
    attributes: v.any(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_external_id", ["externalId"]),

  // SCIM Group Mappings
  scimGroupMappings: defineTable({
    businessId: v.id("businesses"),
    externalId: v.string(),
    groupName: v.string(),
    members: v.array(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"]),

  // SCIM Attribute Mappings
  scimAttributeMappings: defineTable({
    businessId: v.id("businesses"),
    scimAttribute: v.string(),
    internalAttribute: v.string(),
    transformation: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"]),

  // SCIM Sync Log
  scimSyncLog: defineTable({
    businessId: v.id("businesses"),
    operation: v.string(),
    status: v.union(v.literal("success"), v.literal("failed")),
    details: v.any(),
    timestamp: v.number(),
  })
    .index("by_business", ["businessId"]),

  // KMS Key Rotations
  kmsKeyRotations: defineTable({
    businessId: v.id("businesses"),
    keyId: v.string(),
    oldKeyVersion: v.string(),
    newKeyVersion: v.string(),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed")),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"]),

  // KMS Usage Logs
  kmsUsageLogs: defineTable({
    businessId: v.id("businesses"),
    keyId: v.string(),
    operation: v.string(),
    userId: v.optional(v.id("users")),
    timestamp: v.number(),
  })
    .index("by_business", ["businessId"]),

  // Social Media Management
  socialAccounts: defineTable({
    businessId: v.id("businesses"),
    platform: v.union(v.literal("twitter"), v.literal("linkedin"), v.literal("facebook")),
    accountId: v.string(),
    accountName: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    isActive: v.boolean(),
    connectedAt: v.number(),
    lastSyncAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_platform", ["platform"]),

  socialPosts: defineTable({
    businessId: v.id("businesses"),
    createdBy: v.id("users"),
    platforms: v.array(v.union(v.literal("twitter"), v.literal("linkedin"), v.literal("facebook"))),
    content: v.string(),
    mediaUrls: v.optional(v.array(v.id("_storage"))),
    characterCount: v.number(),
    scheduledAt: v.optional(v.number()),
    postedAt: v.optional(v.number()),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("posting"),
      v.literal("posted"),
      v.literal("failed")
    ),
    approvalStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("not_required")
    )),
    errorMessage: v.optional(v.string()),
    postIds: v.optional(v.object({
      twitter: v.optional(v.string()),
      linkedin: v.optional(v.string()),
      facebook: v.optional(v.string()),
    })),
    performanceMetrics: v.optional(v.object({
      impressions: v.number(),
      engagements: v.number(),
      clicks: v.number(),
      shares: v.number(),
      comments: v.number(),
      likes: v.number(),
      lastUpdated: v.number(),
    })),
  })
    .index("by_business", ["businessId"])
    .index("by_business_and_status", ["businessId", "status"])
    .index("by_status_and_scheduled", ["status"]),

  // Team Chat
  teamChannels: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    isPrivate: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"]),

  teamMessages: defineTable({
    businessId: v.id("businesses"),
    senderId: v.id("users"),
    channelId: v.id("teamChannels"),
    parentMessageId: v.optional(v.id("teamMessages")),
    content: v.string(),
    attachments: v.optional(v.array(v.object({
      name: v.string(),
      url: v.string(),
      type: v.string(),
      size: v.optional(v.number()),
    }))),
    reactions: v.array(v.object({
      userId: v.id("users"),
      emoji: v.string(),
    })),
    editedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_business_and_channel", ["businessId", "channelId"])
    .index("by_parent", ["parentMessageId"]),

  // Vendor Management
  vendors: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    category: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("pending")),
    contactName: v.string(),
    contactEmail: v.string(),
    contactPhone: v.optional(v.string()),
    contractStart: v.number(),
    contractEnd: v.number(),
    contractValue: v.number(),
    performanceScore: v.number(),
    riskLevel: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    lastReviewDate: v.number(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"]),

  vendorPerformanceMetrics: defineTable({
    businessId: v.id("businesses"),
    vendorId: v.id("vendors"),
    onTimeDelivery: v.number(),
    qualityScore: v.number(),
    responsiveness: v.number(),
    costEfficiency: v.number(),
    overallScore: v.number(),
    notes: v.optional(v.string()),
    recordedAt: v.number(),
    recordedBy: v.string(),
  })
    .index("by_business", ["businessId"])
    .index("by_vendor", ["vendorId"]),

  // Workflow Handoffs
  workflowHandoffs: defineTable({
    businessId: v.id("businesses"),
    workflowId: v.id("workflows"),
    stepId: v.id("workflowSteps"),
    fromDepartment: v.string(),
    toDepartment: v.string(),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected")),
    initiatedBy: v.id("users"),
    initiatedAt: v.number(),
    resolvedBy: v.optional(v.id("users")),
    resolvedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  })
    .index("by_business", ["businessId"])
    .index("by_workflow", ["workflowId"])
    .index("by_status", ["status"]),

  // Revenue Attribution
  revenueTouchpoints: defineTable({
    businessId: v.id("businesses"),
    contactId: v.optional(v.id("contacts")),
    channel: v.union(
      v.literal("email"),
      v.literal("social"),
      v.literal("paid"),
      v.literal("referral"),
      v.literal("direct")
    ),
    campaignId: v.optional(v.string()),
    touchpointType: v.string(),
    value: v.optional(v.number()),
    timestamp: v.number(),
    metadata: v.optional(v.any()),
  })
    .index("by_business", ["businessId"])
    .index("by_contact", ["contactId"])
    .index("by_channel", ["channel"]),

  revenueConversions: defineTable({
    businessId: v.id("businesses"),
    contactId: v.id("contacts"),
    revenue: v.number(),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    conversionType: v.string(),
    touchpointCount: v.number(),
    attributions: v.any(),
    metadata: v.optional(v.any()),
    convertedAt: v.optional(v.number()),
    timestamp: v.number(),
    attributionModel: v.optional(v.string()),
    touchpointIds: v.optional(v.array(v.id("revenueTouchpoints"))),
  })
    .index("by_business", ["businessId"])
    .index("by_contact", ["contactId"])
    .index("by_business_and_timestamp", ["businessId", "timestamp"]),

  // Training & Support
  trainingSessions: defineTable({
    businessId: v.optional(v.id("businesses")),
    userId: v.optional(v.id("users")),
    title: v.string(),
    description: v.optional(v.string()),
    sessionType: v.union(v.literal("onboarding"), v.literal("training"), v.literal("support")),
    status: v.union(v.literal("scheduled"), v.literal("in_progress"), v.literal("completed"), v.literal("cancelled")),
    scheduledAt: v.number(),
    completedAt: v.optional(v.number()),
    duration: v.optional(v.number()),
    notes: v.optional(v.string()),
  })
    .index("by_business", ["businessId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // Webhook Management
  webhooks: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    url: v.string(),
    events: v.array(v.string()),
    secret: v.string(),
    isActive: v.boolean(),
    retryPolicy: v.object({
      maxRetries: v.number(),
      retryDelay: v.number(),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"]),

  webhookDeliveries: defineTable({
    webhookId: v.id("webhooks"),
    businessId: v.id("businesses"),
    event: v.string(),
    payload: v.any(),
    status: v.union(v.literal("pending"), v.literal("success"), v.literal("failed")),
    attempts: v.number(),
    lastAttemptAt: v.number(),
    responseCode: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_webhook", ["webhookId"])
    .index("by_business", ["businessId"])
    .index("by_status", ["status"]),

  // Audit Report Schedules
  auditReportSchedules: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    reportType: v.string(),
    schedule: v.string(),
    recipients: v.array(v.string()),
    isActive: v.boolean(),
    lastRunAt: v.optional(v.number()),
    nextRunAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"]),

  // Branding Configs
  brandingConfigs: defineTable({
    businessId: v.id("businesses"),
    brandId: v.optional(v.id("brands")),
    primaryColor: v.string(),
    secondaryColor: v.string(),
    accentColor: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    fontFamily: v.optional(v.string()),
    customCss: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_brand", ["brandId"]),

  // Crisis Alerts
  crisisAlerts: defineTable({
    businessId: v.id("businesses"),
    alertType: v.string(),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    title: v.string(),
    description: v.string(),
    status: v.union(v.literal("active"), v.literal("monitoring"), v.literal("resolved")),
    detectedAt: v.number(),
    resolvedAt: v.optional(v.number()),
    assignedTo: v.optional(v.id("users")),
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"]),

  // Customer Journey Stages
  customerJourneyStages: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    order: v.number(),
    touchpoints: v.array(v.string()),
    metrics: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
    // Add fields used by code as instance tracker
    contactId: v.optional(v.id("contacts")),
    enteredAt: v.optional(v.number()),
    exitedAt: v.optional(v.number()),
    stage: v.optional(v.string()),
  })
    .index("by_business", ["businessId"])
    .index("by_contact", ["contactId"]),

  // Department Metrics
  departmentMetrics: defineTable({
    businessId: v.id("businesses"),
    department: v.string(),
    metricName: v.string(),
    value: v.number(),
    target: v.optional(v.number()),
    unit: v.string(),
    period: v.string(),
    timestamp: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_business_and_department", ["businessId", "department"]),

  // Email Analytics
  emailAnalytics: defineTable({
    businessId: v.id("businesses"),
    emailId: v.optional(v.id("emails")),
    campaignId: v.optional(v.id("emailCampaigns")),
    sent: v.number(),
    delivered: v.number(),
    opened: v.number(),
    clicked: v.number(),
    bounced: v.number(),
    unsubscribed: v.number(),
    complained: v.number(),
    timestamp: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_email", ["emailId"])
    .index("by_campaign", ["campaignId"]),

  // Goal Updates (for activity tracking)
  goalUpdates: defineTable({
    businessId: v.id("businesses"),
    goalId: v.id("teamGoals"),
    updatedBy: v.id("users"),
    previousValue: v.number(),
    newValue: v.number(),
    timestamp: v.number(),
    notes: v.optional(v.string()),
  })
    .index("by_business", ["businessId"])
    .index("by_goal", ["goalId"])
    .index("by_updated_by", ["updatedBy"]),

  // Goal Milestones
  goalMilestones: defineTable({
    businessId: v.id("businesses"),
    goalId: v.id("teamGoals"),
    title: v.string(),
    description: v.optional(v.string()),
    targetDate: v.number(),
    status: v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed"), v.literal("missed")),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_goal", ["goalId"]),

  // Initiative Phases
  initiativePhases: defineTable({
    businessId: v.id("businesses"),
    initiativeId: v.id("initiatives"),
    name: v.string(),
    description: v.optional(v.string()),
    order: v.number(),
    status: v.union(v.literal("pending"), v.literal("active"), v.literal("completed")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_initiative", ["initiativeId"]),

  // KPI Targets
  kpiTargets: defineTable({
    businessId: v.id("businesses"),
    kpiName: v.string(),
    targetValue: v.number(),
    currentValue: v.number(),
    unit: v.string(),
    period: v.string(),
    deadline: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"]),

  // Policy Acknowledgments
  policyAcknowledgments: defineTable({
    businessId: v.id("businesses"),
    policyId: v.id("policies"),
    userId: v.id("users"),
    acknowledgedAt: v.number(),
    ipAddress: v.optional(v.string()),
  })
    .index("by_business", ["businessId"])
    .index("by_policy", ["policyId"])
    .index("by_user", ["userId"]),

  // Policy Distributions
  policyDistributions: defineTable({
    businessId: v.id("businesses"),
    policyId: v.id("policies"),
    distributedTo: v.array(v.id("users")),
    distributedAt: v.number(),
    distributedBy: v.id("users"),
    dueDate: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_policy", ["policyId"]),

  // Social Media Docs
  socialMediaDocs: defineTable({
    businessId: v.id("businesses"),
    platform: v.union(v.literal("twitter"), v.literal("linkedin"), v.literal("facebook"), v.literal("instagram")),
    title: v.string(),
    content: v.string(),
    category: v.string(),
    isPublished: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_platform", ["platform"]),

  // Strategic Goals
  strategicGoals: defineTable({
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.optional(v.string()),
    targetValue: v.number(),
    currentValue: v.number(),
    unit: v.string(),
    deadline: v.number(),
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("cancelled")),
    ownerId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_owner", ["ownerId"]),

  // Team Roles
  teamRoles: defineTable({
    businessId: v.id("businesses"),
    userId: v.id("users"),
    role: v.string(),
    permissions: v.array(v.string()),
    assignedAt: v.number(),
    assignedBy: v.id("users"),
  })
    .index("by_business", ["businessId"])
    .index("by_user", ["userId"]),

  // Workflow Metrics
  workflowMetrics: defineTable({
    businessId: v.id("businesses"),
    workflowId: v.id("workflows"),
    metricName: v.string(),
    value: v.number(),
    unit: v.string(),
    timestamp: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_workflow", ["workflowId"]),

  // Add missing tables
  activityFeed: defineTable({
    businessId: v.id("businesses"),
    userId: v.id("users"),
    type: v.string(),
    content: v.string(),
    data: v.optional(v.any()),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_user", ["userId"]),

  departmentBudgetActuals: defineTable({
    businessId: v.id("businesses"),
    department: v.string(),
    amount: v.number(),
    date: v.number(),
    description: v.optional(v.string()),
    fiscalYear: v.string(),
    createdAt: v.number(),
  })
    .index("by_business_and_year", ["businessId", "fiscalYear"]),

  departmentBudgetForecasts: defineTable({
    businessId: v.id("businesses"),
    department: v.string(),
    amount: v.number(),
    date: v.number(),
    fiscalYear: v.string(),
    createdAt: v.number(),
  })
    .index("by_business_and_year", ["businessId", "fiscalYear"]),

  revenueEvents: defineTable({
    businessId: v.id("businesses"),
    amount: v.number(),
    date: v.number(),
    source: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"]),

  portfolioMetrics: defineTable({
    businessId: v.id("businesses"),
    totalBudget: v.number(),
    totalSpent: v.number(),
    overallHealth: v.string(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"]),

  initiativeDependencies: defineTable({
    businessId: v.id("businesses"),
    sourceInitiativeId: v.id("initiatives"),
    targetInitiativeId: v.id("initiatives"),
    type: v.string(),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"]),

  resourceAllocations: defineTable({
    businessId: v.id("businesses"),
    initiativeId: v.id("initiatives"),
    resourceType: v.string(),
    allocatedAmount: v.number(),
    capacity: v.number(),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"]),

  ticketComments: defineTable({
    ticketId: v.id("supportTickets"),
    userId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_ticket", ["ticketId"]),

  invoiceTemplates: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"]),

  policyVersions: defineTable({
    policyId: v.id("policies"),
    version: v.string(),
    content: v.string(),
    createdAt: v.number(),
    createdBy: v.id("users"),
  })
    .index("by_policy", ["policyId"]),

  governanceRemediations: defineTable({
    businessId: v.id("businesses"),
    violationId: v.id("governanceViolations"),
    workflowId: v.id("workflows"),
    status: v.string(),
    appliedAt: v.number(),
    originalPipeline: v.optional(v.any()),
  })
    .index("by_business", ["businessId"])
    .index("by_workflow", ["workflowId"]),

  governanceAutomationSettings: defineTable({
    businessId: v.id("businesses"),
    autoRemediate: v.boolean(),
    escalationRules: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"]),

  dataQualityMetrics: defineTable({
    businessId: v.id("businesses"),
    sourceId: v.id("dataWarehouseSources"),
    metric: v.string(),
    value: v.number(),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"]),

  customerJourneyTransitions: defineTable({
    businessId: v.id("businesses"),
    contactId: v.id("contacts"),
    fromStage: v.string(),
    toStage: v.string(),
    transitionedAt: v.number(),
  })
    .index("by_business_and_date", ["businessId", "transitionedAt"])
    .index("by_contact", ["contactId"]),

  emailEvents: defineTable({
    businessId: v.id("businesses"),
    campaignId: v.optional(v.id("emailCampaigns")),
    emailId: v.optional(v.id("emails")),
    eventType: v.string(),
    recipient: v.string(),
    timestamp: v.number(),
    metadata: v.optional(v.any()),
  })
    .index("by_business", ["businessId"])
    .index("by_campaign", ["campaignId"]),

});

export default schema;