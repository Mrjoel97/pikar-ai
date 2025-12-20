import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { SocialApiSettings } from "./SocialApiSettings";

interface IntegrationsHubPanelProps {
  env: any;
  saveSystemConfigMutation: any;
  adminToken: string | null;
}

export function IntegrationsHubPanel({ env, saveSystemConfigMutation, adminToken }: IntegrationsHubPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle id="section-integrations">Integrations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Integration posture derives from System Health. Use quick actions to remediate.
        </p>
        
        {/* Social API Settings Section */}
        <div className="pt-4 border-t">
          <SocialApiSettings />
        </div>
        
        <Separator className="my-4" />
        
        <p className="text-sm text-muted-foreground">
          Email and system integrations:
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant={env?.hasRESEND ? "outline" : "destructive"}>
            Resend: {env?.hasRESEND ? "Configured" : "Missing"}
          </Badge>
          <Badge variant={env?.hasSALES_INBOX || env?.hasPUBLIC_SALES_INBOX ? "outline" : "destructive"}>
            Sales Inbox: {env?.hasSALES_INBOX || env?.hasPUBLIC_SALES_INBOX ? "OK" : "Missing"}
          </Badge>
          <Badge variant={env?.hasBASE_URL ? "outline" : "destructive"}>
            Public Base URL: {env?.hasBASE_URL ? "OK" : "Missing"}
          </Badge>
          <Badge variant={env?.devSafeEmailsEnabled ? "secondary" : "outline"}>
            Email Mode: {env?.devSafeEmailsEnabled ? "DEV SAFE" : "Live"}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
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
            onClick={async () => {
              const newUrl = prompt("Enter new Base URL:", (import.meta as any)?.env?.VITE_PUBLIC_BASE_URL || "");
              if (!newUrl) return;
              
              try {
                await saveSystemConfigMutation({
                  key: "BASE_URL",
                  value: newUrl,
                  description: "Public base URL for the application",
                  adminToken: adminToken || undefined,
                });
                toast.success("Base URL updated successfully");
              } catch (e: any) {
                toast.error(e?.message || "Failed to update Base URL");
              }
            }}
          >
            Update Base URL
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          For test email sending and deeper checks, use the Settings page's inline validators.
        </div>
      </CardContent>
    </Card>
  );
}
