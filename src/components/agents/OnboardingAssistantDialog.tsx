import React, { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useAction } from "convex/react";

export default function OnboardingAssistantDialog() {
  const initExec = useMutation(api.aiAgents.initSolopreneurAgent);
  const addSlot = useMutation(api.schedule.addSlot);
  const deleteSlot = useMutation(api.schedule.deleteSlot);
  // Add retry + actions
  const retryExec = useMutation(api.playbookExecutions.retryExecution as any);
  const execCapsule = useAction(api.agentRouter.execRouter as any);

  const [open, setOpen] = useState(false);
  const [businessId, setBusinessId] = useState<string>("");
  const [goals, setGoals] = useState("");
  const [tone, setTone] = useState("practical, concise, friendly");
  const [timezone, setTimezone] = useState("UTC");
  const [useEmail, setUseEmail] = useState(true);
  const [useSocial, setUseSocial] = useState(true);
  const [cadence, setCadence] = useState("weekly");
  const [saving, setSaving] = useState(false);
  const [createNow, setCreateNow] = useState<boolean>(true);

  // Track which execution to inspect live
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);

  const currentBiz = useQuery(api.businesses?.currentUserBusiness as any, undefined);
  React.useEffect(() => {
    if (currentBiz?._id) setBusinessId(currentBiz._id as unknown as string);
  }, [currentBiz?._id]);

  // Recent executions for this workspace (reactive)
  const recentExecutions = useQuery(
    api.playbookExecutions?.listExecutions as any,
    businessId && businessId.trim() !== "" ? ({ businessId: businessId as any, limit: 5 } as any) : undefined
  );

  // Live selected execution details (reactive)
  const selectedExecution = useQuery(
    api.playbookExecutions?.getExecution as any,
    selectedExecutionId ? ({ executionId: selectedExecutionId as any } as any) : undefined
  );

  const suggestedSlots = useMemo(
    () => {
      const slots: Array<{ label: string; channel: string; scheduledAt: number }> = [];
      const base = Date.now();
      if (useEmail) {
        const d = new Date(base);
        const nextTue = ((2 - d.getUTCDay()) + 7) % 7 || 7;
        d.setUTCDate(d.getUTCDate() + nextTue);
        d.setUTCHours(10, 0, 0, 0);
        slots.push({ label: "Newsletter", channel: "email", scheduledAt: d.getTime() });
      }
      if (useSocial) {
        const d1 = new Date(base);
        d1.setUTCDate(d1.getUTCDate() + 2);
        d1.setUTCHours(9, 0, 0, 0);
        const d2 = new Date(base);
        d2.setUTCDate(d2.getUTCDate() + 4);
        d2.setUTCHours(14, 0, 0, 0);
        slots.push({ label: "Post A", channel: "social", scheduledAt: d1.getTime() });
        slots.push({ label: "Post B", channel: "social", scheduledAt: d2.getTime() });
      }
      return slots;
    },
    [useEmail, useSocial]
  );

  // Replace direct HTTP trigger with tracked action call
  const runWeeklyMomentum = async (bizId: string) => {
    try {
      const res: any = await execCapsule({
        mode: "createCapsule",
        businessId: bizId as any,
      });
      if (res?.success) {
        if (res?.executionId) {
          setSelectedExecutionId(String(res.executionId));
        }
        toast.success(res?.message || "First capsule created and queued!");
      } else {
        throw new Error(res?.message || "Failed to trigger playbook");
      }
    } catch (e: any) {
      toast.error(`Could not start first capsule: ${e?.message ?? "Unknown error"}`);
    }
  };

  // Add handler to save setup, seed slots, and optionally run playbook
  const handleSave = async () => {
    if (!businessId) {
      toast.error("Please select or create a workspace first.");
      return;
    }
    try {
      setSaving(true);

      // Initialize the Solopreneur Executive Agent profile/config
      try {
        await (initExec as any)({
          businessId,
          goals,
          tone,
          timezone,
          cadence,
          channels: { email: useEmail, social: useSocial },
        });
      } catch {
        // ignore non-fatal init errors
      }

      // Seed suggested schedule slots
      try {
        for (const s of suggestedSlots) {
          await (addSlot as any)({
            businessId,
            label: s.label,
            channel: s.channel,
            scheduledAt: s.scheduledAt,
          });
        }
      } catch {
        // ignore non-fatal seeding errors
      }

      // Optionally trigger the first capsule run
      if (createNow) {
        await runWeeklyMomentum(businessId);
      }

      toast.success("Executive Assistant initialized");
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save setup");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700">Set up Executive Assistant</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Executive Assistant Setup</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* ... keep existing code for inputs, toggles, and createNow checkbox ... */}

          {/* Recent Playbook Executions (real-time list) */}
          <div className="border rounded-md p-3">
            <div className="text-sm font-semibold mb-2">Recent Playbook Runs</div>
            {!businessId ? (
              <div className="text-xs text-muted-foreground">
                Create or select a workspace to see execution history.
              </div>
            ) : recentExecutions === undefined ? (
              <div className="text-xs text-muted-foreground">Loading…</div>
            ) : recentExecutions?.length === 0 ? (
              <div className="text-xs text-muted-foreground">No runs yet.</div>
            ) : (
              <div className="space-y-2">
                {recentExecutions?.map((e: any) => (
                  <div
                    key={String(e._id)}
                    className="flex items-center justify-between gap-3 rounded-md border p-2"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {e.playbookKey} <span className="text-muted-foreground">({e.playbookVersion})</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(e.startedAt).toLocaleString()} • Status: {e.status}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedExecutionId(String(e._id))}
                      >
                        View
                      </Button>
                      {e.status === "failed" && (
                        <Button
                          size="sm"
                          onClick={async () => {
                            try {
                              const r: any = await retryExec({ executionId: e._id });
                              if (r?.executionId) {
                                setSelectedExecutionId(String(r.executionId));
                              }
                              toast.success("Retry started.");
                            } catch (err: any) {
                              toast.error(`Retry failed: ${err?.message ?? "Unknown error"}`);
                            }
                          }}
                        >
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Execution Details */}
          {selectedExecutionId && selectedExecution && (
            <div className="border rounded-md p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Execution Details</div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedExecutionId(null)}
                >
                  Close
                </Button>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {selectedExecution.playbookKey} ({selectedExecution.playbookVersion}) •{" "}
                Status: {selectedExecution.status}
              </div>

              {/* Progress indicator */}
              {selectedExecution.status === "running" && (
                <div className="mt-2 h-2 w-full bg-muted rounded">
                  <div className="h-2 bg-emerald-600 rounded animate-pulse" style={{ width: "66%" }} />
                </div>
              )}

              {/* Steps */}
              <div className="mt-3">
                <div className="text-xs font-medium mb-1">Steps</div>
                {Array.isArray(selectedExecution.steps) && selectedExecution.steps.length > 0 ? (
                  <ul className="space-y-1">
                    {selectedExecution.steps.map((s: any, idx: number) => (
                      <li key={idx} className="text-xs">
                        <span className="font-medium">{s.name}</span> — {s.status}
                        {s.error ? (
                          <span className="text-red-600"> • {s.error}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-muted-foreground">No steps recorded.</div>
                )}
              </div>

              {/* Result / Error */}
              <div className="mt-3">
                <div className="text-xs font-medium mb-1">Output</div>
                {selectedExecution.status === "failed" ? (
                  <div className="text-xs text-red-600">
                    {selectedExecution.error || "Unknown error"}
                  </div>
                ) : selectedExecution.result ? (
                  <pre className="text-xs whitespace-pre-wrap break-all bg-muted rounded p-2">
                    {typeof selectedExecution.result === "object"
                      ? JSON.stringify(selectedExecution.result, null, 2)
                      : String(selectedExecution.result)}
                  </pre>
                ) : (
                  <div className="text-xs text-muted-foreground">No result yet.</div>
                )}
              </div>

              {/* Error Recovery UI */}
              {selectedExecution.status === "failed" && (
                <div className="mt-3">
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        const r: any = await retryExec({ executionId: selectedExecution._id });
                        if (r?.executionId) {
                          setSelectedExecutionId(String(r.executionId));
                        }
                        toast.success("Retry started.");
                      } catch (err: any) {
                        toast.error(`Retry failed: ${err?.message ?? "Unknown error"}`);
                      }
                    }}
                  >
                    Retry Execution
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save & Initialize"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}