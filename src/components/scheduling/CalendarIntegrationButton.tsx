import React, { useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, CheckCircle, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

interface CalendarIntegrationButtonProps {
  businessId: Id<"businesses">;
  provider: "google" | "outlook";
  isConnected: boolean;
  onConnectionChange?: () => void;
}

export function CalendarIntegrationButton({
  businessId,
  provider,
  isConnected,
  onConnectionChange,
}: CalendarIntegrationButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const initiateGoogleOAuth = useAction(api.calendar.googleCalendar.initiateGoogleCalendarOAuth);
  const initiateOutlookOAuth = useAction(api.calendar.outlookCalendar.initiateOutlookCalendarOAuth);
  const disconnect = useMutation(api.calendar.calendarIntegrations.disconnectIntegration);

  const providerConfig = {
    google: { name: "Google Calendar", color: "text-blue-600" },
    outlook: { name: "Outlook Calendar", color: "text-blue-700" },
  };

  const config = providerConfig[provider];

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const callbackUrl = `${window.location.origin}/auth/callback/calendar/${provider}`;
      
      let result;
      if (provider === "google") {
        result = await initiateGoogleOAuth({ businessId, callbackUrl });
      } else if (provider === "outlook") {
        result = await initiateOutlookOAuth({ businessId, callbackUrl });
      } else {
        toast.error("Calendar provider not supported");
        setIsConnecting(false);
        return;
      }

      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        result.authUrl,
        `${provider}_calendar_oauth`,
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for OAuth callback
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === "calendar_oauth_success" && event.data.provider === provider) {
          toast.success(`${config.name} connected successfully!`);
          onConnectionChange?.();
          setShowDialog(false);
          window.removeEventListener("message", handleMessage);
        } else if (event.data.type === "calendar_oauth_error") {
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
      // Note: This would need the actual integration ID
      toast.info("Disconnect functionality requires integration ID");
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
        <Calendar className={`h-4 w-4 ${config.color}`} />
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
              <Calendar className={`h-5 w-5 ${config.color}`} />
              {config.name} Connection
            </DialogTitle>
            <DialogDescription>
              {isConnected
                ? `Manage your ${config.name} connection`
                : `Connect your ${config.name} to sync events and availability`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {isConnected ? (
              <>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Your {config.name} is connected
                </div>
                <Button variant="destructive" onClick={handleDisconnect} className="w-full">
                  <XCircle className="h-4 w-4 mr-2" />
                  Disconnect {config.name}
                </Button>
              </>
            ) : (
              <>
                <div className="text-sm text-muted-foreground">
                  Connecting your {config.name} will allow Pikar AI to:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Sync your calendar events automatically</li>
                    <li>Detect scheduling conflicts</li>
                    <li>Suggest optimal meeting times</li>
                    <li>Create events directly from Pikar AI</li>
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
                      <Calendar className="h-4 w-4 mr-2" />
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