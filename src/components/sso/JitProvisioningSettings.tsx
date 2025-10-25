import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Users } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface JitProvisioningSettingsProps {
  businessId: Id<"businesses">;
}

export function JitProvisioningSettings({ businessId }: JitProvisioningSettingsProps) {
  const samlConfigs = useQuery(api.saml.listSAMLConfigs, { businessId });
  const oidcConfigs = useQuery(api.oidc.listOIDCConfigs, { businessId });

  const allConfigs = [
    ...(samlConfigs?.map((c) => ({ ...c, type: "saml" as const })) || []),
    ...(oidcConfigs?.map((c) => ({ ...c, type: "oidc" as const })) || []),
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Just-In-Time Provisioning
          </CardTitle>
          <CardDescription>
            Automatically create user accounts when users sign in via SSO for the first time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
              <p className="font-semibold mb-2">How JIT Provisioning Works:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>User authenticates with identity provider</li>
                <li>System checks if user exists in Pikar AI</li>
                <li>If not found, creates new user account automatically</li>
                <li>User attributes are mapped from IdP to internal fields</li>
                <li>User is granted access based on default role settings</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">JIT Status by Identity Provider</h3>
              {allConfigs.length === 0 ? (
                <p className="text-gray-500 text-sm">No identity providers configured</p>
              ) : (
                <div className="space-y-2">
                  {allConfigs.map((config) => (
                    <div
                      key={config._id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{config.name}</p>
                          <p className="text-sm text-gray-600">
                            {config.type.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {config.jitProvisioning ? (
                          <>
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <Badge variant="default">Enabled</Badge>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-5 w-5 text-gray-400" />
                            <Badge variant="secondary">Disabled</Badge>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold mb-2">⚠️ Security Considerations:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Ensure your IdP is properly configured and secured</li>
                <li>Review attribute mappings to prevent data leakage</li>
                <li>Set appropriate default roles for new users</li>
                <li>Monitor JIT provisioning events in analytics</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
