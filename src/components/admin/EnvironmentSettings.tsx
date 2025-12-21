import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface EnvironmentSettingsProps {
  env?: {
    status?: string;
    checks?: {
      resendApiKey?: boolean;
      openaiApiKey?: boolean;
      convexUrl?: boolean;
      salesInbox?: boolean;
      publicSalesInbox?: boolean;
      baseUrl?: boolean;
      devSafeEmails?: boolean;
    };
    metrics?: {
      emailQueueDepth?: number;
      emailQueueStatus?: string;
      cronStatus?: string;
      lastCronRun?: number;
      overdueApprovals?: number;
      approvalStatus?: string;
    };
    timestamp?: number;
  };
}

export function EnvironmentSettings({ env }: EnvironmentSettingsProps) {
  const stripeConfig = useQuery(api.health.getStripeConfig, {});
  const publicBaseUrlData = useQuery(api.health.getPublicBaseUrl, {});
  const [testingResend, setTestingResend] = React.useState(false);
  const [testingBaseUrl, setTestingBaseUrl] = React.useState(false);
  const [editingBaseUrl, setEditingBaseUrl] = React.useState(false);
  const [baseUrlInput, setBaseUrlInput] = React.useState("");

  const testResendKey = useQuery(api.health.testResendKey, {});
  const testPublicBaseUrl = useQuery(api.health.testPublicBaseUrl, {});
  const saveSystemConfig = useMutation(api.admin.saveSystemConfig);

  // Get admin session token from localStorage
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminSessionToken') : null;

  React.useEffect(() => {
    if (publicBaseUrlData?.url && !baseUrlInput) {
      setBaseUrlInput(publicBaseUrlData.url);
    }
  }, [publicBaseUrlData]);

  const openConvexDashboard = () => {
    const convexUrl = "https://dashboard.convex.dev/d/hushed-cat-860";
    window.open(convexUrl, "_blank", "noopener,noreferrer");
    toast.success("Opening Convex Dashboard...");
  };

  const handleTestResend = () => {
    setTestingResend(true);
    setTimeout(() => {
      if (testResendKey?.success) {
        toast.success(testResendKey.message);
      } else {
        toast.error(testResendKey?.message || "Resend API key test failed");
      }
      setTestingResend(false);
    }, 500);
  };

  const handleTestBaseUrl = () => {
    setTestingBaseUrl(true);
    setTimeout(() => {
      if (testPublicBaseUrl?.success) {
        toast.success(testPublicBaseUrl.message);
      } else {
        toast.error(testPublicBaseUrl?.message || "Public Base URL test failed");
      }
      setTestingBaseUrl(false);
    }, 500);
  };

  const handleSaveBaseUrl = async () => {
    if (!baseUrlInput.trim()) {
      toast.error("Please enter a valid URL");
      return;
    }

    try {
      await saveSystemConfig({
        key: "publicBaseUrl",
        value: baseUrlInput.trim(),
        description: "System-wide public base URL for generating absolute links",
        adminToken: adminToken || undefined,
      });
      toast.success("Public Base URL saved successfully!");
      setEditingBaseUrl(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save Public Base URL");
    }
  };

  return (
    <div className="space-y-4">
      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle>System-Wide Environment & Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <TooltipProvider>
            <div className="flex flex-wrap gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant={env?.checks?.openaiApiKey ? "outline" : "destructive"}>
                    OpenAI: {env?.checks?.openaiApiKey ? "Configured ✓" : "Missing"}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">
                  {env?.checks?.openaiApiKey 
                    ? "OpenAI API key is configured. AI features (Content Capsules, Customer Segmentation) are active."
                    : "Set OPENAI_API_KEY in Convex Dashboard to enable AI-powered features."}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant={env?.checks?.resendApiKey ? "outline" : "destructive"}>
                    RESEND: {env?.checks?.resendApiKey ? "Configured" : "Missing"}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">
                  Ensure RESEND_API_KEY is set. Used for all system and campaign emails.
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant={publicBaseUrlData?.url ? "outline" : "destructive"}>
                    Public Base URL: {publicBaseUrlData?.url ? "OK" : "Missing"}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">
                  {publicBaseUrlData?.source === "database" 
                    ? "Configured in database (editable below)"
                    : publicBaseUrlData?.source === "environment"
                    ? "Set via VITE_PUBLIC_BASE_URL environment variable"
                    : "Not configured"}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant={env?.checks?.devSafeEmails ? "secondary" : "outline"}>
                    Email Mode: {env?.checks?.devSafeEmails ? "DEV SAFE (stubbed)" : "Live"}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">
                  DEV_SAFE_EMAILS=true stubs sends for safety in development environments.
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          <Separator />

          {!env?.checks?.openaiApiKey && (
            <div className="p-3 rounded-md border border-amber-300 bg-amber-50 text-amber-900">
              <div className="font-medium mb-1">⚠️ OpenAI API Key Not Configured</div>
              <div className="text-sm mb-2">
                AI-powered features (Content Capsules, Customer Segmentation) require an OpenAI API key. 
                This key will be shared across all users in your organization.
              </div>
              <div className="text-xs text-muted-foreground mb-2">
                <strong>How to add:</strong>
                <ol className="list-decimal ml-4 mt-1 space-y-1">
                  <li>Click "Configure in Convex Dashboard" below</li>
                  <li>Navigate to Settings → Environment Variables</li>
                  <li>Add: <code className="bg-white px-1 rounded">OPENAI_API_KEY</code> = <code className="bg-white px-1 rounded">sk-...</code></li>
                  <li>Save and return here to verify</li>
                </ol>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-md border">
              <div className="text-sm text-muted-foreground">Email Queue Depth</div>
              <div className="text-xl font-semibold">{env?.metrics?.emailQueueDepth ?? 0}</div>
            </div>
            <div className="p-3 rounded-md border">
              <div className="text-sm text-muted-foreground">Overdue Approvals</div>
              <div className="text-xl font-semibold">{env?.metrics?.overdueApprovals ?? 0}</div>
            </div>
            <div className="p-3 rounded-md border">
              <div className="text-sm text-muted-foreground">Cron Freshness</div>
              <div className="text-xs text-muted-foreground">
                {env?.metrics?.lastCronRun ? new Date(env.metrics.lastCronRun).toLocaleString() : "Unknown"}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={openConvexDashboard}
            >
              Configure in Convex Dashboard
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                toast(env?.checks?.openaiApiKey 
                  ? "✓ OpenAI is configured and active" 
                  : "⚠️ OpenAI API key is missing. Click 'Configure in Convex Dashboard' to add it.");
              }}
            >
              Check OpenAI Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stripe Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Stripe Configuration (System-Wide)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Configure Stripe API keys for payment processing across all workspaces.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant={stripeConfig?.hasPublishableKey ? "outline" : "destructive"}>
              Publishable Key: {stripeConfig?.hasPublishableKey ? "Configured" : "Missing"}
            </Badge>
            <Badge variant={stripeConfig?.hasSecretKey ? "outline" : "destructive"}>
              Secret Key: {stripeConfig?.hasSecretKey ? "Configured" : "Missing"}
            </Badge>
            <Badge variant={stripeConfig?.hasWebhookSecret ? "outline" : "destructive"}>
              Webhook Secret: {stripeConfig?.hasWebhookSecret ? "Configured" : "Missing"}
            </Badge>
          </div>
          {(!stripeConfig?.hasPublishableKey || !stripeConfig?.hasSecretKey) && (
            <div className="p-3 rounded-md border border-amber-300 bg-amber-50 text-amber-900">
              <div className="font-medium mb-1">⚠️ Stripe Not Fully Configured</div>
              <div className="text-sm">
                Add the following environment variables in Convex Dashboard:
              </div>
              <ul className="text-xs mt-2 ml-4 list-disc space-y-1">
                <li><code className="bg-white px-1 rounded">STRIPE_PUBLISHABLE_KEY</code></li>
                <li><code className="bg-white px-1 rounded">STRIPE_SECRET_KEY</code></li>
                <li><code className="bg-white px-1 rounded">STRIPE_WEBHOOK_SECRET</code> (optional)</li>
              </ul>
            </div>
          )}
          <Button size="sm" onClick={openConvexDashboard}>
            Configure Stripe Keys
          </Button>
        </CardContent>
      </Card>

      {/* Resend API Key */}
      <Card>
        <CardHeader>
          <CardTitle>Resend API Key (System-Wide)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            System-wide Resend API key for email delivery. This is separate from workspace-specific sender configurations.
          </p>
          <div className="flex items-center gap-2">
            <Badge variant={env?.checks?.resendApiKey ? "outline" : "destructive"}>
              {env?.checks?.resendApiKey ? "Configured ✓" : "Not Configured"}
            </Badge>
            {testResendKey && (
              <span className="text-xs text-muted-foreground">
                {testResendKey.message}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleTestResend}
              disabled={testingResend || !env?.checks?.resendApiKey}
            >
              {testingResend ? "Testing..." : "Test Resend Key"}
            </Button>
            <Button size="sm" onClick={openConvexDashboard}>
              Configure Resend Key
            </Button>
          </div>
          {!env?.checks?.resendApiKey && (
            <div className="p-3 rounded-md border border-amber-300 bg-amber-50 text-amber-900 text-sm">
              Add <code className="bg-white px-1 rounded">RESEND_API_KEY</code> in Convex Dashboard → Settings → Environment Variables
            </div>
          )}
        </CardContent>
      </Card>

      {/* Public Base URL - Now Editable */}
      <Card>
        <CardHeader>
          <CardTitle>Public Base URL (System-Wide)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            System-wide public base URL for generating absolute links in emails, webhooks, and redirects.
          </p>
          <div className="flex items-center gap-2">
            <Badge variant={publicBaseUrlData?.url ? "outline" : "destructive"}>
              {publicBaseUrlData?.url ? "Configured ✓" : "Not Configured"}
            </Badge>
            {publicBaseUrlData?.source && (
              <span className="text-xs text-muted-foreground">
                Source: {publicBaseUrlData.source}
              </span>
            )}
          </div>

          {editingBaseUrl ? (
            <div className="space-y-2">
              <Label htmlFor="baseUrl">Public Base URL</Label>
              <Input
                id="baseUrl"
                type="text"
                placeholder="https://pikar-ai.com"
                value={baseUrlInput}
                onChange={(e) => setBaseUrlInput(e.target.value)}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveBaseUrl}>
                  Save URL
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingBaseUrl(false);
                    setBaseUrlInput(publicBaseUrlData?.url || "");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {publicBaseUrlData?.url && (
                <div className="p-2 rounded-md bg-muted text-sm font-mono">
                  {publicBaseUrlData.url}
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => setEditingBaseUrl(true)}
                >
                  {publicBaseUrlData?.url ? "Edit URL" : "Set URL"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTestBaseUrl}
                  disabled={testingBaseUrl || !publicBaseUrlData?.url}
                >
                  {testingBaseUrl ? "Testing..." : "Test URL"}
                </Button>
              </div>
            </div>
          )}

          {!publicBaseUrlData?.url && (
            <div className="p-3 rounded-md border border-amber-300 bg-amber-50 text-amber-900 text-sm">
              Set your public base URL above (e.g., "https://pikar-ai.com"). This will be used by backend functions to generate absolute URLs.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}