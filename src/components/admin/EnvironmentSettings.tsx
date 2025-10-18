import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

interface EnvironmentSettingsProps {
  env?: {
    hasRESEND?: boolean;
    hasSALES_INBOX?: boolean;
    hasPUBLIC_SALES_INBOX?: boolean;
    hasBASE_URL?: boolean;
    devSafeEmailsEnabled?: boolean;
    emailQueueDepth?: number;
    overdueApprovalsCount?: number;
    cronLastProcessed?: number;
  };
}

export function EnvironmentSettings({ env }: EnvironmentSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Environment & Integrations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <TooltipProvider>
          <div className="flex flex-wrap gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant={env?.hasRESEND ? "outline" : "destructive"}>
                  RESEND: {env?.hasRESEND ? "Configured" : "Missing"}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                Ensure RESEND_API_KEY is set. Used for all system and campaign emails.
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant={env?.hasSALES_INBOX || env?.hasPUBLIC_SALES_INBOX ? "outline" : "destructive"}>
                  Sales Inbox: {env?.hasSALES_INBOX || env?.hasPUBLIC_SALES_INBOX ? "OK" : "Missing"}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                Configure SALES_INBOX or PUBLIC_SALES_INBOX to enable sales inquiry routing.
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant={env?.hasBASE_URL ? "outline" : "destructive"}>
                  Public Base URL: {env?.hasBASE_URL ? "OK" : "Missing"}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                Set VITE_PUBLIC_BASE_URL for absolute links in emails and redirects.
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant={env?.devSafeEmailsEnabled ? "secondary" : "outline"}>
                  Email Mode: {env?.devSafeEmailsEnabled ? "DEV SAFE (stubbed)" : "Live"}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                DEV_SAFE_EMAILS=true stubs sends for safety in development environments.
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 rounded-md border">
            <div className="text-sm text-muted-foreground">Email Queue Depth</div>
            <div className="text-xl font-semibold">{env?.emailQueueDepth ?? 0}</div>
          </div>
          <div className="p-3 rounded-md border">
            <div className="text-sm text-muted-foreground">Overdue Approvals</div>
            <div className="text-xl font-semibold">{env?.overdueApprovalsCount ?? 0}</div>
          </div>
          <div className="p-3 rounded-md border">
            <div className="text-sm text-muted-foreground">Cron Freshness</div>
            <div className="text-xs text-muted-foreground">
              {env?.cronLastProcessed ? new Date(env.cronLastProcessed).toLocaleString() : "Unknown"}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              toast("Opening Settings...");
              window.location.href = "/settings";
            }}
          >
            Open Settings
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const base = (import.meta as any)?.env?.VITE_PUBLIC_BASE_URL as string | undefined;
              if (base) {
                toast.success(`Base URL: ${base}`);
                try { window.open(base, "_blank", "noopener,noreferrer"); } catch {}
              } else {
                toast.error("VITE_PUBLIC_BASE_URL not set in frontend env.");
              }
            }}
          >
            Check Base URL
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}