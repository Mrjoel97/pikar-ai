import React, { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { EvalRunsViewer } from "./EvalRunsViewer";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerTrigger } from "@/components/ui/drawer";

export default function EvaluationsPanel() {
  const [evalName, setEvalName] = useState("");
  const [evalDesc, setEvalDesc] = useState("");
  const [testsJson, setTestsJson] = useState(
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
  const [viewRunsSetId, setViewRunsSetId] = useState<string | null>(null);

  const evalCreate = useMutation((api as any).evals.createSet);
  const evalList = useQuery((api as any).evals.listSets as any);
  const evalRun = useAction((api as any).evals.runSet as any);
  const evalSummary = useQuery((api as any).evals.latestSummary as any);

  return (
    <div className="space-y-6">
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
    </div>
  );
}
