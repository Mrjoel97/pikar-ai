import React, { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {
  adminSessionValid: boolean;
  adminToken: string | null;
};

export function SandboxPanel({ adminSessionValid, adminToken }: Props) {
  const [sandboxMsg, setSandboxMsg] = useState("Check health and list flags");
  const [sandboxTools, setSandboxTools] = useState({
    health: true,
    flags: true,
    alerts: false,
    agents: true,
  });
  const [sandboxSteps, setSandboxSteps] = useState<any[]>([]);
  const [sandboxOutput, setSandboxOutput] = useState("");
  const [busy, setBusy] = useState(false);

  const sendMessage = useAction(api.adminAssistant.sendMessage as any);

  async function runSandbox() {
    setBusy(true);
    try {
      const res = await sendMessage({
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
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border p-3">
        <div className="font-semibold mb-2">Sandbox (Dry-Run)</div>
        <div className="grid gap-2 md:grid-cols-2">
          <Input placeholder="Message to assistant (dry run)" value={sandboxMsg} onChange={(e) => setSandboxMsg(e.target.value)} />
          <div className="flex items-center gap-3 text-sm">
            {Object.entries(sandboxTools).map(([key, checked]) => (
              <label key={key} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setSandboxTools((t) => ({ ...t, [key]: e.target.checked }))}
                />
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </label>
            ))}
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Button onClick={runSandbox} disabled={busy}>
            {busy ? "Running…" : "Run Sandbox"}
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
    </div>
  );
}
