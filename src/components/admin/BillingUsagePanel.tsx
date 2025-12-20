import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface BillingUsagePanelProps {
  selectedTenantId: string;
  tenants: Array<{ _id: string; name?: string; plan?: string; status?: string }> | undefined;
}

export function BillingUsagePanel({ selectedTenantId, tenants }: BillingUsagePanelProps) {
  const usage = useQuery(
    api.admin.getUsageSummary as any,
    selectedTenantId ? { tenantId: selectedTenantId } : undefined
  ) as
    | {
        workflows?: number;
        runs?: number;
        agents?: number;
        emailsSentLast7?: number;
      }
    | undefined;

  const billingEvents = useQuery(
    api.admin.listBillingEvents as any,
    selectedTenantId ? { tenantId: selectedTenantId } : undefined
  ) as
    | Array<{
        _id: string;
        type?: string;
        amount?: number;
        currency?: string;
        status?: string;
        _creationTime?: number;
      }>;

  const selectedTenant = (tenants || []).find((t) => t._id === selectedTenantId);

  return (
    <Card>
      <CardHeader>
        <CardTitle id="section-billing">Billing & Usage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Select a tenant to view plan, status, recent billing events, and usage.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-md border">
            <div className="text-xs text-muted-foreground">Tenant</div>
            <div className="text-sm font-medium">
              {selectedTenantId ? selectedTenant?.name || selectedTenantId : "None"}
            </div>
          </div>
          <div className="p-3 rounded-md border">
            <div className="text-xs text-muted-foreground">Plan</div>
            <div className="text-sm font-medium">{selectedTenant?.plan || "—"}</div>
          </div>
          <div className="p-3 rounded-md border">
            <div className="text-xs text-muted-foreground">Status</div>
            <div className="text-sm font-medium">{selectedTenant?.status || "—"}</div>
          </div>
          <div className="p-3 rounded-md border">
            <div className="text-xs text-muted-foreground">Stripe IDs</div>
            <div className="text-xs text-muted-foreground">Not available in summary</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-md border">
            <div className="text-xs text-muted-foreground">Workflows</div>
            <div className="text-xl font-semibold">{usage?.workflows ?? 0}</div>
          </div>
          <div className="p-3 rounded-md border">
            <div className="text-xs text-muted-foreground">Runs</div>
            <div className="text-xl font-semibold">{usage?.runs ?? 0}</div>
          </div>
          <div className="p-3 rounded-md border">
            <div className="text-xs text-muted-foreground">Agents</div>
            <div className="text-xl font-semibold">{usage?.agents ?? 0}</div>
          </div>
          <div className="p-3 rounded-md border">
            <div className="text-xs text-muted-foreground">Emails (7d)</div>
            <div className="text-xl font-semibold">{usage?.emailsSentLast7 ?? 0}</div>
          </div>
        </div>

        <div className="rounded-md border overflow-hidden">
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2 p-3 bg-muted/40 text-xs font-medium">
            <div>When</div>
            <div className="hidden md:block">Type</div>
            <div>Amount</div>
            <div className="hidden md:block">Currency</div>
            <div>Status</div>
            <div className="text-right">Info</div>
          </div>
          <Separator />
          <div className="divide-y">
            {(billingEvents || []).map((ev) => (
              <div key={ev._id} className="grid grid-cols-4 md:grid-cols-6 gap-2 p-3 text-sm items-center">
                <div className="text-xs text-muted-foreground">
                  {ev._creationTime ? new Date(ev._creationTime).toLocaleString() : "—"}
                </div>
                <div className="hidden md:block truncate">{ev.type || "—"}</div>
                <div className="truncate">{typeof ev.amount === "number" ? ev.amount : "—"}</div>
                <div className="hidden md:block">{ev.currency || "—"}</div>
                <div>{ev.status || "—"}</div>
                <div className="text-right">
                  <Button size="sm" variant="outline" onClick={() => toast(JSON.stringify(ev, null, 2))}>
                    View
                  </Button>
                </div>
              </div>
            ))}
            {(!billingEvents || billingEvents.length === 0) && (
              <div className="p-3 text-sm text-muted-foreground">
                {selectedTenantId ? "No recent billing events." : "Select a tenant to view billing events."}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
