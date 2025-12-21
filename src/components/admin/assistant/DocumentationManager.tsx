import React, { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {
  evalSummary: any;
};

export default function DocumentationManager({ evalSummary }: Props) {
  const [importUrl, setImportUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Get current user for businessId and userId
  const currentUser = useQuery(api.users.currentUser, {});

  const proposals = useQuery(api.docs.listProposals as any);
  const generateDocsSeed = useAction(api.docs.generateFromSeed as any);
  const approveDocsProposal = useMutation(api.docs.approveAndPublish as any);
  const generateDocsFromUrl = useAction(api.docs.generateFromUrl as any);

  const handleGenerateSeed = async () => {
    if (!currentUser?._id) {
      toast.error("User not authenticated");
      return;
    }
    try {
      setIsGenerating(true);
      const result = await generateDocsSeed({ 
        source: "seed:readme",
        businessId: currentUser?.businessId as any,
        userId: currentUser?._id as any
      });
      toast.success("Documentation proposal generated from seed!");
      setIsGenerating(false);
    } catch (error: any) {
      toast.error(error?.message || "Failed to generate documentation");
      setIsGenerating(false);
    }
  };

  const handleGenerateFromUrl = async () => {
    if (!currentUser?._id) {
      toast.error("User not authenticated");
      return;
    }
    if (!importUrl.trim()) {
      toast.error("Please enter a URL");
      return;
    }
    try {
      setIsGenerating(true);
      const result = await generateDocsFromUrl({ 
        url: importUrl,
        businessId: currentUser?.businessId as any,
        userId: currentUser?._id as any
      });
      toast.success("Documentation proposal generated from URL!");
      setImportUrl("");
      setIsGenerating(false);
    } catch (error: any) {
      toast.error(error?.message || "Failed to generate documentation from URL");
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-semibold">Assistant Docs</div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Import from URL (https://...)"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            className="w-80"
          />
          <Button
            variant="secondary"
            onClick={handleGenerateFromUrl}
            disabled={isGenerating || !currentUser?._id}
          >
            Import
          </Button>
          <Button
            variant="default"
            onClick={handleGenerateSeed}
            disabled={isGenerating || !currentUser?._id}
          >
            Generate Seed Page
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {!proposals ? (
          <div className="text-sm text-muted-foreground">Loading proposals…</div>
        ) : proposals.length === 0 ? (
          <div className="text-sm text-muted-foreground">No proposals yet. Click "Generate Seed Page".</div>
        ) : (
          proposals.map((p: any) => (
            <div key={p._id} className="rounded-md border p-3 bg-background">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{p.title}</div>
                  <div className="text-xs text-muted-foreground">/{p.slug} • {p.status}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={p.status === "approved"}
                    onClick={async () => {
                      try {
                        if (evalSummary?.gateRequired && evalSummary?.allPassing === false) {
                          toast.error(
                            "Publish blocked by evaluation gate. Run and pass all evaluation sets first."
                          );
                          return;
                        }
                        if (!currentUser?.businessId) {
                          toast.error("Business ID not found");
                          return;
                        }
                        await approveDocsProposal({ 
                          proposalId: p._id,
                          businessId: currentUser.businessId
                        } as any);
                        toast.success("Proposal approved & published");
                      } catch (e: any) {
                        toast.error(e?.message || "Failed to publish proposal");
                      }
                    }}
                  >
                    {p.status === "approved" ? "Published" : "Approve & Publish"}
                  </Button>
                </div>
              </div>
              {p.diffPreview ? (
                <pre className="mt-2 text-xs overflow-auto max-h-40 bg-muted/40 p-2 rounded">
                  {p.diffPreview}
                </pre>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}