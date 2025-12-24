import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";

export const unsubscribe = httpAction(async (ctx: any, req) => {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const email = url.searchParams.get("email"); // optional

    if (!token) {
      return new Response("Missing required parameters.", { status: 400, headers: { "content-type": "text/html" } });
    }

    await ctx.runMutation(internal.emails.setUnsubscribeActive, {
      token,
    });

    return new Response(
      `<html><body style="font-family:Arial,sans-serif;padding:24px;"><h2>You're unsubscribed</h2><p>You will no longer receive emails${email ? ` at <strong>${email}</strong>` : ""}.</p></body></html>`,
      { status: 200, headers: { "content-type": "text/html" } }
    );
  } catch {
    return new Response("Server error.", { status: 500, headers: { "content-type": "text/html" } });
  }
});

export const sweepScheduledCampaigns = httpAction(async (ctx: any, req) => {
  try {
    // Parse optional limit from body or query string
    let limit = 25;
    try {
      const url = new URL(req.url);
      const qsLimit = url.searchParams.get("limit");
      if (qsLimit) limit = Math.max(1, Math.min(100, Number(qsLimit)));
    } catch {
      // ignore
    }
    try {
      const body = await req.json().catch(() => null);
      if (body && typeof body.limit === "number") {
        limit = Math.max(1, Math.min(100, Number(body.limit)));
      }
    } catch {
      // ignore body parse errors, default limit applies
    }

    // Reserve campaigns atomically to avoid duplicate pickups
    const reservedIds = await ctx.runMutation(internal.emails.reserveDueScheduledCampaigns, {});
    const slice = reservedIds.slice(0, limit);

    let scheduled = 0;
    for (const campaignId of slice) {
      try {
        await ctx.scheduler.runAfter(
          0,
          internal.emailsActions.sendCampaignInternal,
          { campaignId }
        );
        scheduled++;
      } catch {
        // If scheduling fails for a single campaign, continue others
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        reserved: reservedIds.length,
        scheduled,
        processedIds: slice.map((id: unknown) => String(id)),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e?.message || "Failed to sweep scheduled campaigns" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

export const trackOpen = httpAction(async (ctx: any, req) => {
  try {
    const url = new URL(req.url);
    const c = url.searchParams.get("c"); // campaign id (emailCampaigns)
    const e = url.searchParams.get("e"); // base64 recipient email
    if (c && e) {
      const recipientEmail = Buffer.from(e, "base64").toString("utf8");
      // Record open (best-effort; don't block pixel)
      await ctx.runMutation("emailTracking:recordEmailEvent" as any, {
        campaignId: c,
        recipientEmail,
        eventType: "opened",
        metadata: {
          userAgent: req.headers.get("user-agent"),
        },
      });
    }

    // Transparent 1x1 GIF
    const pixel = Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      "base64"
    );
    return new Response(pixel, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (err) {
    // Always return a pixel
    const pixel = Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      "base64"
    );
    return new Response(pixel, { status: 200, headers: { "Content-Type": "image/gif" } });
  }
});

export const trackClick = httpAction(async (ctx: any, req) => {
  try {
    const url = new URL(req.url);
    const c = url.searchParams.get("c"); // campaign id (emailCampaigns)
    const e = url.searchParams.get("e"); // base64 recipient email
    const u = url.searchParams.get("u"); // target URL
    if (c && e && u) {
      const recipientEmail = Buffer.from(e, "base64").toString("utf8");
      await ctx.runMutation("emailTracking:recordEmailEvent" as any, {
        campaignId: c,
        recipientEmail,
        eventType: "clicked",
        metadata: {
          targetUrl: u,
          userAgent: req.headers.get("user-agent"),
        },
      });
    }

    // Redirect to target
    return new Response(null, {
      status: 302,
      headers: { Location: u || "/" },
    });
  } catch {
    return new Response(null, { status: 302, headers: { Location: "/" } });
  }
});

export const resendWebhook = httpAction(async (ctx: any, req) => {
  try {
    const body = await req.json();
    const event = body?.type;
    const data = body?.data;

    // Expect campaign id in tags: [{ name: "campaign_id", value: "<id>" }]
    const tags: Array<{ name: string; value: string }> = data?.tags || [];
    const campaignTag = tags.find((t) => t.name === "campaign_id");
    const campaignId = campaignTag?.value;
    const recipientEmail: string | undefined = data?.to?.[0] || data?.email;

    if (!campaignId || !recipientEmail) {
      // Accept but ignore if missing identifiers
      return new Response(JSON.stringify({ received: true, ignored: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Map Resend events -> our normalized events
    const mapped =
      event === "email.delivered"
        ? "sent"
        : event === "email.bounced"
          ? "bounced"
          : event === "email.opened"
            ? "opened"
            : event === "email.clicked"
              ? "clicked"
              : null;

    if (mapped) {
      await ctx.runMutation("emailTracking:recordEmailEvent" as any, {
        campaignId,
        recipientEmail,
        eventType: mapped,
        metadata: {
          resendEvent: event,
          resendId: data?.id,
        },
      });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "webhook_error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
