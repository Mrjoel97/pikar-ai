import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const navigate = useNavigate();
  const env = useQuery(api.health.envStatus, {}) as any;

  const sendSalesInquiry = useAction(api.emailsActions.sendSalesInquiry);
  const sendTestEmailAction = useAction(api.emailsActions.sendTestEmail);
  const business = useQuery(api.businesses.currentUserBusiness, {} as any);

  const workspace = useQuery(
    api.emailConfig.getForBusinessSummary as any,
    business?._id ? { businessId: business._id } : undefined
  ) as
    | {
        hasResendKey: boolean;
        salesInbox: string | null;
        publicBaseUrl: string | null;
        fromEmail: string | null;
        fromName: string | null;
        replyTo: string | null;
      }
    | undefined;

  const saveWorkspace = useMutation(api.emailConfig.saveForBusiness as any);

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

  // Local state for test email form
  const [testTo, setTestTo] = useState("");
  const [testFromEmail, setTestFromEmail] = useState("");
  const [testFromName, setTestFromName] = useState("");
  const [testSubject, setTestSubject] = useState("Pikar AI Test Email");
  const [sendingInboxTest, setSendingInboxTest] = useState(false);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);

  // Workspace form state
  const [wsResendKey, setWsResendKey] = useState("");
  const [wsFromEmail, setWsFromEmail] = useState("");
  const [wsFromName, setWsFromName] = useState("");
  const [wsReplyTo, setWsReplyTo] = useState("");
  const [wsSalesInbox, setWsSalesInbox] = useState("");
  const [wsBaseUrl, setWsBaseUrl] = useState("");

  React.useEffect(() => {
    if (!workspace) return;
    setWsFromEmail(workspace.fromEmail || "");
    setWsFromName(workspace.fromName || "");
    setWsReplyTo(workspace.replyTo || "");
    setWsSalesInbox(workspace.salesInbox || "");
    setWsBaseUrl(workspace.publicBaseUrl || "");
  }, [workspace?._creationTime, !!workspace]);

  // Simple validator
  function isEmail(s: string) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);
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
        name: "Settings Test",
        email: "test@resend.dev",
        plan: "Validation",
        message: "This is a test message to validate Sales Inbox & Resend configuration.",
      });
      toast.success("Sales inbox test sent (or stubbed in DEV safe mode). Check your inbox.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to send sales inbox test");
    } finally {
      setSendingInboxTest(false);
    }
  }

  async function handleSendTestEmail() {
    if (!hasResend) {
      toast.error("Configure Resend first.");
      return;
    }
    if (!business?._id) {
      toast.error("Sign in to send a test email.");
      return;
    }
    if (!isEmail(testTo)) {
      toast.error("Enter a valid 'To' email.");
      return;
    }
    if (!isEmail(testFromEmail)) {
      toast.error("Enter a valid 'From' email (must be a verified sender).");
      return;
    }
    try {
      setSendingTestEmail(true);
      toast("Sending test email...");
      await sendTestEmailAction({
        businessId: business._id,
        to: testTo,
        subject: testSubject || "Pikar AI Test Email",
        fromEmail: testFromEmail,
        fromName: testFromName || undefined,
        replyTo: testFromEmail,
        previewText: "This is a test email from Settings",
        htmlContent:
          "<p>Hello! This is a <strong>Pikar AI</strong> test email from the Settings page.</p><p>If you received this, your sending configuration works.</p>",
      });
      toast.success("Test email sent (or stubbed in DEV safe mode). Check your inbox.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to send test email");
    } finally {
      setSendingTestEmail(false);
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

  async function handleSaveWorkspace() {
    if (!business?._id) {
      toast.error("Sign in to save workspace settings.");
      return;
    }
    try {
      toast("Saving workspace email settings...");
      await saveWorkspace({
        businessId: business._id,
        // Only send fields if provided; send null to clear
        resendApiKey: wsResendKey ? wsResendKey : undefined,
        fromEmail: wsFromEmail || null,
        fromName: wsFromName || null,
        replyTo: wsReplyTo || null,
        salesInbox: wsSalesInbox || null,
        publicBaseUrl: wsBaseUrl || null,
      });
      setWsResendKey("");
      toast.success("Workspace email settings saved.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save workspace settings");
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <Button variant="secondary" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>

      {devSafe && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 text-sm text-amber-900">
            DEV Safe Mode is ON. Emails are stubbed, not sent. Disable DEV_SAFE_EMAILS to send real emails.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Environment Configuration</CardTitle>
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
          <CardTitle>Workspace Email Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={workspace?.hasResendKey ? "border-emerald-300 text-emerald-700" : "border-amber-400 text-amber-700"}>
              Workspace Resend Key: {workspace?.hasResendKey ? "Configured" : "Missing"}
            </Badge>
            <Badge variant="outline" className={wsSalesInbox ? "border-emerald-300 text-emerald-700" : "border-amber-400 text-amber-700"}>
              Workspace Sales Inbox: {wsSalesInbox ? "Configured" : "Missing"}
            </Badge>
            <Badge variant="outline" className={wsBaseUrl ? "border-emerald-300 text-emerald-700" : "border-amber-400 text-amber-700"}>
              Workspace Base URL: {wsBaseUrl ? "Configured" : "Missing"}
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="wsResend">Resend API Key (workspace)</Label>
              <Input
                id="wsResend"
                type="password"
                placeholder="re_********************************"
                value={wsResendKey}
                onChange={(e) => setWsResendKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Used for your own emails. Not shown after save for security.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wsSalesInbox">Sales Inbox (workspace)</Label>
              <Input
                id="wsSalesInbox"
                placeholder="sales@yourdomain.com"
                value={wsSalesInbox}
                onChange={(e) => setWsSalesInbox(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wsBaseUrl">Public Base URL (workspace)</Label>
              <Input
                id="wsBaseUrl"
                placeholder="https://app.yourdomain.com"
                value={wsBaseUrl}
                onChange={(e) => setWsBaseUrl(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wsFromEmail">Default From Email</Label>
              <Input
                id="wsFromEmail"
                placeholder="noreply@yourdomain.com"
                value={wsFromEmail}
                onChange={(e) => setWsFromEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wsFromName">Default From Name</Label>
              <Input
                id="wsFromName"
                placeholder="Your Brand"
                value={wsFromName}
                onChange={(e) => setWsFromName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wsReplyTo">Default Reply-To</Label>
              <Input
                id="wsReplyTo"
                placeholder="support@yourdomain.com"
                value={wsReplyTo}
                onChange={(e) => setWsReplyTo(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSaveWorkspace}>
              Save Workspace Settings
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Workspace settings override global env for your own sends. Admin communications keep using the platform's global configuration.
          </p>
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

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">Send Test Email</div>
              <Button
                size="sm"
                onClick={handleSendTestEmail}
                disabled={!hasResend || !business?._id || sendingTestEmail}
              >
                {sendingTestEmail ? "Sending..." : "Send Test Email"}
              </Button>
            </div>
            {!business?._id && (
              <p className="text-xs text-amber-700">
                Sign in to your workspace to send a test email.
              </p>
            )}
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="toEmail">To</Label>
                <Input
                  id="toEmail"
                  placeholder="you@example.com"
                  value={testTo}
                  onChange={(e) => setTestTo(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fromEmail">From</Label>
                <Input
                  id="fromEmail"
                  placeholder="sender@yourdomain.com"
                  value={testFromEmail}
                  onChange={(e) => setTestFromEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fromName">From Name (optional)</Label>
                <Input
                  id="fromName"
                  placeholder="Your Brand"
                  value={testFromName}
                  onChange={(e) => setTestFromName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Pikar AI Test Email"
                  value={testSubject}
                  onChange={(e) => setTestSubject(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Requires a verified sender in Resend. "From" must be a domain/address that's verified in your Resend account.
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">Check Base URL</div>
              <Button size="sm" variant="outline" onClick={handleCheckBaseUrl}>
                Show & Open Base URL
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Quickly verify the configured public base URL used in links (unsubscribe, callbacks).
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
          <CardTitle>How to Configure</CardTitle>
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