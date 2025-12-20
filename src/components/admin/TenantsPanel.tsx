import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface TenantsPanelProps {
  selectedTenantId: string;
  onSelectTenant: (tenantId: string) => void;
}

export function TenantsPanel({ selectedTenantId, onSelectTenant }: TenantsPanelProps) {
  const tenants = useQuery(
    api.admin.listTenants as any,
    {}
  ) as Array<{ _id: string; name?: string; plan?: string; status?: string }> | undefined;

  const tenantUsers = useQuery(
    api.admin.listTenantUsers as any,
    selectedTenantId ? { businessId: selectedTenantId } : undefined
  ) as Array<{ _id: string; name?: string; email?: string; role?: string }> | undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle id="section-tenants">Tenants</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Read-only list of tenants. Select a tenant to view its users and API keys.
        </p>

        <div className="rounded-md border overflow-hidden">
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2 p-3 bg-muted/40 text-xs font-medium">
            <div>Name</div>
            <div className="hidden md:block">Plan</div>
            <div>Status</div>
            <div className="hidden md:block">Id</div>
            <div className="text-right">Select</div>
          </div>
          <Separator />
          <div className="divide-y">
            {(tenants || []).map((t) => (
              <div key={t._id} className="grid grid-cols-3 md:grid-cols-5 gap-2 p-3 text-sm items-center">
                <div className="truncate">{t.name || "Tenant"}</div>
                <div className="hidden md:block">{t.plan || "—"}</div>
                <div>{t.status || "active"}</div>
                <div className="hidden md:block text-muted-foreground truncate">{t._id}</div>
                <div className="text-right">
                  <Button
                    size="sm"
                    variant={selectedTenantId === t._id ? "default" : "outline"}
                    onClick={() => onSelectTenant(selectedTenantId === t._id ? "" : t._id)}
                  >
                    {selectedTenantId === t._id ? "Selected" : "Select"}
                  </Button>
                </div>
              </div>
            ))}
            {(!tenants || tenants.length === 0) && (
              <div className="p-3 text-sm text-muted-foreground">No tenants found.</div>
            )}
          </div>
        </div>

        {selectedTenantId && (
          <div className="rounded-md border p-3">
            <div className="font-medium mb-2">Tenant Users</div>
            <div className="rounded-md border overflow-hidden">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 bg-muted/40 text-xs font-medium">
                <div>Name</div>
                <div>Email</div>
                <div className="hidden md:block">Role</div>
                <div className="text-right">Id</div>
              </div>
              <Separator />
              <div className="divide-y">
                {(tenantUsers || []).map((u) => (
                  <div key={u._id} className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 text-sm items-center">
                    <div className="truncate">{u.name || "User"}</div>
                    <div className="truncate">{u.email || "—"}</div>
                    <div className="hidden md:block">{u.role || "member"}</div>
                    <div className="text-right text-muted-foreground truncate">{u._id}</div>
                  </div>
                ))}
                {(!tenantUsers || tenantUsers.length === 0) && (
                  <div className="p-3 text-sm text-muted-foreground">No users for this tenant.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
