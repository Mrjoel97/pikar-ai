import React, { useMemo } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface AgentSessionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string | null;
  recentAudits?: Array<{
    _id: string;
    businessId: string;
    userId?: string;
    action: string;
    entityType: string;
    entityId: string;
    details?: any;
    createdAt: number;
  }>;
}

export function AgentSessionDrawer({ open, onOpenChange, agentId, recentAudits = [] }: AgentSessionDrawerProps) {
  const viewAgentAudits = useMemo(() => {
    if (!agentId) return [];
    return recentAudits.filter(
      (a) =>
        a.entityId === agentId ||
        (a.details &&
          typeof a.details === "object" &&
          ((a.details.profileId && String(a.details.profileId) === agentId) ||
            (a.details.agentId && String(a.details.agentId) === agentId)))
    );
  }, [agentId, recentAudits]);

  const agentTopIntents = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of viewAgentAudits) {
      const intent = (a?.details?.intent ?? "") as string;
      if (intent) counts[intent] = (counts[intent] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [viewAgentAudits]);

  const agentLastErrors = useMemo(() => {
    const errs: Array<{ when: number; message: string }> = [];
    for (const a of viewAgentAudits) {
      const action = String(a.action || "").toLowerCase();
      const msg = (a?.details?.error || a?.details?.message || "") as string;
      if (action.includes("error") || action.includes("fail") || msg) {
        errs.push({ when: a.createdAt as number, message: msg || action });
      }
    }
    return errs.slice(0, 5);
  }, [viewAgentAudits]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Agent Session</DrawerTitle>
          <DrawerDescription className="text-sm">Agent: {agentId || "—"}</DrawerDescription>
        </DrawerHeader>
        <div className="px-6 pb-6 space-y-4">
          <div>
            <div className="text-sm font-medium mb-1">Top Intents</div>
            <div className="flex flex-wrap gap-2">
              {agentTopIntents.length > 0 ? (
                agentTopIntents.map(([intent, count]) => (
                  <Badge key={intent as string} variant="outline">
                    {String(intent)}: {String(count)}
                  </Badge>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No intents observed.</div>
              )}
            </div>
          </div>
          <Separator />
          <div>
            <div className="text-sm font-medium mb-1">Recent Activity</div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {viewAgentAudits.map((ev: any, idx: number) => (
                <div key={ev._id || idx} className="p-2 rounded border">
                  <div className="text-xs text-muted-foreground">
                    {ev.createdAt ? new Date(ev.createdAt).toLocaleString() : "—"}
                  </div>
                  <div className="text-sm font-medium">{ev.action || "event"}</div>
                  <div className="text-xs break-words text-muted-foreground">
                    {(() => {
                      try {
                        const preview = JSON.stringify(ev.details ?? {}, null, 0);
                        return preview.length > 240 ? preview.slice(0, 240) + "…" : preview;
                      } catch {
                        return "—";
                      }
                    })()}
                  </div>
                </div>
              ))}
              {viewAgentAudits.length === 0 && (
                <div className="text-sm text-muted-foreground">No recent activity for this agent.</div>
              )}
            </div>
          </div>
          <Separator />
          <div>
            <div className="text-sm font-medium mb-1">Last Errors</div>
            <div className="space-y-1">
              {agentLastErrors.length > 0 ? (
                agentLastErrors.map((e, i) => (
                  <div key={i} className="text-xs">
                    <span className="text-muted-foreground mr-2">{new Date(e.when).toLocaleString()}:</span>
                    <span>{e.message || "Error"}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">None</div>
              )}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
