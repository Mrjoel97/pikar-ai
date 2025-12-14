import React, { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CalendarIntegrationButtonProps {
  businessId: Id<"businesses">;
}

export function CalendarIntegrationButton({ businessId }: CalendarIntegrationButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  
  const integrations = useQuery(api.calendar.calendarIntegrations.listCalendarIntegrations, {
    businessId,
  });
  
  const initiateOAuth = useAction(api.calendar.googleCalendar.initiateGoogleCalendarOAuth);
  const connectCalendar = useMutation(api.calendar.calendarIntegrations.connectGoogleCalendar);
  const exchangeCode = useAction(api.calendar.googleCalendar.exchangeGoogleCalendarCode);

  const isConnected = integrations?.some(int => int.provider === "google");

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const callbackUrl = `${window.location.origin}/auth/callback/google-calendar`;
      const result = await initiateOAuth({ businessId, callbackUrl });

      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        result.authUrl,
        "google_calendar_oauth",
        `width=${width},height=${height},left=${left},top=${top}`
      );

      const handleMessage = async (event: MessageEvent) => {
        if (event.data.type === "oauth_success" && event.data.provider === "google-calendar") {
          const tokenResult = await exchangeCode({
            code: event.data.code,
            businessId,
            callbackUrl,
          });

          if (tokenResult.success && tokenResult.accessToken) {
            await connectCalendar({
              businessId,
              accessToken: tokenResult.accessToken,
              refreshToken: tokenResult.refreshToken,
              expiresAt: tokenResult.expiresAt!,
            });
            toast.success("Google Calendar connected successfully!");
          } else {
            toast.error("Failed to connect Google Calendar");
          }
          window.removeEventListener("message", handleMessage);
        }
      };

      window.addEventListener("message", handleMessage);

      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setIsConnecting(false);
          window.removeEventListener("message", handleMessage);
        }
      }, 1000);
    } catch (error) {
      toast.error("Failed to initiate Google Calendar connection");
      console.error(error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {integrations?.map((int: any) => (
          <Button
            key={int._id}
            variant={int.isActive ? "default" : "outline"}
            onClick={() => handleConnect(int.provider)}
            disabled={isLoading}
          >
            {int.provider === "google" && <Icons.google className="mr-2 h-4 w-4" />}
            {int.provider === "outlook" && <Icons.microsoft className="mr-2 h-4 w-4" />}
            {int.provider.charAt(0).toUpperCase() + int.provider.slice(1)}
          </Button>
        ))}
      </div>
    </div>
  );
}