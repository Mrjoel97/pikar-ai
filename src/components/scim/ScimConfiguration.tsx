import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Check, Key, Info } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

interface ScimConfigurationProps {
  businessId: Id<"businesses">;
}

export default function ScimConfiguration({ businessId }: ScimConfigurationProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [bearerToken, setBearerToken] = useState<string | null>(null);
  
  const generateToken = useMutation(api.scim.generateScimToken);

  const baseUrl = import.meta.env.VITE_PUBLIC_BASE_URL || window.location.origin;
  const scimEndpoint = `${baseUrl}/scim/v2`;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleGenerateToken = async () => {
    try {
      const token = await generateToken({ businessId });
      setBearerToken(token);
      toast.success("Bearer token generated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate token");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>SCIM Configuration</CardTitle>
          <CardDescription>
            Configure your Identity Provider (IdP) to provision users and groups automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* SCIM Base URL */}
          <div className="space-y-2">
            <Label htmlFor="scim-url">SCIM Base URL</Label>
            <div className="flex gap-2">
              <Input
                id="scim-url"
                value={scimEndpoint}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopy(scimEndpoint, "SCIM URL")}
              >
                {copied === "SCIM URL" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Bearer Token */}
          <div className="space-y-2">
            <Label htmlFor="bearer-token">Bearer Token</Label>
            <div className="flex gap-2">
              {bearerToken ? (
                <>
                  <Input
                    id="bearer-token"
                    value={bearerToken}
                    readOnly
                    type="password"
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(bearerToken, "Bearer Token")}
                  >
                    {copied === "Bearer Token" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </>
              ) : (
                <Button onClick={handleGenerateToken} className="gap-2">
                  <Key className="h-4 w-4" />
                  Generate Bearer Token
                </Button>
              )}
            </div>
            {bearerToken && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Save this token securely. You won't be able to see it again.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Configuration Instructions */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold">Configuration Instructions</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground mb-1">1. In your IdP (Okta, Azure AD, etc.):</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Navigate to the SCIM configuration section</li>
                  <li>Enter the SCIM Base URL above</li>
                  <li>Set authentication to "Bearer Token"</li>
                  <li>Paste the generated bearer token</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">2. Supported Endpoints:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><code className="text-xs bg-muted px-1 py-0.5 rounded">/scim/v2/Users</code> - User provisioning</li>
                  <li><code className="text-xs bg-muted px-1 py-0.5 rounded">/scim/v2/Groups</code> - Group provisioning</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">3. Supported Operations:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Create, Read, Update, Delete (CRUD) for users and groups</li>
                  <li>Automatic user activation/deactivation</li>
                  <li>Group membership management</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
