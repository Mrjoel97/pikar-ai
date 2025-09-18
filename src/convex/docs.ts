import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Helper to make a slug from a title
function toSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}

// List pending/approved/rejected proposals (most recent first)
export const listProposals = query({
  args: {},
  handler: async (ctx) => {
    const proposals = await ctx.db.query("docsProposals").order("desc").take(200);
    return proposals;
  },
});

// List published docs pages (most recent first)
export const listPages = query({
  args: {},
  handler: async (ctx) => {
    const pages = await ctx.db.query("docsPages").order("desc").take(200);
    return pages;
  },
});

// Add URL-based proposal generation action
export const generateFromUrl = action({
  args: { url: v.string() },
  handler: async (ctx, args): Promise<{ proposalId: Id<"docsProposals"> }> => {
    // Basic fetch and parsing; future improvements can add markdown/HTML normalization
    let content = "";
    try {
      const res = await fetch(args.url, { method: "GET" });
      content = await res.text();
    } catch (e) {
      throw new Error("Failed to fetch content from URL");
    }

    const contentMarkdown = String(content || "").slice(0, 80_000);
    // Try to extract a title from first H1, fallback to URL last segment or a default
    const h1Match = contentMarkdown.match(/^#\s+(.+)$/m);
    const fromUrl = (() => {
      try {
        const u = new URL(args.url);
        const last = u.pathname.split("/").filter(Boolean).pop() || u.hostname;
        return last.replace(/[-_]/g, " ");
      } catch {
        return "External Source";
      }
    })();
    const title = (h1Match?.[1] || fromUrl || "Imported Page").trim();
    const slug = toSlug(title || "imported");

    const diffPreview =
      `+++ /docs/${slug}.md\n` +
      `+ Title: ${title}\n` +
      `+ Slug: /${slug}\n` +
      `+ Source: ${args.url}\n` +
      `+ Adds page imported from external URL\n`;

    const proposalId: Id<"docsProposals"> = await ctx.runMutation(
      internal.docsInternal.createProposal,
      {
        title,
        slug,
        contentMarkdown,
        source: args.url,
        diffPreview,
      }
    );

    return { proposalId };
  },
});

// Generate a docs proposal from a simple internal seed
export const generateFromSeed = action({
  args: { source: v.string() },
  handler: async (ctx, args): Promise<{ proposalId: Id<"docsProposals"> }> => {
    // Minimal seed scaffolding; in future can scrape/ingest additional sources
    const title = "Pikar AI – Overview";
    const slug = "overview";
    const contentMarkdown =
      "# Pikar AI\n\n" +
      "Welcome to the Pikar AI docs. This page was generated from a seed source.\n\n" +
      "## What is Pikar AI?\n" +
      "- AI-powered workflow automation\n" +
      "- Tiered dashboards (Solopreneur, Startup, SME, Enterprise)\n" +
      "- Email campaigns, approvals, governance, analytics\n\n" +
      "## Getting Started\n" +
      "- Visit the dashboard\n" +
      "- Explore templates\n" +
      "- Configure email settings in Settings\n";

    const diffPreview =
      "+++ /docs/overview.md\n" +
      `+ Title: ${title}\n` +
      `+ Slug: /${slug}\n` +
      "+ Adds initial overview page generated from seed\n";

    const proposalId: Id<"docsProposals"> = await ctx.runMutation(
      internal.docsInternal.createProposal,
      {
        title,
        slug,
        contentMarkdown,
        source: args.source,
        diffPreview,
      }
    );

    return { proposalId };
  },
});

// Enhance approve flow with audit logging
export const approveAndPublish = mutation({
  args: { proposalId: v.id("docsProposals") },
  handler: async (ctx, args) => {
    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) {
      throw new Error("Proposal not found");
    }

    // Regression gate: if any eval set exists, require last run to have passed all tests.
    const sets = await ctx.db.query("evalSets").order("desc").take(100);
    if (sets.length > 0) {
      for (const s of sets) {
        const last = await ctx.db
          .query("evalRuns")
          .withIndex("by_set", (q) => q.eq("setId", s._id))
          .order("desc")
          .take(1);
        const run = last[0];
        const passing =
          !!run &&
          run.status === "completed" &&
          run.failCount === 0 &&
          run.passCount === (s.tests?.length || 0);
        if (!passing) {
          throw new Error(
            "Evaluation gate failed: Run and pass all evaluation sets before publishing."
          );
        }
      }
    }

    const pageId = await ctx.db.insert("docsPages", {
      title: proposal.title,
      slug: proposal.slug,
      contentMarkdown: proposal.contentMarkdown,
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.proposalId, { status: "approved" });

    // Best-effort audit log; ignore failures
    try {
      await ctx.runMutation(internal.audit.write, {
        action: "docs_published",
        entityType: "docs",
        entityId: pageId,
        details: {
          proposalId: args.proposalId,
          slug: proposal.slug,
          title: proposal.title,
          source: proposal.source ?? "unknown",
        },
      } as any);
    } catch (_err) {
      // no-op
    }

    return { pageId };
  },
});