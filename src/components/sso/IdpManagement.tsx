import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Trash2, Edit, CheckCircle, XCircle } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface IdpManagementProps {
  businessId: Id<"businesses">;
}

export function IdpManagement({ businessId }: IdpManagementProps) {
  const samlConfigs = useQuery(api.saml.listSAMLConfigs, { businessId });
  const oidcConfigs = useQuery(api.oidc.listOIDCConfigs, { businessId });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>(null);
  const [idpType, setIdpType] = useState<"saml" | "oidc">("saml");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Identity Providers</h2>
          <p className="text-gray-600">Manage SAML and OIDC identity providers</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingConfig(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Identity Provider
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingConfig ? "Edit Identity Provider" : "Add Identity Provider"}
              </DialogTitle>
              <DialogDescription>
                Configure a new SAML 2.0 or OIDC identity provider
              </DialogDescription>
            </DialogHeader>
            <IdpConfigForm
              businessId={businessId}
              config={editingConfig}
              onClose={() => {
                setDialogOpen(false);
                setEditingConfig(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="saml" className="w-full">
        <TabsList>
          <TabsTrigger value="saml">SAML 2.0</TabsTrigger>
          <TabsTrigger value="oidc">OIDC</TabsTrigger>
        </TabsList>

        <TabsContent value="saml" className="space-y-4">
          {samlConfigs?.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                No SAML identity providers configured
              </CardContent>
            </Card>
          ) : (
            samlConfigs?.map((config: any) => (
              <IdpCard
                key={config._id}
                config={config}
                type="saml"
                onEdit={() => {
                  setEditingConfig(config);
                  setDialogOpen(true);
                }}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="oidc" className="space-y-4">
          {oidcConfigs?.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                No OIDC identity providers configured
              </CardContent>
            </Card>
          ) : (
            oidcConfigs?.map((config: any) => (
              <IdpCard
                key={config._id}
                config={config}
                type="oidc"
                onEdit={() => {
                  setEditingConfig(config);
                  setDialogOpen(true);
                }}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function IdpCard({ config, type, onEdit }: any) {
  const toggleSAML = useMutation(api.saml.toggleSAMLConfig);
  const toggleOIDC = useMutation(api.oidc.toggleOIDCConfig);
  const deleteSAML = useMutation(api.saml.deleteSAMLConfig);
  const deleteOIDC = useMutation(api.oidc.deleteOIDCConfig);

  const handleToggle = async (active: boolean) => {
    try {
      if (type === "saml") {
        await toggleSAML({ configId: config._id, active });
      } else {
        await toggleOIDC({ configId: config._id, active });
      }
      toast.success(`Identity provider ${active ? "enabled" : "disabled"}`);
    } catch (error: any) {
      toast.error(`Failed to toggle: ${error.message}`);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${config.name}"?`)) return;
    
    try {
      if (type === "saml") {
        await deleteSAML({ configId: config._id });
      } else {
        await deleteOIDC({ configId: config._id });
      }
      toast.success("Identity provider deleted");
    } catch (error: any) {
      toast.error(`Failed to delete: ${error.message}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {config.name}
              <Badge variant={config.active ? "default" : "secondary"}>
                {type.toUpperCase()}
              </Badge>
            </CardTitle>
            <CardDescription>
              {type === "saml" ? config.idpEntityId : config.issuer}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {config.active ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>Status</Label>
            <div className="flex items-center gap-2">
              <Switch
                checked={config.active}
                onCheckedChange={handleToggle}
              />
              <span className="text-sm text-gray-600">
                {config.active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Label className="text-gray-600">JIT Provisioning</Label>
            <p className="font-medium">
              {config.jitProvisioning ? "Enabled" : "Disabled"}
            </p>
          </div>
          <div>
            <Label className="text-gray-600">Created</Label>
            <p className="font-medium">
              {new Date(config.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function IdpConfigForm({ businessId, config, onClose }: any) {
  const [idpType, setIdpType] = useState<"saml" | "oidc">(config ? (config.idpEntityId ? "saml" : "oidc") : "saml");
  const [name, setName] = useState(config?.name || "");
  const [idpEntityId, setIdpEntityId] = useState(config?.idpEntityId || "");
  const [ssoUrl, setSsoUrl] = useState(config?.ssoUrl || "");
  const [certificate, setCertificate] = useState(config?.certificate || "");
  const [issuer, setIssuer] = useState(config?.issuer || "");
  const [clientId, setClientId] = useState(config?.clientId || "");
  const [clientSecret, setClientSecret] = useState(config?.clientSecret || "");
  const [jitProvisioning, setJitProvisioning] = useState(config?.jitProvisioning ?? true);

  const createSAML = useMutation(api.saml.createSAMLConfig);
  const updateSAML = useMutation(api.saml.updateSAMLConfig);
  const createOIDC = useMutation(api.oidc.createOIDCConfig);
  const updateOIDC = useMutation(api.oidc.updateOIDCConfig);

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name) {
      toast.error("Please enter a name");
      return;
    }

    setSaving(true);
    try {
      if (idpType === "saml") {
        if (!idpEntityId || !ssoUrl || !certificate) {
          toast.error("Please fill in all SAML fields");
          return;
        }
        if (config) {
          await updateSAML({
            configId: config._id,
            name,
            idpEntityId,
            ssoUrl,
            certificate,
            jitProvisioning,
          });
        } else {
          await createSAML({
            businessId,
            name,
            idpEntityId,
            ssoUrl,
            certificate,
            jitProvisioning,
          });
        }
      } else {
        if (!issuer || !clientId || !clientSecret) {
          toast.error("Please fill in all OIDC fields");
          return;
        }
        if (config) {
          await updateOIDC({
            configId: config._id,
            name,
            issuer,
            clientId,
            clientSecret,
            jitProvisioning,
          });
        } else {
          await createOIDC({
            businessId,
            name,
            issuer,
            clientId,
            clientSecret,
            jitProvisioning,
          });
        }
      }
      toast.success(`Identity provider ${config ? "updated" : "created"} successfully`);
      onClose();
    } catch (error: any) {
      toast.error(`Failed to save: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {!config && (
        <Tabs value={idpType} onValueChange={(v) => setIdpType(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="saml">SAML 2.0</TabsTrigger>
            <TabsTrigger value="oidc">OIDC</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Provider Name *</Label>
        <Input
          id="name"
          placeholder="e.g., Okta, Azure AD, Google Workspace"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {idpType === "saml" ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="idp-entity-id">IdP Entity ID *</Label>
            <Input
              id="idp-entity-id"
              placeholder="https://idp.example.com/metadata"
              value={idpEntityId}
              onChange={(e) => setIdpEntityId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sso-url">SSO URL *</Label>
            <Input
              id="sso-url"
              placeholder="https://idp.example.com/sso"
              value={ssoUrl}
              onChange={(e) => setSsoUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="certificate">X.509 Certificate *</Label>
            <Textarea
              id="certificate"
              placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
              value={certificate}
              onChange={(e) => setCertificate(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
          </div>
        </>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="issuer">Issuer URL *</Label>
            <Input
              id="issuer"
              placeholder="https://accounts.google.com"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-id">Client ID *</Label>
            <Input
              id="client-id"
              placeholder="your-client-id"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-secret">Client Secret *</Label>
            <Input
              id="client-secret"
              type="password"
              placeholder="your-client-secret"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
            />
          </div>
        </>
      )}

      <div className="flex items-center gap-2">
        <Switch
          id="jit-provisioning"
          checked={jitProvisioning}
          onCheckedChange={setJitProvisioning}
        />
        <Label htmlFor="jit-provisioning">Enable JIT Provisioning</Label>
      </div>

      <div className="flex gap-2 pt-4">
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? "Saving..." : config ? "Update" : "Create"}
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}