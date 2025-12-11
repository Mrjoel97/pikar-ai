import * as React from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Twitter, Linkedin, Facebook, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PlatformConnectorProps {
  businessId: Id<"businesses">;
  platform: "twitter" | "linkedin" | "facebook";
  isConnected: boolean;
  onConnectionChange?: () => void;
}

export default function PlatformConnector({
  businessId,
  platform,
  isConnected,
  onConnectionChange,
}: PlatformConnectorProps) {
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [showDialog, setShowDialog] = React.useState(false);

  const initiateOAuth = useAction(
    platform === "twitter"
      ? api.socialIntegrations.oauth.initiateTwitterOAuth
      : platform === "linkedin"
      ? api.socialIntegrations.oauth.initiateLinkedInOAuth
      : api.socialIntegrations.oauth.initiateFacebookOAuth
  );

  const disconnect = useMutation(api.socialIntegrations.disconnectPlatform);

  const platformConfig = {
    twitter: { name: "Twitter/X", icon: Twitter, color: "text-blue-500" },
    linkedin: { name: "LinkedIn", icon: Linkedin, color: "text-blue-700" },
    facebook: { name: "Facebook", icon: Facebook, color: "text-blue-600" },
  };

  const config = platformConfig[platform];
  const Icon = config.icon;

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const callbackUrl = `${window.location.origin}/oauth/callback/${platform}`;
      const result = await initiateOAuth({ businessId, callbackUrl });

      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        result.authUrl,
        `${platform}_oauth`,
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for OAuth callback
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === "oauth_success" && event.data.platform === platform) {
          toast.success(`${config.name} connected successfully!`);
          onConnectionChange?.();
          setShowDialog(false);
          window.removeEventListener("message", handleMessage);
        } else if (event.data.type === "oauth_error") {
          toast.error(`Failed to connect ${config.name}`);
        }
      };

      window.addEventListener("message", handleMessage);

      // Check if popup was closed
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setIsConnecting(false);
          window.removeEventListener("message", handleMessage);
        }
      }, 1000);
    } catch (error) {
      toast.error(`Failed to initiate ${config.name} connection`);
      console.error(error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect({ businessId, platform });
      toast.success(`${config.name} disconnected`);
      onConnectionChange?.();
      setShowDialog(false);
    } catch (error) {
      toast.error(`Failed to disconnect ${config.name}`);
    }
  };

  return (
    <>
      <Button
        variant={isConnected ? "outline" : "default"}
        size="sm"
        onClick={() => setShowDialog(true)}
        disabled={isConnecting}
        className="gap-2"
      >
        <Icon className={`h-4 w-4 ${config.color}`} />
        {isConnecting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : isConnected ? (
          <>
            <CheckCircle className="h-4 w-4 text-green-600" />
            Connected
          </>
        ) : (
          `Connect ${config.name}`
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon className={`h-5 w-5 ${config.color}`} />
              {config.name} Connection
            </DialogTitle>
            <DialogDescription>
              {isConnected
                ? `Manage your ${config.name} connection`
                : `Connect your ${config.name} account to sync posts and analytics`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {isConnected ? (
              <>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Your {config.name} account is connected
                </div>
                <Button variant="destructive" onClick={handleDisconnect} className="w-full">
                  <XCircle className="h-4 w-4 mr-2" />
                  Disconnect {config.name}
                </Button>
              </>
            ) : (
              <>
                <div className="text-sm text-muted-foreground">
                  Connecting your {config.name} account will allow Pikar AI to:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Sync your posts and analytics</li>
                    <li>Track engagement metrics in real-time</li>
                    <li>Provide AI-powered insights</li>
                    <li>Schedule and publish content</li>
                  </ul>
                </div>
                <Button onClick={handleConnect} disabled={isConnecting} className="w-full">
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Icon className="h-4 w-4 mr-2" />
                      Connect {config.name}
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
