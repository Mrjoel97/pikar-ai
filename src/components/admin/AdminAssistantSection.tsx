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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

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
  const [assistantTools, setAssistantTools] = useState<{ health: boolean; flags: boolean; alerts: boolean; agents: boolean }>({
    health: true,
    flags: true,
    alerts: true,
    agents: true,
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

  // Evaluations state
  const [evalName, setEvalName] = useState<string>("");
  const [evalDesc, setEvalDesc] = useState<string>("");
  const [testsJson, setTestsJson] = useState<string>(
    JSON.stringify(
      [
        { tool: "health", expectedContains: "hasResend" },
        { tool: "flags", expectedContains: "flags" },
        { tool: "alerts", expectedContains: "status" },
      ],
      null,
      2
    )
  );
  const evalCreate = useMutation((api as any).evals.createSet);
  const evalList = useQuery((api as any).evals.listSets as any);
  const evalRun = useAction((api as any).evals.runSet as any);
  const listRunsBySet = useQuery as any;

  // Summary of eval pass/fail + gate status
  const evalSummary = useQuery((api as any).evals.latestSummary as any);

  // Sandbox state
  const [sandboxMsg, setSandboxMsg] = useState<string>("Check health and list flags");
  const [sandboxTools, setSandboxTools] = useState<{ health: boolean; flags: boolean; alerts: boolean; agents: boolean }>({
    health: true,
    flags: true,
    alerts: false,
    agents: true,
  });
  const [sandboxSteps, setSandboxSteps] = useState<any[]>([]);
  const [sandboxOutput, setSandboxOutput] = useState<string>("");

  // Add state to open the runs viewer for a specific set
  const [viewRunsSetId, setViewRunsSetId] = useState<string | null>(null);

  // Lightweight inline component to list recent runs for a set
  function EvalRunsViewer({ setId }: { setId: string }) {
    const runs = useQuery((api as any).evals.listRunsBySet as any, { setId } as any);
    return (
      <div className="space-y-2">
        {!runs ? (
          <div className="text-sm text-muted-foreground">Loading runs…</div>
        ) : runs.length === 0 ? (
          <div className="text-sm text-muted-foreground">No runs yet.</div>
        ) : (
          runs.map((r: any) => (
            <div key={r._id} className="rounded border p-2">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <div className="font-medium">{new Date(r.finishedAt ?? r.startedAt).toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">
                    Status: {r.status} • Passed {r.passCount} / Failed {r.failCount}
                  </div>
                </div>
                <div>
                  <span
                    className={
                      r.failCount === 0 && r.status === "completed"
                        ? "inline-flex px-2 py-0.5 text-xs rounded bg-emerald-100 text-emerald-800"
                        : "inline-flex px-2 py-0.5 text-xs rounded bg-red-100 text-red-800"
                    }
                  >
                    {r.failCount === 0 && r.status === "completed" ? "PASS" : "FAIL"}
                  </span>
                </div>
              </div>
              {Array.isArray(r.results) && r.results.length > 0 ? (
                <details className="mt-2">
                  <summary className="text-xs cursor-pointer">Details</summary>
                  <pre className="mt-1 text-xs overflow-auto max-h-40">{JSON.stringify(r.results, null, 2)}</pre>
                </details>
              ) : null}
            </div>
          ))
        )}
      </div>
    );
  }

  // Add state for health check agent key
  const [agentHealthKey, setAgentHealthKey] = useState<string>("");

  const toolHealth = useQuery((api as any).aiAgents.toolHealth as any, agentHealthKey ? ({ agent_key: agentHealthKey } as any) : undefined);

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

  async function runSandbox() {
    setAssistantBusy(true);
    try {
      const res = await sendAssistantMessage({
        message: sandboxMsg,
        mode: "explain",
        toolsAllowed: Object.entries(sandboxTools)
          .filter(([, v]) => v)
          .map(([k]) => k),
        dryRun: true,
        adminToken: adminSessionValid ? adminToken ?? undefined : undefined,
      } as any);
      setSandboxSteps(res?.steps || []);
      setSandboxOutput((res?.summaryText || res?.notice || "Done.") as string);
      toast.success("Sandbox run completed");
    } catch (e: any) {
      toast.error(e?.message || "Sandbox failed");
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
        <Tabs defaultValue="assistant" className="w-full">
          <TabsList className="mb-2">
            <TabsTrigger value="assistant">Assistant</TabsTrigger>
            <TabsTrigger value="docs">Assistant Docs</TabsTrigger>
            <TabsTrigger value="evals">Evaluations & Sandbox</TabsTrigger>
          </TabsList>

          <TabsContent value="assistant" className="space-y-4">
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
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={assistantTools.agents}
                  onChange={(e) => setAssistantTools((t) => ({ ...t, agents: e.target.checked }))}
                />
                Agents
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
          </TabsContent>

          <TabsContent value="docs" className="space-y-4">
            <div className="rounded-md border p-3">
              <div className="font-semibold mb-2">Create Evaluation Set</div>
              <div className="grid gap-2 md:grid-cols-2">
                <Input placeholder="Name" value={evalName} onChange={(e) => setEvalName(e.target.value)} />
                <Input placeholder="Description (optional)" value={evalDesc} onChange={(e) => setEvalDesc(e.target.value)} />
              </div>
              <div className="mt-2">
                <div className="text-xs text-muted-foreground mb-1">Tests JSON (array of {`{ tool, input?, expectedContains? }`})</div>
                <textarea
                  className="w-full h-40 rounded-md border p-2 text-sm font-mono"
                  value={testsJson}
                  onChange={(e) => setTestsJson(e.target.value)}
                />
              </div>
              <div className="mt-2">
                <Button
                  onClick={async () => {
                    try {
                      const parsed = JSON.parse(testsJson);
                      if (!Array.isArray(parsed)) throw new Error("Tests must be an array");
                      const res = await evalCreate({ name: evalName.trim() || "Unnamed Set", description: evalDesc || undefined, tests: parsed } as any);
                      toast.success("Evaluation set created", { description: `Set ID: ${res?.setId || "created"}` });
                      setEvalName("");
                      setEvalDesc("");
                    } catch (e: any) {
                      toast.error(e?.message || "Invalid tests JSON");
                    }
                  }}
                >
                  Create Set
                </Button>
              </div>
            </div>

            <div className="rounded-md border p-3">
              <div className="font-semibold mb-2">Evaluation Sets</div>
              {!evalList ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : evalList.length === 0 ? (
                <div className="text-sm text-muted-foreground">No evaluation sets yet.</div>
              ) : (
                <div className="space-y-3">
                  {evalList.map((s: any) => (
                    <div key={s._id} className="rounded border p-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{s.name}</div>
                          <div className="text-xs text-muted-foreground">{s.description || "—"}</div>
                          <div className="text-xs text-muted-foreground">{s.tests?.length || 0} tests</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={async () => {
                              try {
                                const res = await evalRun({ setId: s._id } as any);
                                toast.success("Run completed", {
                                  description: `Passed ${res.passCount}/${res.total}`,
                                });
                              } catch (e: any) {
                                toast.error(e?.message || "Run failed");
                              }
                            }}
                          >
                            Run
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewRunsSetId(s._id)}
                          >
                            Runs
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-md border p-3">
              <div className="font-semibold mb-2">Sandbox (Dry-Run)</div>
              <div className="grid gap-2 md:grid-cols-2">
                <Input placeholder="Message to assistant (dry run)" value={sandboxMsg} onChange={(e) => setSandboxMsg(e.target.value)} />
                <div className="flex items-center gap-3 text-sm">
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={sandboxTools.health}
                      onChange={(e) => setSandboxTools((t) => ({ ...t, health: e.target.checked }))}
                    />
                    Health
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={sandboxTools.flags}
                      onChange={(e) => setSandboxTools((t) => ({ ...t, flags: e.target.checked }))}
                    />
                    Flags
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={sandboxTools.alerts}
                      onChange={(e) => setSandboxTools((t) => ({ ...t, alerts: e.target.checked }))}
                    />
                    Alerts
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={sandboxTools.agents}
                      onChange={(e) => setSandboxTools((t) => ({ ...t, agents: e.target.checked }))}
                    />
                    Agents
                  </label>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Button onClick={runSandbox} disabled={assistantBusy}>
                  {assistantBusy ? "Running…" : "Run Sandbox"}
                </Button>
              </div>
              {sandboxOutput ? (
                <div className="mt-3 p-2 rounded bg-muted/30 text-sm whitespace-pre-wrap">{sandboxOutput}</div>
              ) : null}
              {sandboxSteps?.length ? (
                <div className="mt-3 space-y-2">
                  {sandboxSteps.map((s: any, i: number) => (
                    <div key={i} className="p-2 rounded border bg-white">
                      <div className="text-xs uppercase text-muted-foreground">{s.tool}</div>
                      <div className="text-sm font-medium">{s.title}</div>
                      <pre className="text-xs overflow-auto max-h-40">{JSON.stringify(s.data, null, 2)}</pre>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </TabsContent>

          <TabsContent value="evals" className="space-y-6">
            <div className="rounded-md border p-3">
              <div className="font-semibold">Evaluation Gate Status</div>
              <div className="text-sm text-muted-foreground mt-1">
                {evalSummary
                  ? evalSummary.gateRequired
                    ? evalSummary.allPassing
                      ? "All sets passing — publishing allowed."
                      : "Blocked — failing or missing runs. Run and pass all sets."
                    : "No evaluation sets — gate disabled."
                  : "Loading…"}
              </div>
            </div>

            <div className="rounded-md border p-3">
              <div className="font-semibold mb-2">Agent Tool Health</div>
              <div className="grid gap-2 md:grid-cols-[1fr]">
                <Input
                  placeholder="Enter agent_key (e.g., strategic_planner)"
                  value={agentHealthKey}
                  onChange={(e) => setAgentHealthKey(e.target.value)}
                />
              </div>

              <div className="mt-3">
                {!agentHealthKey ? (
                  <div className="text-sm text-muted-foreground">Enter an agent_key to check status.</div>
                ) : !toolHealth ? (
                  <div className="text-sm text-muted-foreground">Checking tool health…</div>
                ) : (
                  <Alert variant={toolHealth.ok ? "default" : "destructive"}>
                    <AlertTitle>{toolHealth.ok ? "OK — Tooling Ready" : "Issues Detected"}</AlertTitle>
                    <AlertDescription>
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">
                          Agent: <span className="font-medium">{toolHealth.summary?.agent_key}</span> • Published:{" "}
                          <span className="font-medium">{toolHealth.summary?.active ? "yes" : "no"}</span>
                          {toolHealth.summary?.evalGate ? (
                            <>
                              {" "}
                              • Eval Gate:{" "}
                              <span className="font-medium">
                                {toolHealth.summary.evalGate.required
                                  ? toolHealth.summary.evalGate.allPassing
                                    ? "required & passing"
                                    : "required & failing"
                                  : "not required"}
                              </span>
                            </>
                          ) : null}
                        </div>
                        {Array.isArray(toolHealth.issues) && toolHealth.issues.length > 0 ? (
                          <ul className="list-disc pl-5 text-sm">
                            {toolHealth.issues.map((iss: string, i: number) => (
                              <li key={i}>{iss}</li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-sm">No issues found.</div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            <div className="rounded-md border p-3">
              <div className="font-semibold mb-2">Create Evaluation Set</div>
              <div className="grid gap-2 md:grid-cols-2">
                <Input placeholder="Name" value={evalName} onChange={(e) => setEvalName(e.target.value)} />
                <Input placeholder="Description (optional)" value={evalDesc} onChange={(e) => setEvalDesc(e.target.value)} />
              </div>
              <div className="mt-2">
                <div className="text-xs text-muted-foreground mb-1">Tests JSON (array of {`{ tool, input?, expectedContains? }`})</div>
                <textarea
                  className="w-full h-40 rounded-md border p-2 text-sm font-mono"
                  value={testsJson}
                  onChange={(e) => setTestsJson(e.target.value)}
                />
              </div>
              <div className="mt-2">
                <Button
                  onClick={async () => {
                    try {
                      const parsed = JSON.parse(testsJson);
                      if (!Array.isArray(parsed)) throw new Error("Tests must be an array");
                      const res = await evalCreate({ name: evalName.trim() || "Unnamed Set", description: evalDesc || undefined, tests: parsed } as any);
                      toast.success("Evaluation set created", { description: `Set ID: ${res?.setId || "created"}` });
                      setEvalName("");
                      setEvalDesc("");
                    } catch (e: any) {
                      toast.error(e?.message || "Invalid tests JSON");
                    }
                  }}
                >
                  Create Set
                </Button>
              </div>
            </div>

            <div className="rounded-md border p-3">
              <div className="font-semibold mb-2">Evaluation Sets</div>
              {!evalList ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : evalList.length === 0 ? (
                <div className="text-sm text-muted-foreground">No evaluation sets yet.</div>
              ) : (
                <div className="space-y-3">
                  {evalList.map((s: any) => (
                    <div key={s._id} className="rounded border p-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{s.name}</div>
                          <div className="text-xs text-muted-foreground">{s.description || "—"}</div>
                          <div className="text-xs text-muted-foreground">{s.tests?.length || 0} tests</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={async () => {
                              try {
                                const res = await evalRun({ setId: s._id } as any);
                                toast.success("Run completed", {
                                  description: `Passed ${res.passCount}/${res.total}`,
                                });
                              } catch (e: any) {
                                toast.error(e?.message || "Run failed");
                              }
                            }}
                          >
                            Run
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewRunsSetId(s._id)}
                          >
                            Runs
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-md border p-3">
              <div className="font-semibold mb-2">Sandbox (Dry-Run)</div>
              <div className="grid gap-2 md:grid-cols-2">
                <Input placeholder="Message to assistant (dry run)" value={sandboxMsg} onChange={(e) => setSandboxMsg(e.target.value)} />
                <div className="flex items-center gap-3 text-sm">
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={sandboxTools.health}
                      onChange={(e) => setSandboxTools((t) => ({ ...t, health: e.target.checked }))}
                    />
                    Health
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={sandboxTools.flags}
                      onChange={(e) => setSandboxTools((t) => ({ ...t, flags: e.target.checked }))}
                    />
                    Flags
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={sandboxTools.alerts}
                      onChange={(e) => setSandboxTools((t) => ({ ...t, alerts: e.target.checked }))}
                    />
                    Alerts
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={sandboxTools.agents}
                      onChange={(e) => setSandboxTools((t) => ({ ...t, agents: e.target.checked }))}
                    />
                    Agents
                  </label>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Button onClick={runSandbox} disabled={assistantBusy}>
                  {assistantBusy ? "Running…" : "Run Sandbox"}
                </Button>
              </div>
              {sandboxOutput ? (
                <div className="mt-3 p-2 rounded bg-muted/30 text-sm whitespace-pre-wrap">{sandboxOutput}</div>
              ) : null}
              {sandboxSteps?.length ? (
                <div className="mt-3 space-y-2">
                  {sandboxSteps.map((s: any, i: number) => (
                    <div key={i} className="p-2 rounded border bg-white">
                      <div className="text-xs uppercase text-muted-foreground">{s.tool}</div>
                      <div className="text-sm font-medium">{s.title}</div>
                      <pre className="text-xs overflow-auto max-h-40">{JSON.stringify(s.data, null, 2)}</pre>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </TabsContent>

          <Drawer open={!!viewRunsSetId} onOpenChange={(open) => !open && setViewRunsSetId(null)}>
            <DrawerTrigger asChild>
              <span />
            </DrawerTrigger>
            <DrawerContent className="max-h-[85vh]">
              <DrawerHeader>
                <DrawerTitle>Evaluation Runs</DrawerTitle>
                <DrawerDescription>Recent runs and pass/fail summaries for this evaluation set.</DrawerDescription>
              </DrawerHeader>
              <div className="px-4 pb-6">
                {viewRunsSetId ? <EvalRunsViewer setId={viewRunsSetId} /> : null}
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" onClick={() => setViewRunsSetId(null)}>Close</Button>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </Tabs>

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
                                if (evalSummary?.gateRequired && evalSummary?.allPassing === false) {
                                  toast.error(
                                    "Publish blocked by evaluation gate. Run and pass all evaluation sets first."
                                  );
                                  return;
                                }
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