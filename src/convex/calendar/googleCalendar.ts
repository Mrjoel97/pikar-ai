"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";

/**
 * Initiate Google Calendar OAuth flow
 */
export const initiateGoogleCalendarOAuth = action({
  args: {
    businessId: v.id("businesses"),
    callbackUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error("[ERR_GOOGLE_NOT_CONFIGURED] Google Calendar integration not configured");
    }

    const scopes = [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/calendar.events",
    ].join(" ");

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(args.callbackUrl)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${args.businessId}`;

    return { authUrl };
  },
});

/**
 * Complete Google Calendar OAuth and store tokens
 */
export const completeGoogleCalendarOAuth = action({
  args: {
    businessId: v.id("businesses"),
    userId: v.id("users"),
    code: v.string(),
    redirectUri: v.string(),
  },
  handler: async (ctx, args) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("[ERR_GOOGLE_NOT_CONFIGURED] Google Calendar credentials not configured");
    }

    try {
      // Exchange code for tokens
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
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
        provider: "google",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: Date.now() + tokens.expires_in * 1000,
      });

      return { success: true };
    } catch (error: any) {
      console.error("[GOOGLE_CALENDAR] OAuth error:", error);
      throw new Error(`Failed to connect Google Calendar: ${error.message}`);
    }
  },
});

/**
 * Sync events from Google Calendar
 */
export const syncGoogleEvents = action({
  args: {
    integrationId: v.id("calendarIntegrations"),
  },
  handler: async (ctx, args) => {
    const integration = await ctx.runQuery(internal.calendar.calendarIntegrations.getIntegration, {
      integrationId: args.integrationId,
    });

    if (!integration || integration.provider !== "google") {
      throw new Error("[ERR_INTEGRATION_NOT_FOUND] Google Calendar integration not found");
    }

    try {
      // Fetch events from Google Calendar API
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        `timeMin=${new Date().toISOString()}&` +
        `maxResults=100&` +
        `singleEvents=true&` +
        `orderBy=startTime`,
        {
          headers: {
            Authorization: `Bearer ${integration.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Google Calendar events");
      }

      const data = await response.json();

      // Store events as appointments
      for (const event of data.items || []) {
        if (event.start?.dateTime && event.end?.dateTime) {
          await ctx.runMutation(internal.calendar.calendarIntegrations.createAppointmentFromSync, {
            businessId: integration.businessId,
            title: event.summary || "Untitled Event",
            description: event.description,
            startTime: new Date(event.start.dateTime).getTime(),
            endTime: new Date(event.end.dateTime).getTime(),
            attendees: event.attendees?.map((a: any) => a.email) || [],
            location: event.location,
            type: "google_calendar",
          });
        }
      }

      // Update last sync time
      await ctx.runMutation(internal.calendar.calendarIntegrations.updateLastSync, {
        integrationId: args.integrationId,
      });

      return { success: true, eventCount: data.items?.length || 0 };
    } catch (error: any) {
      console.error("[GOOGLE_CALENDAR] Sync error:", error);
      throw new Error(`Failed to sync Google Calendar: ${error.message}`);
    }
  },
});

/**
 * Create event in Google Calendar
 */
export const createGoogleEvent = action({
  args: {
    integrationId: v.id("calendarIntegrations"),
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    attendees: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const integration = await ctx.runQuery(internal.calendar.calendarIntegrations.getIntegration, {
      integrationId: args.integrationId,
    });

    if (!integration || integration.provider !== "google") {
      throw new Error("[ERR_INTEGRATION_NOT_FOUND] Google Calendar integration not found");
    }

    try {
      const event = {
        summary: args.title,
        description: args.description,
        start: {
          dateTime: new Date(args.startTime).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: new Date(args.endTime).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        attendees: args.attendees?.map(email => ({ email })),
      };

      const response = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
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
        throw new Error("Failed to create Google Calendar event");
      }

      const createdEvent = await response.json();
      return { success: true, eventId: createdEvent.id };
    } catch (error: any) {
      console.error("[GOOGLE_CALENDAR] Create event error:", error);
      throw new Error(`Failed to create Google Calendar event: ${error.message}`);
    }
  },
});