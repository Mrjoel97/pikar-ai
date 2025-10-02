import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

interface KmsConfigurationProps {
  businessId: Id<"businesses">;
}

export function KmsConfiguration({ businessId }: KmsConfigurationProps) {
  const configs = useQuery(api.kms.getKmsConfig, { businessId });
  const saveConfig = useMutation(api.kms.saveKmsConfig);
  const testConfig = useAction(api.kms.testKmsConfig);

  // AWS State
  const [awsKeyId, setAwsKeyId] = useState("");
  const [awsRegion, setAwsRegion] = useState("");
  const [awsAccessKeyId, setAwsAccessKeyId] = useState("");
  const [awsSecretAccessKey, setAwsSecretAccessKey] = useState("");
  const [awsActive, setAwsActive] = useState(false);

  // Azure State
  const [azureKeyVaultUrl, setAzureKeyVaultUrl] = useState("");
  const [azureKeyName, setAzureKeyName] = useState("");
  const [azureTenantId, setAzureTenantId] = useState("");
  const [azureClientId, setAzureClientId] = useState("");
  const [azureClientSecret, setAzureClientSecret] = useState("");
  const [azureActive, setAzureActive] = useState(false);

  // Google State
  const [googleProjectId, setGoogleProjectId] = useState("");
  const [googleLocation, setGoogleLocation] = useState("");
  const [googleKeyRing, setGoogleKeyRing] = useState("");
  const [googleKeyName, setGoogleKeyName] = useState("");
  const [googleServiceAccount, setGoogleServiceAccount] = useState("");
  const [googleActive, setGoogleActive] = useState(false);

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // Load existing configs
  useState(() => {
    if (configs) {
      const awsConfig = configs.find((c: any) => c.provider === "aws");
      if (awsConfig) {
        setAwsKeyId(awsConfig.keyId);
        setAwsRegion(awsConfig.region || "");
        setAwsActive(awsConfig.active);
      }

      const azureConfig = configs.find((c: any) => c.provider === "azure");
      if (azureConfig) {
        setAzureKeyVaultUrl(azureConfig.keyVaultUrl || "");
        setAzureKeyName(azureConfig.keyId);
        setAzureActive(azureConfig.active);
      }

      const googleConfig = configs.find((c: any) => c.provider === "google");
      if (googleConfig) {
        setGoogleProjectId(googleConfig.projectId || "");
        setGoogleLocation(googleConfig.location || "");
        setGoogleKeyRing(googleConfig.keyRing || "");
        setGoogleKeyName(googleConfig.keyId);
        setGoogleActive(googleConfig.active);
      }
    }
  });

  const handleSaveAws = async () => {
    if (!awsKeyId || !awsRegion) {
      toast.error("Key ID and Region are required");
      return;
    }

    setSaving(true);
    try {
      const credentials =
        awsAccessKeyId && awsSecretAccessKey
          ? JSON.stringify({ accessKeyId: awsAccessKeyId, secretAccessKey: awsSecretAccessKey })
          : undefined;

      await saveConfig({
        businessId,
        provider: "aws",
        keyId: awsKeyId,
        region: awsRegion,
        credentials,
        active: awsActive,
      });

      toast.success("AWS KMS configuration saved");
    } catch (error: any) {
      toast.error(error.message || "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAzure = async () => {
    if (!azureKeyVaultUrl || !azureKeyName) {
      toast.error("Key Vault URL and Key Name are required");
      return;
    }

    setSaving(true);
    try {
      const credentials =
        azureTenantId && azureClientId && azureClientSecret
          ? JSON.stringify({ tenantId: azureTenantId, clientId: azureClientId, clientSecret: azureClientSecret })
          : undefined;

      await saveConfig({
        businessId,
        provider: "azure",
        keyId: azureKeyName,
        keyVaultUrl: azureKeyVaultUrl,
        credentials,
        active: azureActive,
      });

      toast.success("Azure Key Vault configuration saved");
    } catch (error: any) {
      toast.error(error.message || "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGoogle = async () => {
    if (!googleProjectId || !googleLocation || !googleKeyRing || !googleKeyName) {
      toast.error("All fields are required for Google Cloud KMS");
      return;
    }

    setSaving(true);
    try {
      const credentials = googleServiceAccount ? googleServiceAccount : undefined;

      await saveConfig({
        businessId,
        provider: "google",
        keyId: googleKeyName,
        projectId: googleProjectId,
        location: googleLocation,
        keyRing: googleKeyRing,
        credentials,
        active: googleActive,
      });

      toast.success("Google Cloud KMS configuration saved");
    } catch (error: any) {
      toast.error(error.message || "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const result = await testConfig({ businessId });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error(error.message || "Test failed");
    } finally {
      setTesting(false);
    }
  };

  const activeProvider = configs?.find((c: any) => c.active);

  return (
    <div className="space-y-6">
      {activeProvider && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Active KMS Provider</div>
                <div className="text-xs text-muted-foreground">
                  {activeProvider.provider.toUpperCase()} - {activeProvider.keyId}
                </div>
              </div>
              <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                Configured
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="aws" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="aws">AWS KMS</TabsTrigger>
          <TabsTrigger value="azure">Azure Key Vault</TabsTrigger>
          <TabsTrigger value="google">Google Cloud KMS</TabsTrigger>
        </TabsList>

        <TabsContent value="aws">
          <Card>
            <CardHeader>
              <CardTitle>AWS KMS Configuration</CardTitle>
              <CardDescription>Configure AWS Key Management Service for encryption</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="aws-active">Enable AWS KMS</Label>
                <Switch id="aws-active" checked={awsActive} onCheckedChange={setAwsActive} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aws-key-id">Key ID *</Label>
                <Input
                  id="aws-key-id"
                  placeholder="arn:aws:kms:us-east-1:123456789012:key/..."
                  value={awsKeyId}
                  onChange={(e) => setAwsKeyId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aws-region">Region *</Label>
                <Input
                  id="aws-region"
                  placeholder="us-east-1"
                  value={awsRegion}
                  onChange={(e) => setAwsRegion(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aws-access-key">Access Key ID (Optional)</Label>
                <Input
                  id="aws-access-key"
                  type="password"
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                  value={awsAccessKeyId}
                  onChange={(e) => setAwsAccessKeyId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aws-secret-key">Secret Access Key (Optional)</Label>
                <Input
                  id="aws-secret-key"
                  type="password"
                  placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                  value={awsSecretAccessKey}
                  onChange={(e) => setAwsSecretAccessKey(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveAws} disabled={saving}>
                  {saving ? "Saving..." : "Save Configuration"}
                </Button>
                <Button variant="outline" onClick={handleTest} disabled={testing || !awsActive}>
                  {testing ? "Testing..." : "Test Encryption"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="azure">
          <Card>
            <CardHeader>
              <CardTitle>Azure Key Vault Configuration</CardTitle>
              <CardDescription>Configure Azure Key Vault for encryption</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="azure-active">Enable Azure Key Vault</Label>
                <Switch id="azure-active" checked={azureActive} onCheckedChange={setAzureActive} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="azure-vault-url">Key Vault URL *</Label>
                <Input
                  id="azure-vault-url"
                  placeholder="https://myvault.vault.azure.net/"
                  value={azureKeyVaultUrl}
                  onChange={(e) => setAzureKeyVaultUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="azure-key-name">Key Name *</Label>
                <Input
                  id="azure-key-name"
                  placeholder="my-encryption-key"
                  value={azureKeyName}
                  onChange={(e) => setAzureKeyName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="azure-tenant-id">Tenant ID (Optional)</Label>
                <Input
                  id="azure-tenant-id"
                  placeholder="00000000-0000-0000-0000-000000000000"
                  value={azureTenantId}
                  onChange={(e) => setAzureTenantId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="azure-client-id">Client ID (Optional)</Label>
                <Input
                  id="azure-client-id"
                  placeholder="00000000-0000-0000-0000-000000000000"
                  value={azureClientId}
                  onChange={(e) => setAzureClientId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="azure-client-secret">Client Secret (Optional)</Label>
                <Input
                  id="azure-client-secret"
                  type="password"
                  placeholder="Your client secret"
                  value={azureClientSecret}
                  onChange={(e) => setAzureClientSecret(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveAzure} disabled={saving}>
                  {saving ? "Saving..." : "Save Configuration"}
                </Button>
                <Button variant="outline" onClick={handleTest} disabled={testing || !azureActive}>
                  {testing ? "Testing..." : "Test Encryption"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="google">
          <Card>
            <CardHeader>
              <CardTitle>Google Cloud KMS Configuration</CardTitle>
              <CardDescription>Configure Google Cloud Key Management Service for encryption</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="google-active">Enable Google Cloud KMS</Label>
                <Switch id="google-active" checked={googleActive} onCheckedChange={setGoogleActive} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="google-project-id">Project ID *</Label>
                <Input
                  id="google-project-id"
                  placeholder="my-project-123456"
                  value={googleProjectId}
                  onChange={(e) => setGoogleProjectId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="google-location">Location *</Label>
                <Input
                  id="google-location"
                  placeholder="us-east1"
                  value={googleLocation}
                  onChange={(e) => setGoogleLocation(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="google-key-ring">Key Ring *</Label>
                <Input
                  id="google-key-ring"
                  placeholder="my-key-ring"
                  value={googleKeyRing}
                  onChange={(e) => setGoogleKeyRing(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="google-key-name">Key Name *</Label>
                <Input
                  id="google-key-name"
                  placeholder="my-encryption-key"
                  value={googleKeyName}
                  onChange={(e) => setGoogleKeyName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="google-service-account">Service Account JSON (Optional)</Label>
                <Textarea
                  id="google-service-account"
                  placeholder='{"type": "service_account", ...}'
                  value={googleServiceAccount}
                  onChange={(e) => setGoogleServiceAccount(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveGoogle} disabled={saving}>
                  {saving ? "Saving..." : "Save Configuration"}
                </Button>
                <Button variant="outline" onClick={handleTest} disabled={testing || !googleActive}>
                  {testing ? "Testing..." : "Test Encryption"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}