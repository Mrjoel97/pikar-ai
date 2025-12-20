import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface AssistantDocsPanelProps {
  hasAdminAccess: boolean;
  generateDocsProposal: any;
  approveDocsProposal: any;
}

export function AssistantDocsPanel({ hasAdminAccess, generateDocsProposal, approveDocsProposal }: AssistantDocsPanelProps) {
  const docsProposals = useQuery(
    api.docs.listProposals as any,
    hasAdminAccess ? {} : undefined
  ) as Array<{
    _id: string;
    title: string;
    slug: string;
    diffPreview: string;
    contentMarkdown: string;
    source: string;
    status: "pending" | "approved" | "rejected";
    createdAt: number;
  }> | undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle id="section-assistant-docs">Assistant Docs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Generate docs proposals from internal sources and approve to publish. This MVP seeds from an internal overview.
        </p>

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={async () => {
              try {
                toast("Generating proposal from seed...");
                await generateDocsProposal({ source: "seed:readme" } as any);
                toast.success("Proposal generated");
              } catch (e: any) {
                toast.error(e?.message || "Failed to generate proposal");
              }
            }}
          >
            Generate from README seed
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              toast("Open proposals are listed below. Approve to publish.");
            }}
          >
            How it works
          </Button>
        </div>

        <div className="rounded-md border overflow-hidden">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 p-3 bg-muted/40 text-xs font-medium">
            <div>Title</div>
            <div className="hidden md:block">Slug</div>
            <div>Source</div>
            <div className="hidden md:block">Created</div>
            <div className="hidden md:block">Status</div>
            <div className="text-right">Action</div>
          </div>
          <Separator />
          <div className="divide-y">
            {(docsProposals || []).map((p) => (
              <div key={p._id} className="grid grid-cols-3 md:grid-cols-6 gap-2 p-3 text-sm items-center">
                <div className="truncate">{p.title}</div>
                <div className="hidden md:block truncate">/{p.slug}</div>
                <div className="truncate">{p.source}</div>
                <div className="hidden md:block text-xs text-muted-foreground">
                  {p.createdAt ? new Date(p.createdAt).toLocaleString() : "—"}
                </div>
                <div className="hidden md:block">
                  <Badge variant={p.status === "pending" ? "secondary" : "outline"}>{p.status}</Badge>
                </div>
                <div className="text-right flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast(p.diffPreview)}
                  >
                    View Diff
                  </Button>
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        await approveDocsProposal({ proposalId: p._id } as any);
                        toast.success("Published");
                      } catch (e: any) {
                        toast.error(e?.message || "Failed to publish");
                      }
                    }}
                    disabled={p.status !== "pending"}
                  >
                    Approve & Publish
                  </Button>
                </div>
              </div>
            ))}
            {(!docsProposals || docsProposals.length === 0) && (
              <div className="p-3 text-sm text-muted-foreground">No pending proposals. Generate one above.</div>
            )}
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Publishing writes a docs page record. Future steps: multi-source ingestion, manual edits, and a public docs viewer.
        </div>
      </CardContent>
    </Card>
  );
}
