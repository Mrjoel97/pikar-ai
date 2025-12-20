import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface AuditExplorerPanelProps {
  recentAudits: Array<{
    _id: string;
    businessId: string;
    userId?: string;
    action: string;
    entityType: string;
    entityId: string;
    details?: any;
    createdAt: number;
  }> | undefined;
}

export function AuditExplorerPanel({ recentAudits }: AuditExplorerPanelProps) {
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [sinceDays, setSinceDays] = useState<number>(7);

  const filteredAudits = useMemo(() => {
    const cutoff = Date.now() - (sinceDays || 0) * 24 * 60 * 60 * 1000;
    const list = (recentAudits || []) as any[];
    const af = (actionFilter || "").toLowerCase();
    const ef = (entityFilter || "").toLowerCase();
    return list.filter((a) => {
      if (typeof a.createdAt === "number" && a.createdAt < cutoff) return false;
      if (af && !(a.action || "").toLowerCase().includes(af)) return false;
      const entity = ((a.entityType || "") + (a.entityId ? `:${a.entityId}` : "")).toLowerCase();
      if (ef && !entity.includes(ef)) return false;
      return true;
    });
  }, [recentAudits, actionFilter, entityFilter, sinceDays]);

  const exportAuditsCsv = () => {
    const header = ["createdAt", "businessId", "action", "entityType", "entityId", "userId"].join(",");
    const body = filteredAudits
      .map((a) =>
        [
          a.createdAt,
          a.businessId ?? "",
          a.action ?? "",
          a.entityType ?? "",
          a.entityId ?? "",
          a.userId ?? "",
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    const csv = [header, body].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audits_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle id="section-audit-explorer">Audit Explorer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <Input
            placeholder="Filter by action"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          />
          <Input
            placeholder="Filter by entity type"
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
          />
          <div className="col-span-1 md:col-span-2 flex items-center gap-2">
            <Input
              type="number"
              min={0}
              value={sinceDays}
              onChange={(e) => setSinceDays(Number(e.target.value || 0))}
            />
            <span className="text-sm text-muted-foreground">days</span>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={exportAuditsCsv}>
              Export CSV
            </Button>
          </div>
        </div>

        <div className="rounded-md border overflow-hidden">
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2 p-3 bg-muted/40 text-xs font-medium">
            <div>When</div>
            <div className="hidden md:block">Tenant</div>
            <div>Action</div>
            <div>Entity</div>
            <div className="hidden md:block">Actor</div>
            <div className="text-right">Details</div>
          </div>
          <Separator />
          <div className="divide-y">
            {filteredAudits.map((a) => (
              <div key={a._id} className="grid grid-cols-4 md:grid-cols-6 gap-2 p-3 text-sm">
                <div className="text-xs text-muted-foreground">
                  {new Date(a.createdAt).toLocaleString()}
                </div>
                <div className="hidden md:block truncate">{a.businessId}</div>
                <div className="truncate">{a.action}</div>
                <div className="truncate">{a.entityType}{a.entityId ? `:${a.entityId}` : ""}</div>
                <div className="hidden md:block truncate">{a.userId || "—"}</div>
                <div className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      toast(JSON.stringify(a.details ?? {}, null, 2));
                    }}
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
            {filteredAudits.length === 0 && (
              <div className="p-3 text-sm text-muted-foreground">No audit events found for the current filters.</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
