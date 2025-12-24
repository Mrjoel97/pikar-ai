import { defineTable } from "convex/server";
import { v } from "convex/values";

export const miscellaneousSchema = {
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

  workflowTemplates: defineTable({
    businessId: v.optional(v.id("businesses")),
    name: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    steps: v.array(v.any()),
    createdBy: v.optional(v.id("users")),
    createdAt: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    tier: v.optional(v.string()),
    industryTags: v.optional(v.array(v.string())),
    recommendedAgents: v.optional(v.array(v.string())),
  })
    .index("by_business", ["businessId"])
    .index("by_name", ["name"]),

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

  audit_logs: defineTable({
    businessId: v.id("businesses"),
    userId: v.optional(v.id("users")),
    action: v.string(),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    details: v.optional(v.any()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    timestamp: v.optional(v.number()),
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
    .index("by_business", ["businessId"])
    .index("by_parent", ["parentMessageId"]),

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
    .index("by_user", ["userId"])
    .index("by_initiative", ["initiativeId"]),

  templatePins: defineTable({
    userId: v.id("users"),
    templateId: v.id("workflowTemplates"),
    pinnedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_template", ["templateId"])
    .index("by_user_and_template", ["userId", "templateId"]),

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
    availableTiers: v.optional(v.array(v.string())),
    totalLessons: v.optional(v.number()),
    quizScores: v.optional(v.any()),
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
