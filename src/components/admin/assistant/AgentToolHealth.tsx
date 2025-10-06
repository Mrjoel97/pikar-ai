import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export function AgentToolHealth() {
  const [agentKey, setAgentKey] = useState("");

  const toolHealth = useQuery(
    api.aiAgents.toolHealth as any,
    agentKey && agentKey.trim().length > 0 ? { agent_key: agentKey.trim() } : undefined
  );

  return (
    <div className="rounded-md border p-3">
      <div className="font-semibold mb-2">Agent Tool Health</div>
      <div className="grid gap-2 md:grid-cols-[1fr]">
        <Input
          placeholder="Enter agent_key (e.g., strategic_planner)"
          value={agentKey}
          onChange={(e) => setAgentKey(e.target.value)}
        />
      </div>

      <div className="mt-3">
        {!agentKey ? (
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
  );
}
