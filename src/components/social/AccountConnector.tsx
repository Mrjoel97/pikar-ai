import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { 
  Link, 
  Unlink, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Twitter,
  Linkedin,
  Facebook
} from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface AccountConnectorProps {
  businessId: Id<"businesses"> | null | undefined;
}

export function AccountConnector({ businessId }: AccountConnectorProps) {
  const connectedAccounts = useQuery(
    api.socialIntegrations.listConnectedAccounts,
    businessId ? { businessId } : undefined
  );
  const disconnectAccount = useMutation(api.socialIntegrations.disconnectSocialAccount);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const platforms = [
    { 
      id: "twitter", 
      name: "Twitter/X", 
      color: "bg-blue-500",
      icon: Twitter,
      permissions: ["Post tweets", "Read timeline", "Access DMs"]
    },
    { 
      id: "linkedin", 
      name: "LinkedIn", 
      color: "bg-blue-700",
      icon: Linkedin,
      permissions: ["Share posts", "Read profile", "Access connections"]
    },
    { 
      id: "facebook", 
      name: "Facebook", 
      color: "bg-blue-600",
      icon: Facebook,
      permissions: ["Publish posts", "Manage pages", "Read insights"]
    },
  ];

  const handleConnect = async (platform: "twitter" | "linkedin" | "facebook") => {
    if (!businessId) {
      toast.error("Please sign in to connect a social account");
      return;
    }
    
    try {
      // Get OAuth URL from backend
      const authUrl = await fetch(`/api/social/oauth/${platform}?businessId=${businessId}`).then(r => r.json());
      
      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        authUrl.url || `${window.location.origin}/auth/callback/${platform}`,
        `${platform}_oauth`,
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for OAuth callback
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === "oauth_success" && event.data.platform === platform) {
          toast.success(`${platform} connected successfully!`);
          window.removeEventListener("message", handleMessage);
        } else if (event.data.type === "oauth_error" && event.data.platform === platform) {
          toast.error(`Failed to connect ${platform}: ${event.data.error}`);
          window.removeEventListener("message", handleMessage);
        }
      };

      window.addEventListener("message", handleMessage);

      // Cleanup if popup is closed
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener("message", handleMessage);
        }
      }, 1000);
    } catch (error: any) {
      toast.error(`Failed to initiate ${platform} OAuth: ${error.message}`);
    }
  };

  const handleDisconnect = async (accountId: Id<"socialAccounts">) => {
    try {
      setDisconnecting(accountId);
      await disconnectAccount({ accountId });
      toast.success("Account disconnected successfully");
    } catch (error: any) {
      toast.error(error?.message || "Failed to disconnect account");
    } finally {
      setDisconnecting(null);
    }
  };

  const getAccountHealth = (account: any) => {
    // Check token expiration
    if (account.tokenExpiresAt && account.tokenExpiresAt < Date.now()) {
      return { status: "expired", message: "Token expired - reconnect required" };
    }
    
    // Check last usage (warn if not used in 30 days)
    if (account.lastUsedAt && Date.now() - account.lastUsedAt > 30 * 24 * 60 * 60 * 1000) {
      return { status: "inactive", message: "Not used in 30+ days" };
    }
    
    return { status: "healthy", message: "Active and connected" };
  };

  // Show sign-in prompt if no businessId
  if (!businessId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Social Media Accounts
          </CardTitle>
          <CardDescription>
            Connect your social media accounts to schedule and publish posts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Please sign in to connect your social media accounts.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-5 w-5" />
          Social Media Accounts
        </CardTitle>
        <CardDescription>
          Connect and manage your social media accounts for automated posting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Available Platforms */}
        <div className="space-y-3">
          {platforms.map((platform) => {
            const account = connectedAccounts?.find(
              (acc: any) => acc.platform === platform.id
            );
            const isConnected = !!account;
            const health = account ? getAccountHealth(account) : null;
            const PlatformIcon = platform.icon;

            return (
              <Card key={platform.id} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${platform.color} flex items-center justify-center`}>
                        <PlatformIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium">{platform.name}</h3>
                        {isConnected && account && (
                          <p className="text-xs text-muted-foreground">
                            @{account.accountName}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {isConnected ? (
                      <Badge 
                        variant={health?.status === "healthy" ? "default" : "destructive"}
                        className="flex items-center gap-1"
                      >
                        {health?.status === "healthy" ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                        {health?.status === "healthy" ? "Connected" : "Needs Attention"}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-500">
                        <XCircle className="h-3 w-3 mr-1" />
                        Not Connected
                      </Badge>
                    )}
                  </div>

                  {isConnected && account ? (
                    <div className="space-y-3">
                      {/* Health Status */}
                      {health && health.status !== "healthy" && (
                        <Alert variant="destructive" className="py-2">
                          <AlertDescription className="text-xs">
                            {health.message}
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Account Details */}
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>Connected: {new Date(account.connectedAt).toLocaleDateString()}</p>
                        {account.lastUsedAt && (
                          <p>Last used: {new Date(account.lastUsedAt).toLocaleDateString()}</p>
                        )}
                        {account.tokenExpiresAt && (
                          <p>Token expires: {new Date(account.tokenExpiresAt).toLocaleDateString()}</p>
                        )}
                      </div>

                      {/* Permissions */}
                      <div className="space-y-1">
                        <p className="text-xs font-medium">Permissions:</p>
                        <div className="flex flex-wrap gap-1">
                          {platform.permissions.map((perm) => (
                            <Badge key={perm} variant="secondary" className="text-xs">
                              {perm}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        {health?.status !== "healthy" && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleConnect(platform.id as any)}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Reconnect
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDisconnect(account._id)}
                          disabled={disconnecting === account._id}
                        >
                          <Unlink className="h-3 w-3 mr-1" />
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Permissions Preview */}
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          Will request permissions:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {platform.permissions.map((perm) => (
                            <Badge key={perm} variant="outline" className="text-xs">
                              {perm}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => handleConnect(platform.id as any)}
                      >
                        <Link className="h-3 w-3 mr-1" />
                        Connect {platform.name}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Summary */}
        {connectedAccounts && connectedAccounts.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {connectedAccounts.length} account{connectedAccounts.length !== 1 ? "s" : ""} connected
              </span>
              <Badge variant="outline">
                {connectedAccounts.filter((acc: any) => {
                  const health = getAccountHealth(acc);
                  return health.status === "healthy";
                }).length} healthy
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}