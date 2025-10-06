import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

type Props = {
  setId: string;
};

export function EvalRunsViewer({ setId }: Props) {
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
