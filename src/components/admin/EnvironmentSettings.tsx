import React, { useMemo, useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export function EnvironmentSettings() {
  const env = useQuery(api.health.envStatus, {}) as any;
  const sendSalesInquiry = useAction(api.emailsActions.sendSalesInquiry);

  const [sendingInboxTest, setSendingInboxTest] = useState(false);

  const status = env ?? {};
  const baseUrlOk = Boolean(status.hasBASE_URL ?? status.hasPublicBaseUrl);
  const hasSalesInbox = Boolean(
    (status.hasSALES_INBOX ?? status.hasSalesInbox) ||
      (status.hasPUBLIC_SALES_INBOX ?? status.hasPublicSalesInbox),
  );
  const hasResend = Boolean(status.hasRESEND ?? status.hasResend);
  const queueDepth = Number(status.emailQueueDepth ?? 0);
  const cronLastProcessed: number | null =
    typeof status.cronLastProcessed === "number" ? status.cronLastProcessed : null;
  const overdueApprovals: number = Number(status.overdueApprovalsCount ?? 0);
  const devSafe = Boolean(status.devSafeEmails ?? status.devSafeEmailsEnabled);

  const cronAgo = useMemo(() => {
    if (!cronLastProcessed) return null;
    const mins = Math.max(0, Math.floor((Date.now() - cronLastProcessed) / 60000));
    return `${mins}m ago`;
  }, [cronLastProcessed]);

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`Copied "${text}"`);
    });
  }

  async function handleSendInboxTest() {
    if (!hasResend || !hasSalesInbox) {
      toast.error("Configure Resend and Sales Inbox first.");
      return;
    }
    try {
      setSendingInboxTest(true);
      toast("Sending sales inbox test...");
      await sendSalesInquiry({
        name: "Admin Test",
        email: "test@resend.dev",
        plan: "Validation",
        message: "This is a test message to validate Sales Inbox & Resend configuration from Admin panel.",
      });
      toast.success("Sales inbox test sent (or stubbed in DEV safe mode). Check your inbox.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to send sales inbox test");
    } finally {
      setSendingInboxTest(false);
    }
  }

  function handleCheckBaseUrl() {
    const base = (import.meta as any)?.env?.VITE_PUBLIC_BASE_URL as string | undefined;
    if (base && typeof base === "string" && base.length > 0) {
      toast.success(`Base URL detected: ${base}`);
      try {
        window.open(base, "_blank", "noopener,noreferrer");
      } catch {
        // ignore
      }
    } else {
      toast.error("No Base URL detected in frontend env (VITE_PUBLIC_BASE_URL).");
    }
  }

  return (
    <div className="space-y-6">
      {devSafe && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 text-sm text-amber-900">
            DEV Safe Mode is ON. Emails are stubbed, not sent. Disable DEV_SAFE_EMAILS to send real emails.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Platform Environment Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">Public Base URL</div>
                <Badge
                  variant="outline"
                  className={baseUrlOk ? "border-emerald-300 text-emerald-700" : "border-amber-400 text-amber-700"}
                >
                  {baseUrlOk ? "Configured" : "Missing"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Required for unsubscribe links and public callbacks.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => copy("VITE_PUBLIC_BASE_URL")}>
                  Copy VITE_PUBLIC_BASE_URL
                </Button>
                <Button size="sm" variant="outline" onClick={handleCheckBaseUrl}>
                  Check & Open
                </Button>
              </div>
              {!baseUrlOk && (
                <p className="text-xs text-muted-foreground mt-2">
                  Set this in Integrations → API Keys. Use your hosted app URL (e.g., https://app.yourdomain.com).
                </p>
              )}
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">Sales Inbox</div>
                <Badge
                  variant="outline"
                  className={hasSalesInbox ? "border-emerald-300 text-emerald-700" : "border-amber-400 text-amber-700"}
                >
                  {hasSalesInbox ? "Configured" : "Missing"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Used for sales inquiries and campaign replies (e.g., sales@yourdomain.com).
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => copy("SALES_INBOX")}>
                  Copy SALES_INBOX
                </Button>
                <Button size="sm" variant="outline" onClick={() => copy("PUBLIC_SALES_INBOX")}>
                  Copy PUBLIC_SALES_INBOX
                </Button>
              </div>
              {!hasSalesInbox && (
                <p className="text-xs text-muted-foreground mt-2">
                  Set one of these in Integrations → API Keys. Use a monitored address or a distribution list.
                </p>
              )}
            </div>
          </div>

          <Separator />

          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">Email Provider (Resend)</div>
              <Badge
                variant="outline"
                className={hasResend ? "border-emerald-300 text-emerald-700" : "border-amber-400 text-amber-700"}
              >
                {hasResend ? "Configured" : "Missing"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Required to send emails. Verify your domain in Resend for best deliverability.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => copy("RESEND_API_KEY")}>
                Copy RESEND_API_KEY
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Validate & Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">Sales Inbox Test</div>
              <Button
                size="sm"
                onClick={handleSendInboxTest}
                disabled={!hasResend || !hasSalesInbox || sendingInboxTest}
              >
                {sendingInboxTest ? "Sending..." : "Send Sales Inbox Test"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Sends a lightweight test via your configured Sales Inbox to confirm email delivery (uses Resend).
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={queueDepth > 100 ? "border-red-300 text-red-700" : "border-emerald-300 text-emerald-700"}>
              Queue: {queueDepth}
            </Badge>
            {cronAgo && (
              <Badge variant="outline" className="border-slate-300 text-slate-700">
                Cron: {cronAgo}
              </Badge>
            )}
            {overdueApprovals > 0 && (
              <Badge variant="outline" className="border-red-300 text-red-700">
                Overdue Approvals: {overdueApprovals}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Health indicators help ensure timely campaign sends and approvals.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How to Configure Platform Environment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <ol className="list-decimal ml-5 space-y-1">
            <li>Open the Integrations tab (top bar) and add/update API keys.</li>
            <li>Set RESEND_API_KEY and verify your sender domain in Resend.</li>
            <li>Set VITE_PUBLIC_BASE_URL to your app's public URL.</li>
            <li>Set SALES_INBOX or PUBLIC_SALES_INBOX to a monitored email address.</li>
            <li>Reload the app to apply changes.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
