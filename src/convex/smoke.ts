"use node";

import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { INDUSTRIES } from "./data/playbooksSeed";

type HttpTrigger = { type: string; path?: string; method?: string };

export const smokeRunHttpAllIndustries = action({
  args: {},
  handler: async (ctx) => {
    // Use configured public base URL; fall back keys if present
    const base =
      process.env.VITE_PUBLIC_BASE_URL ||
      process.env.PUBLIC_BASE_URL ||
      "";

    if (!base) {
      return {
        summary: { total: 0, ok: 0, failed: 0, base },
        results: [],
        error: "Missing public base URL (VITE_PUBLIC_BASE_URL or PUBLIC_BASE_URL).",
      };
    }

    const results: Array<{
      industry: string;
      playbook_key?: string;
      url?: string;
      ok?: boolean;
      status?: number;
      error?: string;
      note?: string;
    }> = [];

    for (const { key } of INDUSTRIES) {
      // Admin-gated list with filter; safe because caller is admin
      const list = await ctx.runQuery(api.playbooks.adminListPlaybooksByIndustry, {
        industry: key,
        limit: 50,
      });

      // Pick an active playbook that has an http trigger
      const withHttp = list.find((p: any) => {
        if (!p?.active || !Array.isArray(p?.triggers)) return false;
        return p.triggers.some(
          (t: HttpTrigger) => t?.type === "http" && typeof t?.path === "string"
        );
      });

      if (!withHttp) {
        results.push({
          industry: key,
          ok: false,
          error: "No active playbook with http trigger found",
        });
        continue;
      }

      const trig: HttpTrigger | undefined = withHttp.triggers.find(
        (t: HttpTrigger) => t?.type === "http" && typeof t?.path === "string"
      );

      if (!trig?.path) {
        results.push({
          industry: key,
          playbook_key: withHttp.playbook_key,
          ok: false,
          error: "Trigger path missing on http trigger",
        });
        continue;
      }

      const url = `${base}${trig.path}`;

      try {
        const resp = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          // Minimal smoke payload; handlers can ignore or treat as test
          body: JSON.stringify({
            smoke: true,
            industry: key,
            playbook_key: withHttp.playbook_key,
          }),
        });

        results.push({
          industry: key,
          playbook_key: withHttp.playbook_key,
          url,
          ok: resp.ok,
          status: resp.status,
        });
      } catch (err: any) {
        results.push({
          industry: key,
          playbook_key: withHttp.playbook_key,
          url,
          ok: false,
          error: String(err?.message ?? err),
        });
      }
    }

    const summary = {
      total: results.length,
      ok: results.filter((r) => r.ok).length,
      failed: results.filter((r) => r.ok === false).length,
      base,
    };

    return { summary, results };
  },
});
