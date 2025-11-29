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
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Link className="h-4 w-4 md:h-5 md:w-5" />
            Social Media Accounts
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Connect your social media accounts to schedule and publish posts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription className="text-xs md:text-sm">
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
        <CardTitle className="flex items-center gap-2 text-base md:text-lg lg:text-xl">
          <Link className="h-4 w-4 md:h-5 md:w-5" />
          Social Media Accounts
        </CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Connect and manage your social media accounts for automated posting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 md:space-y-4">
        {/* Available Platforms */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {platforms.map((platform) => {
            const account = connectedAccounts?.find(
              (acc: any) => acc.platform === platform.id
            );
            const isConnected = !!account;
            const health = account ? getAccountHealth(account) : null;
            const PlatformIcon = platform.icon;

            return (
              <Card key={platform.id} className="relative overflow-hidden">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-start justify-between mb-2 md:mb-3 gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={`w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 rounded-lg ${platform.color} flex items-center justify-center flex-shrink-0`}>
                        <PlatformIcon className="h-3.5 w-3.5 md:h-4 md:w-4 lg:h-5 lg:w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-xs md:text-sm lg:text-base truncate">{platform.name}</h3>
                        {isConnected && account && (
                          <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                            @{account.accountName}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {isConnected ? (
                      <Badge 
                        variant={health?.status === "healthy" ? "default" : "destructive"}
                        className="flex items-center gap-0.5 md:gap-1 text-[10px] md:text-xs flex-shrink-0 px-1.5 py-0"
                      >
                        {health?.status === "healthy" ? (
                          <CheckCircle className="h-2.5 w-2.5 md:h-3 md:w-3" />
                        ) : (
                          <AlertTriangle className="h-2.5 w-2.5 md:h-3 md:w-3" />
                        )}
                        <span className="hidden sm:inline">{health?.status === "healthy" ? "Connected" : "Attention"}</span>
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-500 text-[10px] md:text-xs flex-shrink-0 px-1.5 py-0">
                        <XCircle className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5 md:mr-1" />
                        <span className="hidden sm:inline">Not Connected</span>
                      </Badge>
                    )}
                  </div>

                  {isConnected && account ? (
                    <div className="space-y-2 md:space-y-3">
                      {/* Health Status */}
                      {health && health.status !== "healthy" && (
                        <Alert variant="destructive" className="py-1.5 md:py-2">
                          <AlertDescription className="text-[10px] md:text-xs">
                            {health.message}
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Account Details */}
                      <div className="space-y-0.5 md:space-y-1 text-[10px] md:text-xs text-muted-foreground">
                        <p className="truncate">
                          <span className="hidden sm:inline">Connected: </span>
                          {new Date(account.connectedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        {account.lastUsedAt && (
                          <p className="truncate">
                            <span className="hidden sm:inline">Last used: </span>
                            <span className="sm:hidden">Used: </span>
                            {new Date(account.lastUsedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </p>
                        )}
                        {account.tokenExpiresAt && (
                          <p className="truncate">
                            <span className="hidden sm:inline">Token expires: </span>
                            <span className="sm:hidden">Expires: </span>
                            {new Date(account.tokenExpiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </p>
                        )}
                      </div>

                      {/* Permissions */}
                      <div className="space-y-1">
                        <p className="text-[10px] md:text-xs font-medium">Permissions:</p>
                        <div className="flex flex-wrap gap-1">
                          {platform.permissions.map((perm) => (
                            <Badge key={perm} variant="secondary" className="text-[10px] px-1.5 py-0">
                              {perm}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-1.5 md:gap-2 pt-1 md:pt-2">
                        {health?.status !== "healthy" && (
                          <Button
                            size="sm"
                            variant="default"
                            className="w-full sm:w-auto text-[10px] md:text-xs h-7 md:h-8 px-2 md:px-3"
                            onClick={() => handleConnect(platform.id as any)}
                          >
                            <RefreshCw className="h-2.5 w-2.5 md:h-3 md:w-3 mr-1" />
                            Reconnect
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full sm:w-auto text-[10px] md:text-xs h-7 md:h-8 px-2 md:px-3"
                          onClick={() => handleDisconnect(account._id)}
                          disabled={disconnecting === account._id}
                        >
                          <Unlink className="h-2.5 w-2.5 md:h-3 md:w-3 mr-1" />
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 md:space-y-3">
                      {/* Permissions Preview */}
                      <div className="space-y-1">
                        <p className="text-[10px] md:text-xs font-medium text-muted-foreground">
                          Will request permissions:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {platform.permissions.map((perm) => (
                            <Badge key={perm} variant="outline" className="text-[10px] px-1.5 py-0">
                              {perm}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        className="w-full text-[10px] md:text-xs h-7 md:h-8"
                        onClick={() => handleConnect(platform.id as any)}
                      >
                        <Link className="h-2.5 w-2.5 md:h-3 md:w-3 mr-1" />
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
          <div className="pt-3 md:pt-4 border-t">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs md:text-sm">
              <span className="text-muted-foreground">
                {connectedAccounts.length} account{connectedAccounts.length !== 1 ? "s" : ""} connected
              </span>
              <Badge variant="outline" className="text-[10px] md:text-xs px-1.5 py-0">
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