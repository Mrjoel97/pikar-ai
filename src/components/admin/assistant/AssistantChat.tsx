import React, { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerTrigger } from "@/components/ui/drawer";
import { toast } from "sonner";

type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
  steps?: Array<{ tool: string; title: string; data: any }>;
};

type Props = {
  adminSessionValid: boolean;
  adminToken: string | null;
};

export default function AssistantChat({ adminSessionValid, adminToken }: Props) {
  const [mode, setMode] = useState<"explain" | "confirm" | "auto">("explain");
  const [tools, setTools] = useState({
    health: true,
    flags: true,
    alerts: true,
    agents: true,
  });
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [dryRun, setDryRun] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [steps, setSteps] = useState<Array<{ tool: string; title: string; data: any }>>([]);
  const [summaryText, setSummaryText] = useState<string | undefined>(undefined);

  const sendMessage = useAction(api.adminAssistant.sendMessage as any);

  async function runAssistant(msg: string) {
    setMessages((m) => [...m, { role: "user", content: msg }]);
    setInput("");
    setBusy(true);
    try {
      const res = await sendMessage({
        message: msg,
        mode,
        toolsAllowed: Object.entries(tools)
          .filter(([, v]) => v)
          .map(([k]) => k),
        dryRun,
        adminToken: adminSessionValid ? adminToken ?? undefined : undefined,
      } as any);

      setSteps(res?.steps || []);
      setSummaryText((res?.summaryText || res?.notice || "Done.") as string);

      setMessages((m) => [
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
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm font-medium">Mode</div>
        <select
          className="h-9 rounded-md border bg-background px-3 text-sm"
          value={mode}
          onChange={(e) => setMode(e.target.value as any)}
        >
          <option value="explain">Explain only (read-only)</option>
          <option value="confirm">Execute with confirmation</option>
          <option value="auto">Auto-execute (use cautiously)</option>
        </select>

        <div className="ml-4 text-sm font-medium">Tools</div>
        {Object.entries(tools).map(([key, checked]) => (
          <label key={key} className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setTools((t) => ({ ...t, [key]: e.target.checked }))}
            />
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </label>
        ))}
      </div>

      <div className="rounded-md border h-60 overflow-y-auto p-3 bg-muted/20">
        {messages.length === 0 && (
          <div className="text-sm text-muted-foreground">
            Ask me to check system health, list feature flags, or summarize open alerts.
          </div>
        )}
        <div className="space-y-3">
          {messages.map((m, idx) => (
            <div key={idx} className="text-sm">
              <div className={m.role === "user" ? "font-medium" : "text-emerald-700"}>
                {m.role === "user" ? "You" : "Assistant"}
              </div>
              <div className="whitespace-pre-wrap">{m.content}</div>
              {m.steps && m.steps.length > 0 && (
                <div className="mt-2 space-y-2">
                  {m.steps.map((s, i) => (
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
          placeholder='Ask the assistant... e.g., "Check health and list flags"'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={async (e) => {
            if (e.key === "Enter") {
              (e.target as any).blur();
              const msg = input.trim();
              if (!msg || busy) return;
              await runAssistant(msg);
            }
          }}
        />
        <Button
          disabled={busy || !input.trim()}
          onClick={async () => {
            const msg = input.trim();
            if (!msg) return;
            await runAssistant(msg);
          }}
        >
          {busy ? "Working..." : "Send"}
        </Button>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch id="assistant-dryrun" checked={dryRun} onCheckedChange={setDryRun} />
            <Label htmlFor="assistant-dryrun" className="text-sm">Dry Run</Label>
          </div>
          <button
            type="button"
            className="text-sm underline text-emerald-700 hover:text-emerald-900"
            onClick={() => setTranscriptOpen(true)}
          >
            Open Transcript
          </button>
        </div>

        <Drawer open={transcriptOpen} onOpenChange={setTranscriptOpen}>
          <DrawerTrigger asChild>
            <span />
          </DrawerTrigger>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader>
              <DrawerTitle>Assistant Transcript</DrawerTitle>
              <DrawerDescription>Step-by-step results of the last assistant run.</DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-6 space-y-3 overflow-y-auto">
              {summaryText ? (
                <div className="p-3 rounded-md bg-emerald-50 text-emerald-900 text-sm whitespace-pre-wrap">
                  {summaryText}
                </div>
              ) : null}
              <div className="space-y-2">
                {steps.map((s, i) => (
                  <div key={i} className="rounded-lg border p-3">
                    <div className="text-xs uppercase text-muted-foreground tracking-wide">{s.tool}</div>
                    <div className="font-medium">{s.title}</div>
                    <pre className="mt-2 text-xs overflow-x-auto whitespace-pre-wrap">{JSON.stringify(s.data, null, 2)}</pre>
                  </div>
                ))}
                {steps.length === 0 && (
                  <div className="text-sm text-muted-foreground">No transcript available yet. Run the assistant to see steps.</div>
                )}
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}
