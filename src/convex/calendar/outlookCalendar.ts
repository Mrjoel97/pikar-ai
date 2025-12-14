"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";

/**
 * Initiate Outlook Calendar OAuth flow
 */
export const initiateOutlookCalendarOAuth = action({
  args: {
    businessId: v.id("businesses"),
    callbackUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    if (!clientId) {
      throw new Error("[ERR_OUTLOOK_NOT_CONFIGURED] Outlook Calendar integration not configured");
    }

    const scopes = [
      "Calendars.ReadWrite",
      "Calendars.Read",
      "offline_access",
    ].join(" ");

    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(args.callbackUrl)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `response_mode=query&` +
      `state=${args.businessId}`;

    return { authUrl };
  },
});

/**
 * Complete Outlook Calendar OAuth and store tokens
 */
export const completeOutlookCalendarOAuth = action({
  args: {
    businessId: v.id("businesses"),
    userId: v.id("users"),
    code: v.string(),
    redirectUri: v.string(),
  },
  handler: async (ctx, args) => {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("[ERR_OUTLOOK_NOT_CONFIGURED] Outlook Calendar credentials not configured");
    }

    try {
      // Exchange code for tokens
      const tokenResponse = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: args.code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: args.redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error("Failed to exchange authorization code");
      }

      const tokens = await tokenResponse.json();

      // Store integration
      await ctx.runMutation(internal.calendar.calendarIntegrations.storeIntegration, {
        businessId: args.businessId,
        userId: args.userId,
        provider: "outlook",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: Date.now() + tokens.expires_in * 1000,
      });

      return { success: true };
    } catch (error: any) {
      console.error("[OUTLOOK_CALENDAR] OAuth error:", error);
      throw new Error(`Failed to connect Outlook Calendar: ${error.message}`);
    }
  },
});

/**
 * Sync events from Outlook Calendar
 */
export const syncOutlookEvents = action({
  args: {
    integrationId: v.id("calendarIntegrations"),
  },
  handler: async (ctx, args) => {
    const integration: any = await ctx.runQuery(internal.calendar.calendarIntegrations.getIntegration, {
      integrationId: args.integrationId,
    });

    if (!integration || integration.provider !== "outlook") {
      throw new Error("[ERR_INTEGRATION_NOT_FOUND] Outlook Calendar integration not found");
    }

    try {
      // Fetch events from Microsoft Graph API
      const startDateTime = new Date().toISOString();
      const endDateTime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

      const response: any = await fetch(
        `https://graph.microsoft.com/v1.0/me/calendar/calendarView?` +
        `startDateTime=${startDateTime}&` +
        `endDateTime=${endDateTime}&` +
        `$top=100&` +
        `$orderby=start/dateTime`,
        {
          headers: {
            Authorization: `Bearer ${integration.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Outlook Calendar events");
      }

      const data: any = await response.json();

      // Store events as appointments
      for (const event of data.value || []) {
        if (event.start?.dateTime && event.end?.dateTime) {
          await ctx.runMutation(internal.calendar.calendarIntegrations.createAppointmentFromSync, {
            businessId: integration.businessId,
            title: event.subject || "Untitled Event",
            description: event.bodyPreview,
            startTime: new Date(event.start.dateTime).getTime(),
            endTime: new Date(event.end.dateTime).getTime(),
            attendees: event.attendees?.map((a: any) => a.emailAddress?.address).filter(Boolean) || [],
            location: event.location?.displayName,
            type: "outlook_calendar",
          });
        }
      }

      // Update last sync time
      await ctx.runMutation(internal.calendar.calendarIntegrations.updateLastSync, {
        integrationId: args.integrationId,
      });

      return { success: true, eventCount: data.value?.length || 0 };
    } catch (error: any) {
      console.error("[OUTLOOK_CALENDAR] Sync error:", error);
      throw new Error(`Failed to sync Outlook Calendar: ${error.message}`);
    }
  },
});

/**
 * Create event in Outlook Calendar
 */
export const createOutlookEvent = action({
  args: {
    integrationId: v.id("calendarIntegrations"),
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    attendees: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const integration: any = await ctx.runQuery(internal.calendar.calendarIntegrations.getIntegration, {
      integrationId: args.integrationId,
    });

    if (!integration || integration.provider !== "outlook") {
      throw new Error("[ERR_INTEGRATION_NOT_FOUND] Outlook Calendar integration not found");
    }

    try {
      const event = {
        subject: args.title,
        body: {
          contentType: "Text",
          content: args.description || "",
        },
        start: {
          dateTime: new Date(args.startTime).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: new Date(args.endTime).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        attendees: args.attendees?.map(email => ({
          emailAddress: { address: email },
          type: "required",
        })),
      };

      const response: any = await fetch(
        "https://graph.microsoft.com/v1.0/me/calendar/events",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${integration.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create Outlook Calendar event");
      }

      const createdEvent: any = await response.json();
      return { success: true, eventId: createdEvent.id };
    } catch (error: any) {
      console.error("[OUTLOOK_CALENDAR] Create event error:", error);
      throw new Error(`Failed to create Outlook Calendar event: ${error.message}`);
    }
  },
});