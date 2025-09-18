import React, { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerTrigger } from "@/components/ui/drawer";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Props = {
  adminSessionValid: boolean;
  adminToken: string | null;
};

export function AdminAssistantSection({ adminSessionValid, adminToken }: Props) {
  const [assistantTranscriptOpen, setAssistantTranscriptOpen] = useState(false);
  const [assistantSteps, setAssistantSteps] = useState<Array<{ tool: string; title: string; data: any }>>([]);
  const [assistantSummaryText, setAssistantSummaryText] = useState<string | undefined>(undefined);
  const [assistantDryRun, setAssistantDryRun] = useState<boolean>(false);

  const [assistantMode, setAssistantMode] = useState<"explain" | "confirm" | "auto">("explain");
  const [assistantTools, setAssistantTools] = useState<{ health: boolean; flags: boolean; alerts: boolean }>({
    health: true,
    flags: true,
    alerts: true,
  });
  const [assistantMessages, setAssistantMessages] = useState<Array<{ role: "user" | "assistant"; content: string; steps?: any[] }>>([]);
  const [assistantInput, setAssistantInput] = useState<string>("");
  const [assistantBusy, setAssistantBusy] = useState<boolean>(false);
  const sendAssistantMessage = useAction(api.adminAssistant.sendMessage as any);

  const proposals = useQuery(api.docs.listProposals as any);
  const generateDocsSeed = useAction(api.docs.generateFromSeed as any);
  const approveDocsProposal = useMutation(api.docs.approveAndPublish as any);
  const generateDocsFromUrl = useAction(api.docs.generateFromUrl as any);
  const [importUrl, setImportUrl] = useState<string>("");

  async function runAssistant(msg: string) {
    setAssistantMessages((m) => [...m, { role: "user", content: msg }]);
    setAssistantInput("");
    setAssistantBusy(true);
    try {
      const res = await sendAssistantMessage({
        message: msg,
        mode: assistantMode,
        toolsAllowed: Object.entries(assistantTools)
          .filter(([, v]) => v)
          .map(([k]) => k),
        dryRun: assistantDryRun,
        adminToken: adminSessionValid ? adminToken ?? undefined : undefined,
      } as any);

      setAssistantSteps(res?.steps || []);
      setAssistantSummaryText((res?.summaryText || res?.notice || "Done.") as string);

      setAssistantMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: (res?.summaryText || res?.notice || "Done.") as string,
          steps: res?.steps || [],
        },
      ]);
    } catch (err: any) {
      toast.error(err?.message || "Assistant failed");
    } finally {
      setAssistantBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle id="section-admin-assistant">Admin Assistant</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-sm font-medium">Mode</div>
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={assistantMode}
            onChange={(e) => setAssistantMode(e.target.value as any)}
          >
            <option value="explain">Explain only (read-only)</option>
            <option value="confirm">Execute with confirmation</option>
            <option value="auto">Auto-execute (use cautiously)</option>
          </select>

          <div className="ml-4 text-sm font-medium">Tools</div>
          <label className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              checked={assistantTools.health}
              onChange={(e) => setAssistantTools((t) => ({ ...t, health: e.target.checked }))}
            />
            Health
          </label>
          <label className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              checked={assistantTools.flags}
              onChange={(e) => setAssistantTools((t) => ({ ...t, flags: e.target.checked }))}
            />
            Flags
          </label>
          <label className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              checked={assistantTools.alerts}
              onChange={(e) => setAssistantTools((t) => ({ ...t, alerts: e.target.checked }))}
            />
            Alerts
          </label>
        </div>

        <div className="rounded-md border h-60 overflow-y-auto p-3 bg-muted/20">
          {assistantMessages.length === 0 && (
            <div className="text-sm text-muted-foreground">
              Ask me to check system health, list feature flags, or summarize open alerts.
            </div>
          )}
          <div className="space-y-3">
            {assistantMessages.map((m, idx) => (
              <div key={idx} className="text-sm">
                <div className={m.role === "user" ? "font-medium" : "text-emerald-700"}>
                  {m.role === "user" ? "You" : "Assistant"}
                </div>
                <div className="whitespace-pre-wrap">{m.content}</div>
                {m.steps && m.steps.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {m.steps.map((s: any, i: number) => (
                      <div key={i} className="p-2 rounded border bg-white">
                        <div className="text-xs uppercase text-muted-foreground">{s.tool}</div>
                        <div className="text-sm font-medium">{s.title}</div>
                        <pre className="text-xs overflow-auto max-h-40">{JSON.stringify(s.data, null, 2)}</pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder={'Ask the assistant... e.g., "Check health and list flags"'}
            value={assistantInput}
            onChange={(e) => setAssistantInput(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === "Enter") {
                (e.target as any).blur();
                const msg = assistantInput.trim();
                if (!msg || assistantBusy) return;
                await runAssistant(msg);
              }
            }}
          />
          <Button
            disabled={assistantBusy || !assistantInput.trim()}
            onClick={async () => {
              const msg = assistantInput.trim();
              if (!msg) return;
              await runAssistant(msg);
            }}
          >
            {assistantBusy ? "Working..." : "Send"}
          </Button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch id="assistant-dryrun" checked={assistantDryRun} onCheckedChange={setAssistantDryRun} />
              <Label htmlFor="assistant-dryrun" className="text-sm">Dry Run</Label>
            </div>
            <button
              type="button"
              className="text-sm underline text-emerald-700 hover:text-emerald-900"
              onClick={() => setAssistantTranscriptOpen(true)}
            >
              Open Transcript
            </button>
          </div>

          <Drawer open={assistantTranscriptOpen} onOpenChange={setAssistantTranscriptOpen}>
            <DrawerTrigger asChild>
              <span />
            </DrawerTrigger>
            <DrawerContent className="max-h-[85vh]">
              <DrawerHeader>
                <DrawerTitle>Assistant Transcript</DrawerTitle>
                <DrawerDescription>Step-by-step results of the last assistant run.</DrawerDescription>
              </DrawerHeader>
              <div className="px-4 pb-6 space-y-3 overflow-y-auto">
                {assistantSummaryText ? (
                  <div className="p-3 rounded-md bg-emerald-50 text-emerald-900 text-sm whitespace-pre-wrap">
                    {assistantSummaryText}
                  </div>
                ) : null}
                <div className="space-y-2">
                  {assistantSteps.map((s, i) => (
                    <div key={i} className="rounded-lg border p-3">
                      <div className="text-xs uppercase text-muted-foreground tracking-wide">{s.tool}</div>
                      <div className="font-medium">{s.title}</div>
                      <pre className="mt-2 text-xs overflow-x-auto whitespace-pre-wrap">{JSON.stringify(s.data, null, 2)}</pre>
                    </div>
                  ))}
                  {assistantSteps.length === 0 && (
                    <div className="text-sm text-muted-foreground">No transcript available yet. Run the assistant to see steps.</div>
                  )}
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </div>

        <div className="text-xs text-muted-foreground">
          MVP is read-only. Mutating actions (repairs, sends, flag changes) are gated by role and mode.
        </div>

        <div className="mt-6 pt-6 border-t">
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
                onClick={async () => {
                  try {
                    const url = importUrl.trim();
                    if (!url) {
                      toast.error("Enter a URL to import");
                      return;
                    }
                    const res = await generateDocsFromUrl({ url } as any);
                    toast.success("Imported proposal", {
                      description: `Proposal ID: ${res?.proposalId || "created"}`,
                    });
                    setImportUrl("");
                  } catch (e: any) {
                    toast.error(e?.message || "Failed to import proposal");
                  }
                }}
              >
                Import
              </Button>
              <Button
                variant="default"
                onClick={async () => {
                  try {
                    const res = await generateDocsSeed({ source: "internal:seed" } as any);
                    toast.success("Generated proposal", {
                      description: `Proposal ID: ${res?.proposalId || "created"}`,
                    });
                  } catch (e: any) {
                    toast.error(e?.message || "Failed to generate proposal");
                  }
                }}
              >
                Generate Seed Page
              </Button>
            </div>
          </div>

          <div className="mt-4 space-y-3">
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
                            await approveDocsProposal({ proposalId: p._id } as any);
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
      </CardContent>
    </Card>
  );
}