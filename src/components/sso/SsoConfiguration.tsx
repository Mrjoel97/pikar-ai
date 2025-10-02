import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Shield, CheckCircle, XCircle } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface SsoConfigurationProps {
  businessId: Id<"businesses">;
}

export function SsoConfiguration({ businessId }: SsoConfigurationProps) {
  const samlConfig = useQuery(api.saml.getSAMLConfig, { businessId });
  const oidcConfig = useQuery(api.oidc.getOIDCConfig, { businessId });

  const createSAML = useMutation(api.saml.createSAMLConfig);
  const toggleSAML = useMutation(api.saml.toggleSAMLConfig);
  const createOIDC = useMutation(api.oidc.createOIDCConfig);
  const toggleOIDC = useMutation(api.oidc.toggleOIDCConfig);

  // SAML state
  const [samlEntityId, setSamlEntityId] = useState(samlConfig?.idpEntityId || "");
  const [samlSsoUrl, setSamlSsoUrl] = useState(samlConfig?.ssoUrl || "");
  const [samlCertificate, setSamlCertificate] = useState(samlConfig?.certificate || "");
  const [samlActive, setSamlActive] = useState(samlConfig?.active || false);

  // OIDC state
  const [oidcIssuer, setOidcIssuer] = useState(oidcConfig?.issuer || "");
  const [oidcClientId, setOidcClientId] = useState(oidcConfig?.clientId || "");
  const [oidcClientSecret, setOidcClientSecret] = useState(oidcConfig?.clientSecret || "");
  const [oidcActive, setOidcActive] = useState(oidcConfig?.active || false);

  const [saving, setSaving] = useState(false);

  const handleSaveSAML = async () => {
    if (!samlEntityId || !samlSsoUrl || !samlCertificate) {
      toast.error("Please fill in all SAML fields");
      return;
    }

    setSaving(true);
    try {
      await createSAML({
        businessId,
        idpEntityId: samlEntityId,
        ssoUrl: samlSsoUrl,
        certificate: samlCertificate,
      });
      toast.success("SAML configuration saved successfully");
    } catch (error: any) {
      toast.error(`Failed to save SAML config: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSAML = async (active: boolean) => {
    try {
      await toggleSAML({ businessId, active });
      setSamlActive(active);
      toast.success(`SAML ${active ? "enabled" : "disabled"}`);
    } catch (error: any) {
      toast.error(`Failed to toggle SAML: ${error.message}`);
    }
  };

  const handleSaveOIDC = async () => {
    if (!oidcIssuer || !oidcClientId || !oidcClientSecret) {
      toast.error("Please fill in all OIDC fields");
      return;
    }

    setSaving(true);
    try {
      await createOIDC({
        businessId,
        issuer: oidcIssuer,
        clientId: oidcClientId,
        clientSecret: oidcClientSecret,
      });
      toast.success("OIDC configuration saved successfully");
    } catch (error: any) {
      toast.error(`Failed to save OIDC config: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleOIDC = async (active: boolean) => {
    try {
      await toggleOIDC({ businessId, active });
      setOidcActive(active);
      toast.success(`OIDC ${active ? "enabled" : "disabled"}`);
    } catch (error: any) {
      toast.error(`Failed to toggle OIDC: ${error.message}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          SSO Configuration
        </CardTitle>
        <CardDescription>
          Configure SAML 2.0 or OIDC for enterprise single sign-on
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="saml" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="saml">SAML 2.0</TabsTrigger>
            <TabsTrigger value="oidc">OIDC</TabsTrigger>
          </TabsList>

          <TabsContent value="saml" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label>Status:</Label>
                {samlConfig?.active ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-gray-500">
                    <XCircle className="h-4 w-4" />
                    Inactive
                  </span>
                )}
              </div>
              {samlConfig && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="saml-active">Enable SAML</Label>
                  <Switch
                    id="saml-active"
                    checked={samlActive}
                    onCheckedChange={handleToggleSAML}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="saml-entity-id">IdP Entity ID</Label>
              <Input
                id="saml-entity-id"
                placeholder="https://idp.example.com/metadata"
                value={samlEntityId}
                onChange={(e) => setSamlEntityId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="saml-sso-url">SSO URL</Label>
              <Input
                id="saml-sso-url"
                placeholder="https://idp.example.com/sso"
                value={samlSsoUrl}
                onChange={(e) => setSamlSsoUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="saml-certificate">X.509 Certificate</Label>
              <Textarea
                id="saml-certificate"
                placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                value={samlCertificate}
                onChange={(e) => setSamlCertificate(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSaveSAML} disabled={saving}>
                {saving ? "Saving..." : "Save Configuration"}
              </Button>
              <Button variant="outline" disabled>
                Test SAML
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="oidc" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label>Status:</Label>
                {oidcConfig?.active ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-gray-500">
                    <XCircle className="h-4 w-4" />
                    Inactive
                  </span>
                )}
              </div>
              {oidcConfig && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="oidc-active">Enable OIDC</Label>
                  <Switch
                    id="oidc-active"
                    checked={oidcActive}
                    onCheckedChange={handleToggleOIDC}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="oidc-issuer">Issuer URL</Label>
              <Input
                id="oidc-issuer"
                placeholder="https://accounts.google.com"
                value={oidcIssuer}
                onChange={(e) => setOidcIssuer(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="oidc-client-id">Client ID</Label>
              <Input
                id="oidc-client-id"
                placeholder="your-client-id"
                value={oidcClientId}
                onChange={(e) => setOidcClientId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="oidc-client-secret">Client Secret</Label>
              <Input
                id="oidc-client-secret"
                type="password"
                placeholder="your-client-secret"
                value={oidcClientSecret}
                onChange={(e) => setOidcClientSecret(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Redirect URI</Label>
              <Input
                value={`${window.location.origin}/auth/oidc/callback`}
                readOnly
                className="bg-gray-50"
              />
              <p className="text-sm text-gray-500">
                Configure this URL in your OIDC provider
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSaveOIDC} disabled={saving}>
                {saving ? "Saving..." : "Save Configuration"}
              </Button>
              <Button variant="outline" disabled>
                Test OIDC
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
