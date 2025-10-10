import type { Id } from "@/convex/_generated/dataModel";

// ============================================================================
// Core Business & User Types
// ============================================================================

export interface Business {
  _id: Id<"businesses">;
  _creationTime: number;
  name: string;
  industry?: string;
  size?: string;
  website?: string;
  goals?: string[];
  ownerId: Id<"users">;
  settings?: BusinessSettings;
  teamMembers?: string[];
}

export interface BusinessSettings {
  plan?: "solopreneur" | "startup" | "sme" | "enterprise";
  status?: "active" | "trial" | "inactive" | "cancelled";
  trialStart?: number;
  trialEnd?: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  fromEmail?: string;
  fromName?: string;
  replyTo?: string;
  resendApiKey?: string;
}

// ============================================================================
// Agent Types
// ============================================================================

export interface Agent {
  id: string;
  name: string;
  status: string;
  tasksCompleted: number;
  efficiency: number;
}

// ============================================================================
// Workflow Types
// ============================================================================

export interface Workflow {
  id: string;
  name: string;
  status: string;
  completionRate: number;
}

// ============================================================================
// KPI Types
// ============================================================================

export interface KPIData {
  totalRevenue: number;
  activeCustomers: number;
  conversionRate: number;
  taskCompletion: number;
  teamProductivity?: number;
  customerSatisfaction?: number;
  complianceScore?: number;
  departmentEfficiency?: number;
  riskScore?: number;
  globalEfficiency?: number;
  innovationIndex?: number;
}

// ============================================================================
// Task Types
// ============================================================================

export interface Task {
  id: string;
  title: string;
  priority: string; // Changed from union type to string for flexibility with demo data
  dueDate: string;
}

// ============================================================================
// Notification Types
// ============================================================================

export interface Notification {
  id: string;
  message: string;
  type: string; // Changed from union type to string for flexibility with demo data
}

// ============================================================================
// Social Media Types
// ============================================================================

export interface SocialPost {
  id: string;
  content: string;
  platforms: string[]; // Changed from union array to string array for flexibility
  status: string; // Changed from union type to string for flexibility
  scheduledAt: number;
  postedAt?: number;
  aiGenerated: boolean;
  approvalStatus?: string; // Changed from union type to string for flexibility
  performanceMetrics?: SocialPerformanceMetrics;
}

export interface SocialPerformanceMetrics {
  impressions: number;
  engagements: number;
  likes: number;
  shares: number;
  comments: number;
  clicks: number;
}

export interface ScheduledPost {
  id: string;
  content: string;
  platforms: string[]; // Changed from union array to string array for flexibility
  scheduledAt: number;
  status: string; // Changed from union type to string for flexibility
  approvalStatus?: string; // Changed from union type to string for flexibility
}

export interface SocialAnalytics {
  totalPosts: number;
  totalEngagement: number;
  avgEngagementRate: number;
  totalReach: number;
  platformBreakdown: {
    twitter?: PlatformMetrics;
    linkedin?: PlatformMetrics;
    facebook?: PlatformMetrics;
  };
  topPost: {
    content: string;
    engagement: number;
    platform: string;
  };
}

export interface PlatformMetrics {
  posts: number;
  engagement: number;
  reach: number;
}

export interface ConnectedAccount {
  platform: string; // Changed from union type to string for flexibility
  username: string;
  connected: boolean;
  health: string; // Changed from union type to string for flexibility
}

// ============================================================================
// Demo Data Types
// ============================================================================

export interface DemoData {
  agents: Agent[];
  workflows: Workflow[];
  kpis: KPIData;
  tasks: Task[];
  notifications: Notification[];
  socialPosts: SocialPost[];
  scheduledPosts: ScheduledPost[];
  socialAnalytics: SocialAnalytics;
  connectedAccounts: ConnectedAccount[];
}

// ============================================================================
// Dashboard Props Types
// ============================================================================

export interface BaseDashboardProps {
  business: any;
  demoData: DemoData | null;
  isGuest: boolean;
  tier: string;
  onUpgrade: () => void;
}

export interface SolopreneurDashboardProps extends BaseDashboardProps {
  tier: string;
}

export interface StartupDashboardProps extends BaseDashboardProps {
  tier: string;
}

export interface SmeDashboardProps extends BaseDashboardProps {
  tier: string;
}

export interface EnterpriseDashboardProps extends BaseDashboardProps {
  tier: string;
}

// ============================================================================
// Query Result Types
// ============================================================================

export interface ApprovalQueueItem {
  _id: string;
  _creationTime: number;
  businessId: string;
  workflowId?: string;
  status: "pending" | "approved" | "rejected";
  priority: "low" | "medium" | "high";
  requestedBy: string;
  title: string;
  description?: string;
  dueDate?: number;
}

export interface AuditLogItem {
  _id: string;
  _creationTime: number;
  businessId: string;
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
}

export interface CampaignItem {
  _id: string;
  _creationTime: number;
  businessId: string;
  name: string;
  subject: string;
  body: string;
  status: "draft" | "scheduled" | "sent" | "failed";
  scheduledAt?: number;
  sentAt?: number;
  recipientCount?: number;
}

export interface Approval {
  _id: string;
  title: string;
  requester?: string;
  dueDate?: string;
  status: string;
}

export interface Campaign {
  _id: string;
  subject: string;
  fromEmail: string;
  fromName?: string;
  status: string;
  audienceType?: string;
  recipients?: string[];
  scheduledAt?: number;
  createdAt?: number;
}

// ============================================================================
// Component State Types
// ============================================================================

export interface TemplateItem {
  id: string;
  name: string;
  description: string;
  category: string;
  tier: "solopreneur" | "startup" | "sme" | "enterprise";
  isPinned?: boolean;
  usageCount?: number;
  lastUsed?: number;
}

export interface BrainDumpItem {
  _id: string;
  _creationTime: number;
  initiativeId: string;
  content: string;
  tags?: string[];
  summary?: string;
  status?: "active" | "archived" | "deleted";
}

export interface BrainDump {
  _id: string;
  content: string;
  createdAt: number;
}

export interface ScheduleSlot {
  _id: string;
  channel: string;
  scheduledAt: number;
  status: "available" | "booked" | "cancelled";
  reasoning?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

export type TierType = "solopreneur" | "startup" | "sme" | "enterprise";

export type DashboardSection = 
  | "today_focus"
  | "performance_snapshot"
  | "quick_actions"
  | "recent_activity"
  | "team_performance"
  | "growth_metrics"
  | "active_initiatives"
  | "approvals_tray"
  | "governance_panel"
  | "pending_approvals"
  | "department_tabs"
  | "compliance_summary"
  | "global_overview"
  | "strategic_initiatives"
  | "telemetry_summary"
  | "command_widgets";

export interface FeatureFlag {
  enabled: boolean;
  rolloutPercentage?: number;
  tenantIds?: string[];
}