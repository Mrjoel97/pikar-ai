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
    const redirectUri = args.callbackUrl;

    if (!clientId) {
      throw new Error("Google Calendar API credentials not configured");
    }

    const scope = [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/calendar.events",
    ].join(" ");

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${args.businessId}`;

    return { authUrl };
  },
});

/**
 * Exchange OAuth code for access tokens
 */
export const exchangeGoogleCalendarCode = action({
  args: {
    code: v.string(),
    businessId: v.id("businesses"),
    callbackUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return { success: false, error: "Google Calendar API credentials not configured" };
    }

    try {
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: args.code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: args.callbackUrl,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        return { success: false, error: `Token exchange failed: ${error}` };
      }

      const tokenData = await tokenResponse.json();

      return {
        success: true,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: Date.now() + (tokenData.expires_in * 1000),
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});

/**
 * Sync events from Google Calendar
 */
export const syncGoogleCalendarEvents = action({
  args: {
    businessId: v.id("businesses"),
    calendarIntegrationId: v.id("calendarIntegrations"),
  },
  handler: async (ctx, args) => {
    // Get integration credentials
    const integration = await ctx.runQuery(internal.calendar.googleCalendar.getIntegration, {
      integrationId: args.calendarIntegrationId,
    });

    if (!integration || !integration.accessToken) {
      throw new Error("Calendar integration not found or not connected");
    }

    try {
      // Fetch events from Google Calendar API
      const now = new Date();
      const timeMin = now.toISOString();
      const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        `timeMin=${encodeURIComponent(timeMin)}&` +
        `timeMax=${encodeURIComponent(timeMax)}&` +
        `singleEvents=true&` +
        `orderBy=startTime`,
        {
          headers: {
            Authorization: `Bearer ${integration.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch calendar events: ${response.statusText}`);
      }

      const data = await response.json();
      const events = data.items || [];

      // Sync events to database
      for (const event of events) {
        const startTime = event.start.dateTime 
          ? new Date(event.start.dateTime).getTime()
          : new Date(event.start.date).getTime();
        
        const endTime = event.end.dateTime
          ? new Date(event.end.dateTime).getTime()
          : new Date(event.end.date).getTime();

        await ctx.runMutation(internal.scheduling.availability.createAppointment, {
          businessId: args.businessId,
          title: event.summary || "Untitled Event",
          description: event.description,
          startTime,
          endTime,
          location: event.location,
          type: "google_calendar",
          attendees: event.attendees?.map((a: any) => a.email) || [],
        });
      }

      // Update last sync timestamp
      await ctx.runMutation(internal.calendar.googleCalendar.updateLastSync, {
        integrationId: args.calendarIntegrationId,
        timestamp: Date.now(),
      });

      return { success: true, syncedEvents: events.length };
    } catch (error: any) {
      console.error("Google Calendar sync error:", error);
      return { success: false, error: error.message };
    }
  },
});

/**
 * Create event in Google Calendar
 */
export const createGoogleCalendarEvent = action({
  args: {
    calendarIntegrationId: v.id("calendarIntegrations"),
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    attendees: v.optional(v.array(v.string())),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const integration = await ctx.runQuery(internal.calendar.googleCalendar.getIntegration, {
      integrationId: args.calendarIntegrationId,
    });

    if (!integration || !integration.accessToken) {
      throw new Error("Calendar integration not found");
    }

    const event = {
      summary: args.title,
      description: args.description,
      location: args.location,
      start: {
        dateTime: new Date(args.startTime).toISOString(),
        timeZone: "UTC",
      },
      end: {
        dateTime: new Date(args.endTime).toISOString(),
        timeZone: "UTC",
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
      throw new Error(`Failed to create event: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, eventId: data.id };
  },
});
