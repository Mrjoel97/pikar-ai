import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface ApiKeysPanelProps {
  selectedTenantId: string;
  tenants: Array<{ _id: string; name?: string }> | undefined;
  onSelectTenant: (tenantId: string) => void;
}

export function ApiKeysPanel({ selectedTenantId, tenants, onSelectTenant }: ApiKeysPanelProps) {
  const [newKeyName, setNewKeyName] = useState<string>("");
  const [newKeyScopes, setNewKeyScopes] = useState<string>("");
  const [freshSecret, setFreshSecret] = useState<string | null>(null);

  const apiKeys = useQuery(
    api.admin.listApiKeys as any,
    selectedTenantId ? { tenantId: selectedTenantId } : undefined
  ) as Array<{ _id: string; name: string; scopes: string[]; createdAt: number; revokedAt?: number }> | undefined;

  const createApiKey = useMutation(api.admin.createApiKey as any);
  const revokeApiKey = useMutation(api.admin.revokeApiKey as any);

  const handleCreateKey = async () => {
    if (!selectedTenantId) {
      toast.error("Select a tenant first.");
      return;
    }
    if (!newKeyName.trim()) {
      toast.error("Enter a key name.");
      return;
    }
    try {
      toast("Creating API key...");
      const scopesArr = newKeyScopes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await createApiKey({
        tenantId: selectedTenantId,
        name: newKeyName.trim(),
        scopes: scopesArr,
      } as any);
      setFreshSecret(res?.secret || null);
      if (res?.secret) {
        toast.success("Key created. Copy and store it securely.");
      } else {
        toast.success("Key created.");
      }
      setNewKeyName("");
    } catch (e: any) {
      toast.error(e?.message || "Failed to create API key");
    }
  };

  const handleRevokeKey = async (apiKeyId: string) => {
    try {
      await revokeApiKey({ apiKeyId } as any);
      toast.success("Key revoked");
    } catch (e: any) {
      toast.error(e?.message || "Failed to revoke key");
    }
  };

  const handleCopySecret = () => {
    if (freshSecret) {
      navigator.clipboard.writeText(freshSecret).then(() => {
        toast.success("Copied API key secret");
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle id="section-api-keys">API Keys</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Keys are scoped to the selected tenant. New keys are shown once; the secret cannot be retrieved again.
        </p>

        <div className="grid md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <div className="text-sm font-medium">Tenant</div>
            <select
              className="h-9 rounded-md border bg-background px-3 text-sm w-full"
              value={selectedTenantId}
              onChange={(e) => onSelectTenant(e.target.value)}
            >
              <option value="">Select a tenant</option>
              {(tenants || []).map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name || t._id}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="text-sm font-medium">Key Name</div>
            <Input
              placeholder="Server Key"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <div className="text-sm font-medium">Scopes (comma-separated)</div>
            <Input
              placeholder="admin:read,admin:write"
              value={newKeyScopes}
              onChange={(e) => setNewKeyScopes(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleCreateKey} disabled={!selectedTenantId}>
            Generate Key
          </Button>

          {freshSecret && (
            <Button size="sm" variant="outline" onClick={handleCopySecret}>
              Copy New Key
            </Button>
          )}
        </div>

        {freshSecret && (
          <div className="p-3 rounded-md border bg-amber-50 text-amber-900 text-sm">
            This secret will not be shown again. Copy and store it securely now.
          </div>
        )}

        <div className="rounded-md border overflow-hidden">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 p-3 bg-muted/40 text-xs font-medium">
            <div>Name</div>
            <div className="hidden md:block">Scopes</div>
            <div>Created</div>
            <div className="hidden md:block">Revoked</div>
            <div className="hidden md:block">Id</div>
            <div className="text-right">Action</div>
          </div>
          <Separator />
          <div className="divide-y">
            {(apiKeys || []).map((k) => (
              <div key={k._id} className="grid grid-cols-3 md:grid-cols-6 gap-2 p-3 text-sm items-center">
                <div className="truncate">{k.name}</div>
                <div className="hidden md:block truncate">{(k.scopes || []).join(", ") || "—"}</div>
                <div className="truncate">{new Date(k.createdAt).toLocaleString()}</div>
                <div className="hidden md:block">{k.revokedAt ? new Date(k.revokedAt).toLocaleString() : "—"}</div>
                <div className="hidden md:block text-muted-foreground truncate">{k._id}</div>
                <div className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!!k.revokedAt}
                    onClick={() => handleRevokeKey(k._id)}
                  >
                    Revoke
                  </Button>
                </div>
              </div>
            ))}
            {(!apiKeys || apiKeys.length === 0) && (
              <div className="p-3 text-sm text-muted-foreground">
                {selectedTenantId ? "No API keys for this tenant yet." : "Select a tenant to view keys."}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
