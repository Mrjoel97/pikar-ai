import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { query } from "./_generated/server";

// Initialize default feature flags for the platform enhancement MVP
export const initializeFeatureFlags = internalMutation({
  args: {},
  handler: async (ctx) => {
    const defaultFlags = [
      {
        flagName: "workflow_assignments",
        isEnabled: false,
        rolloutPercentage: 0,
        description: "Enable workflow step assignments and due dates"
      },
      {
        flagName: "template_gallery_filters",
        isEnabled: false,
        rolloutPercentage: 0,
        description: "Enable advanced template filtering and recommendations"
      },
      {
        flagName: "email_designer",
        isEnabled: false,
        rolloutPercentage: 0,
        description: "Enable email campaign designer and scheduler"
      },
      {
        flagName: "seo_suggestions",
        isEnabled: false,
        rolloutPercentage: 0,
        description: "Enable SEO suggestion widget"
      },
      {
        flagName: "dashboard_creator",
        isEnabled: false,
        rolloutPercentage: 0,
        description: "Enable custom dashboard creation"
      },
      {
        flagName: "export_reports",
        isEnabled: false,
        rolloutPercentage: 0,
        description: "Enable report export and scheduling"
      },
      {
        flagName: "capa_board",
        isEnabled: false,
        rolloutPercentage: 0,
        description: "Enable CAPA status board"
      },
      {
        flagName: "risk_register",
        isEnabled: false,
        rolloutPercentage: 0,
        description: "Enable risk register management"
      },
      {
        flagName: "oauth_integrations",
        isEnabled: false,
        rolloutPercentage: 0,
        description: "Enable OAuth integration management"
      },
      {
        flagName: "sso_placeholder",
        isEnabled: false,
        rolloutPercentage: 0,
        description: "Enable SSO configuration placeholder"
      },
      {
        flagName: "enhanced_onboarding",
        isEnabled: false,
        rolloutPercentage: 0,
        description: "Enable enhanced onboarding wizard"
      },
      {
        flagName: "contextual_tips",
        isEnabled: false,
        rolloutPercentage: 0,
        description: "Enable contextual tips and help system"
      }
    ];

    const createdFlags: string[] = [];

    for (const flag of defaultFlags) {
      // Fix: don't compare to undefined or store undefined fields; just check by flagName
      const existingFlag = await ctx.db
        .query("featureFlags")
        .withIndex("by_flag_name", (q) => q.eq("flagName", flag.flagName))
        .first();

      if (!existingFlag) {
        await ctx.db.insert("featureFlags", {
          flagName: flag.flagName,
          isEnabled: flag.isEnabled,
          rolloutPercentage: flag.rolloutPercentage,
        } as any);
        createdFlags.push(flag.flagName);
      }
    }

    return {
      message: "Feature flags initialized",
      createdFlags,
      totalFlags: defaultFlags.length,
    };
  },
});

// Initialize default notification preferences for existing users
export const initializeNotificationPreferences = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const businesses = await ctx.db.query("businesses").collect();
    
    const createdPreferences = [];
    
    for (const user of users) {
      // Find user's business
      const userBusiness = businesses.find(b => 
        b.ownerId === user._id || b.teamMembers.includes(user._id)
      );
      
      if (userBusiness) {
        // Check if preferences already exist
        const existingPrefs = await ctx.db
          .query("notificationPreferences")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .first();

        if (!existingPrefs) {
          await ctx.db.insert("notificationPreferences", {
            userId: user._id,
            businessId: userBusiness._id,
            emailEnabled: true,
            pushEnabled: true,
            smsEnabled: false,
            preferences: {
              assignments: true,
              approvals: true,
              slaWarnings: true,
              integrationErrors: true,
              workflowCompletions: true,
              systemAlerts: true,
            },
            rateLimits: {
              maxPerHour: 10,
              maxPerDay: 50,
            },
            updatedAt: Date.now(),
          });
          createdPreferences.push(user._id);
        }
      }
    }

    return {
      message: "Notification preferences initialized",
      createdPreferences: createdPreferences.length,
      totalUsers: users.length,
    };
  },
});

// Clean up old telemetry events (keep last 90 days)
export const cleanupOldTelemetryEvents = internalMutation({
  args: {},
  handler: async (ctx) => {
    const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
    
    const oldEvents = await ctx.db
      .query("telemetryEvents")
      .withIndex("by_timestamp", (q) => q.lt("timestamp", ninetyDaysAgo))
      .collect();

    for (const event of oldEvents) {
      await ctx.db.delete(event._id);
    }

    return {
      message: "Old telemetry events cleaned up",
      deletedEvents: oldEvents.length,
    };
  },
});

// Add: Environment status query to verify required config/secrets
export const getEnvStatus = query({
  args: {},
  handler: async () => {
    const hasResend =
      typeof process.env.RESEND_API_KEY === "string" &&
      process.env.RESEND_API_KEY.trim().length > 0;

    const hasSalesInbox =
      typeof process.env.SALES_INBOX === "string" &&
      process.env.SALES_INBOX.trim().length > 0;

    const hasPublicBaseUrl =
      typeof process.env.VITE_PUBLIC_BASE_URL === "string" &&
      process.env.VITE_PUBLIC_BASE_URL.trim().length > 0;

    const devSafeRaw = String(process.env.DEV_SAFE_EMAILS ?? "").toLowerCase();
    const devSafeEmails = devSafeRaw === "true" || devSafeRaw === "1";

    // Surface concise server logs to help diagnostics without leaking secrets
    if (!hasResend) console.warn("[config] RESEND_API_KEY is missing");
    if (!hasSalesInbox) console.warn("[config] SALES_INBOX is missing");
    if (!hasPublicBaseUrl) console.warn("[config] VITE_PUBLIC_BASE_URL is missing");
    if (devSafeEmails) console.info("[config] DEV_SAFE_EMAILS enabled (email sends stubbed in dev)");

    return {
      hasResend,
      hasSalesInbox,
      hasPublicBaseUrl,
      devSafeEmails,
    };
  },
});