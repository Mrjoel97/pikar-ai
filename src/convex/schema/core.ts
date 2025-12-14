import { defineTable } from "convex/server";
import { v } from "convex/values";

export const coreSchema = {
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    companyName: v.optional(v.string()),
    industry: v.optional(v.string()),
    businessTier: v.optional(v.string()),
    onboardingCompleted: v.optional(v.boolean()),
    businessId: v.optional(v.id("businesses")),
    tokenIdentifier: v.optional(v.string()),
  })
    .index("email", ["email"])
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
    tier: v.optional(v.string()),
    subscriptionStatus: v.optional(v.string()),
    subscriptionId: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()),
    stripeCustomerId: v.optional(v.string()),
    billingEmail: v.optional(v.string()),
    paymentMethodId: v.optional(v.string()),
    trialEndsAt: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    canceledAt: v.optional(v.number()),
    features: v.optional(v.array(v.string())),
    limits: v.optional(v.object({
      maxUsers: v.number(),
      maxAgents: v.number(),
      maxWorkflows: v.number(),
      maxStorage: v.number(),
    })),
    settings: v.optional(v.object({
      aiAgentsEnabled: v.array(v.string()),
      complianceLevel: v.string(),
      dataIntegrations: v.array(v.string()),
    })),
  })
    .index("by_owner", ["ownerId"])
    .index("by_tier", ["tier"]),

  initiatives: defineTable({
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("planning"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("on_hold")
    )),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    )),
    startDate: v.optional(v.number()),
    targetDate: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"]),

  wins: defineTable({
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.optional(v.string()),
    impact: v.optional(v.string()),
    timeSaved: v.optional(v.number()),
    category: v.optional(v.union(
      v.literal("automation"),
      v.literal("revenue"),
      v.literal("efficiency"),
      v.literal("customer"),
      v.literal("other")
    )),
    date: v.number(),
  }).index("by_business", ["businessId"]),

  journeyMilestones: defineTable({
    businessId: v.id("businesses"),
    initiativeId: v.id("initiatives"),
    title: v.string(),
    description: v.optional(v.string()),
    targetDate: v.optional(v.number()),
    status: v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("blocked")
    ),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_initiative", ["initiativeId"])
    .index("by_business", ["businessId"]),

  brainDumps: defineTable({
    businessId: v.id("businesses"),
    userId: v.id("users"),
    content: v.string(),
    type: v.optional(v.union(
      v.literal("note"),
      v.literal("idea"),
      v.literal("task"),
      v.literal("voice")
    )),
    tags: v.optional(v.array(v.string())),
    processed: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_user", ["userId"]),

  customerSegments: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    criteria: v.object({
      rules: v.array(v.any()),
      operator: v.union(v.literal("AND"), v.literal("OR")),
    }),
    customerCount: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index("by_business", ["businessId"]),

  emailCampaigns: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    subject: v.string(),
    content: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("sent"),
      v.literal("failed")
    ),
    segmentId: v.optional(v.id("customerSegments")),
    scheduledFor: v.optional(v.number()),
    sentAt: v.optional(v.number()),
    stats: v.optional(v.object({
      sent: v.number(),
      delivered: v.number(),
      opened: v.number(),
      clicked: v.number(),
      bounced: v.number(),
      unsubscribed: v.number(),
    })),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"]),

  scheduleSlots: defineTable({
    businessId: v.id("businesses"),
    userId: v.id("users"),
    dayOfWeek: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    available: v.boolean(),
    timezone: v.optional(v.string()),
  })
    .index("by_business", ["businessId"])
    .index("by_user", ["userId"]),

  appointments: defineTable({
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    attendees: v.array(v.string()),
    location: v.optional(v.string()),
    type: v.string(),
    status: v.string(),
  }).index("by_business", ["businessId"]),

  availabilityBlocks: defineTable({
    businessId: v.id("businesses"),
    dayOfWeek: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    isAvailable: v.boolean(),
  }).index("by_business", ["businessId"]),

  calendarIntegrations: defineTable({
    businessId: v.id("businesses"),
    userId: v.id("users"),
    provider: v.union(v.literal("google"), v.literal("outlook"), v.literal("apple")),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.number(),
    isActive: v.boolean(),
    connectedAt: v.number(),
    lastSyncAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_user", ["userId"]),

  uploads: defineTable({
    businessId: v.id("businesses"),
    userId: v.id("users"),
    storageId: v.string(),
    filename: v.string(),
    contentType: v.string(),
    size: v.number(),
    purpose: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_user", ["userId"]),

  invoices: defineTable({
    businessId: v.id("businesses"),
    templateId: v.optional(v.id("invoiceTemplates")),
    invoiceNumber: v.string(),
    clientName: v.string(),
    clientEmail: v.string(),
    clientAddress: v.optional(v.string()),
    items: v.array(v.object({
      description: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      amount: v.number(),
    })),
    subtotal: v.number(),
    taxRate: v.number(),
    taxAmount: v.number(),
    total: v.number(),
    currency: v.string(),
    issueDate: v.number(),
    dueDate: v.number(),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("paid"),
      v.literal("overdue")
    ),
    paidAt: v.optional(v.number()),
    paymentStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("failed")
    )),
    paymentMethod: v.optional(v.union(
      v.literal("stripe"),
      v.literal("paypal")
    )),
    paymentLink: v.optional(v.string()),
    notes: v.optional(v.string()),
    terms: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"]),

  invoiceTemplates: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    logoUrl: v.optional(v.string()),
    fromName: v.string(),
    fromAddress: v.string(),
    fromEmail: v.string(),
    fromPhone: v.optional(v.string()),
    taxRate: v.number(),
    currency: v.string(),
    notes: v.optional(v.string()),
    terms: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_business", ["businessId"]),

  workflowTemplates: defineTable({
    businessId: v.optional(v.id("businesses")),
    name: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    steps: v.array(v.any()),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    tags: v.optional(v.array(v.string())),
    tier: v.optional(v.string()),
  })
    .index("by_business", ["businessId"])
    .index("by_name", ["name"]),

  notifications: defineTable({
    businessId: v.id("businesses"),
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.optional(v.union(
      v.literal("info"),
      v.literal("success"),
      v.literal("warning"),
      v.literal("error")
    )),
    read: v.optional(v.boolean()),
    actionUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_user", ["userId"]),

  socialAccounts: defineTable({
    businessId: v.id("businesses"),
    platform: v.union(
      v.literal("twitter"),
      v.literal("linkedin"),
      v.literal("facebook")
    ),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.number(),
    isConnected: v.boolean(),
    username: v.optional(v.string()),
    profileUrl: v.optional(v.string()),
    lastSyncAt: v.optional(v.number()),
    lastUsedAt: v.optional(v.number()),
    connectedAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_business_and_platform", ["businessId", "platform"]),

  contacts: defineTable({
    businessId: v.id("businesses"),
    email: v.string(),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("lead"),
      v.literal("active"),
      v.literal("customer"),
      v.literal("churned"),
      v.literal("subscribed"),
      v.literal("bounced"),
      v.literal("unsubscribed")
    )),
    source: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    customFields: v.optional(v.any()),
    lastEngagedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_email", ["email"])
    .index("by_status", ["status"]),

  teamGoals: defineTable({
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.optional(v.string()),
    targetValue: v.number(),
    currentValue: v.number(),
    unit: v.string(),
    deadline: v.optional(v.number()),
    assignedTo: v.optional(v.array(v.id("users"))),
    category: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("archived")
    ),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"]),

  goalUpdates: defineTable({
    goalId: v.id("teamGoals"),
    businessId: v.id("businesses"),
    updatedBy: v.id("users"),
    previousValue: v.number(),
    newValue: v.number(),
    note: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_goal", ["goalId"])
    .index("by_business", ["businessId"]),

  journeyStageDefinitions: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    order: v.number(),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    automations: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index("by_business", ["businessId"]),

  journeyTriggers: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    triggerType: v.union(
      v.literal("event"),
      v.literal("time"),
      v.literal("condition")
    ),
    conditions: v.any(),
    actions: v.array(v.any()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    lastTriggered: v.optional(v.number()),
    triggerCount: v.number(),
  }).index("by_business", ["businessId"]),

  customerJourneyStages: defineTable({
    businessId: v.id("businesses"),
    contactId: v.id("contacts"),
    stage: v.string(),
    enteredAt: v.number(),
    exitedAt: v.optional(v.number()),
    touchpoints: v.array(v.string()),
  })
    .index("by_business", ["businessId"])
    .index("by_contact", ["contactId"]),

  customerJourneyTransitions: defineTable({
    businessId: v.id("businesses"),
    contactId: v.id("contacts"),
    fromStage: v.string(),
    toStage: v.string(),
    transitionedAt: v.number(),
  })
    .index("by_business_and_date", ["businessId", "transitionedAt"])
    .index("by_contact", ["contactId"]),

  revenueTouchpoints: defineTable({
    businessId: v.id("businesses"),
    contactId: v.id("contacts"),
    channel: v.string(),
    campaignId: v.optional(v.string()),
    timestamp: v.number(),
  }).index("by_business", ["businessId"]),

  revenueEvents: defineTable({
    businessId: v.id("businesses"),
    userId: v.id("users"),
    amount: v.number(),
    source: v.string(),
    description: v.optional(v.string()),
    metadata: v.optional(v.any()),
    timestamp: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"]),

  audit_logs: defineTable({
    businessId: v.id("businesses"),
    userId: v.optional(v.id("users")),
    action: v.string(),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    details: v.optional(v.any()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_business_and_date", ["businessId", "createdAt"]),

  teamChannels: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    isPrivate: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    department: v.optional(v.string()),
    isCrossDepartment: v.optional(v.boolean()),
  })
    .index("by_business", ["businessId"])
    .index("by_department", ["businessId", "department"]),

  teamMessages: defineTable({
    businessId: v.id("businesses"),
    channelId: v.id("teamChannels"),
    senderId: v.id("users"),
    content: v.string(),
    attachments: v.optional(v.array(v.any())),
    parentMessageId: v.optional(v.id("teamMessages")),
    reactions: v.optional(v.array(v.any())),
    createdAt: v.number(),
    editedAt: v.optional(v.number()),
  })
    .index("by_channel", ["channelId"])
    .index("by_business", ["businessId"]),

  auditReportSchedules: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    reportType: v.string(),
    frequency: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("quarterly")
    ),
    recipients: v.array(v.string()),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastRunAt: v.optional(v.number()),
    nextRunAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_next_run", ["nextRunAt"]),

  admins: defineTable({
    email: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("super_admin"),
      v.literal("pending_senior"),
      v.literal("senior")
    ),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  adminAuths: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    salt: v.optional(v.string()),
    role: v.string(),
    isVerified: v.boolean(),
    verificationToken: v.optional(v.string()),
    resetToken: v.optional(v.string()),
    resetTokenExpires: v.optional(v.number()),
    lastLoginAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_email", ["email"]),

  adminSessions: defineTable({
    adminId: v.id("adminAuths"),
    token: v.string(),
    expiresAt: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_admin", ["adminId"]),

  emailConfigs: defineTable({
    businessId: v.id("businesses"),
    provider: v.union(v.literal("resend"), v.literal("sendgrid"), v.literal("smtp"), v.literal("aws_ses")),
    apiKey: v.optional(v.string()),
    fromEmail: v.string(),
    fromName: v.string(),
    replyTo: v.optional(v.string()),
    domain: v.optional(v.string()),
    isVerified: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_business", ["businessId"]),

  locations: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    timezone: v.optional(v.string()),
    isActive: v.boolean(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_business", ["businessId"]),

  playbookExecutions: defineTable({
    businessId: v.id("businesses"),
    playbookId: v.id("playbooks"),
    agentId: v.optional(v.id("aiAgents")),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed")
    ),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    result: v.optional(v.any()),
    error: v.optional(v.string()),
  })
    .index("by_business", ["businessId"])
    .index("by_playbook", ["playbookId"]),

  playbooks: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    trigger: v.string(),
    steps: v.array(v.any()),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_business", ["businessId"]),

  customDomains: defineTable({
    businessId: v.id("businesses"),
    domain: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("verified"),
      v.literal("active"),
      v.literal("failed")
    ),
    sslEnabled: v.boolean(),
    verificationToken: v.optional(v.string()),
    verifiedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_domain", ["domain"]),

  contactLists: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    contactCount: v.number(),
    tags: v.optional(v.array(v.string())),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_business", ["businessId"]),

  emailDrafts: defineTable({
    businessId: v.id("businesses"),
    subject: v.string(),
    content: v.string(),
    recipientListId: v.optional(v.id("contactLists")),
    status: v.union(v.literal("draft"), v.literal("scheduled"), v.literal("sent")),
    scheduledFor: v.optional(v.number()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"]),

  socialPosts: defineTable({
    businessId: v.id("businesses"),
    platform: v.union(
      v.literal("twitter"),
      v.literal("linkedin"),
      v.literal("facebook"),
      v.literal("instagram")
    ),
    content: v.string(),
    mediaUrls: v.optional(v.array(v.string())),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("published"),
      v.literal("failed"),
      v.literal("posted")
    ),
    scheduledFor: v.optional(v.number()),
    scheduledAt: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
    externalId: v.optional(v.string()),
    likes: v.optional(v.number()),
    comments: v.optional(v.number()),
    shares: v.optional(v.number()),
    reach: v.optional(v.number()),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"]),

  emails: defineTable({
    businessId: v.id("businesses"),
    campaignId: v.optional(v.id("emailCampaigns")),
    recipientEmail: v.string(),
    subject: v.string(),
    content: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("opened"),
      v.literal("clicked"),
      v.literal("bounced"),
      v.literal("failed")
    ),
    sentAt: v.optional(v.number()),
    openedAt: v.optional(v.number()),
    clickedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_campaign", ["campaignId"])
    .index("by_status", ["status"]),

  voiceNotes: defineTable({
    businessId: v.id("businesses"),
    userId: v.id("users"),
    storageId: v.string(),
    transcription: v.optional(v.string()),
    summary: v.optional(v.string()),
    title: v.optional(v.string()),
    duration: v.optional(v.number()),
    status: v.union(
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("transcribed")
    ),
    tags: v.optional(v.array(v.string())),
    initiativeId: v.optional(v.id("initiatives")),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_user", ["userId"]),

  templatePins: defineTable({
    userId: v.id("users"),
    templateId: v.id("workflowTemplates"),
    pinnedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_template", ["templateId"]),

  learningCourses: defineTable({
    businessId: v.optional(v.id("businesses")),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
    duration: v.number(),
    modules: v.array(v.any()),
    isPublished: v.boolean(),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_category", ["category"]),

  trainingSessions: defineTable({
    businessId: v.id("businesses"),
    courseId: v.optional(v.id("learningCourses")),
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    scheduledAt: v.number(),
    duration: v.number(),
    status: v.union(
      v.literal("scheduled"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    attendees: v.array(v.id("users")),
    materials: v.optional(v.array(v.any())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_user", ["userId"])
    .index("by_course", ["courseId"]),
};