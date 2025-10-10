import React, { useState } from "react";
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
import { Copy } from "lucide-react";

export default function SettingsPage() {
  const navigate = useNavigate();
  const env = useQuery(api.health.envStatus, {}) as any;
  const sendTestEmailAction = useAction(api.emailsActions.sendTestEmail);
  const business = useQuery(api.businesses.currentUserBusiness, {} as any);

  // Simplify: always query summary with {} (server derives current user's business)
  const workspace = useQuery(
    api.emailConfig.getForBusinessSummary as any,
    {}
  ) as
    | {
        hasResendKey: boolean;
        salesInbox: string | null;
        publicBaseUrl: string | null;
        fromEmail: string | null;
        fromName: string | null;
        replyTo: string | null;
        updatedAt: number | null;
      }
    | null
    | undefined;

  const saveWorkspace = useMutation(api.emailConfig.saveForBusiness as any);

  const status = env ?? {};
  const hasResend = Boolean(status.hasRESEND ?? status.hasResend);
  const devSafe = Boolean(status.devSafeEmails ?? status.devSafeEmailsEnabled);

  // Local state for test email form
  const [testTo, setTestTo] = useState("");
  const [testFromEmail, setTestFromEmail] = useState("");
  const [testFromName, setTestFromName] = useState("");
  const [testSubject, setTestSubject] = useState("Pikar AI Test Email");
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
  }, [workspace?.updatedAt]);

  // Simple validator
  function isEmail(s: string) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);
  }

  // Add copy handler for URLs
  function copyUrl(url: string, label: string) {
    if (!url) {
      toast.error(`${label} is not available`);
      return;
    }
    navigator.clipboard.writeText(url)
      .then(() => {
        toast.success(`Copied ${label}`);
      })
      .catch((err) => {
        console.error("Clipboard copy failed:", err);
        toast.error("Failed to copy to clipboard. Please copy manually.");
      });
  }

  // Get Convex URL from environment
  const convexUrl = (import.meta as any)?.env?.VITE_CONVEX_URL as string | undefined;
  const googleRedirectUrl = convexUrl ? `${convexUrl}/api/auth/callback/google` : "";

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
        <h1 className="text-2xl font-semibold">User Settings</h1>
        <Button variant="secondary" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>

      {devSafe && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 text-sm text-amber-900">
            DEV Safe Mode is ON. Emails are stubbed, not sent. Contact admin to disable DEV_SAFE_EMAILS.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Google OAuth Setup URLs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Use these URLs when configuring Google OAuth in the Google Cloud Console.
          </p>
          
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="convexUrl">Convex Deployment URL</Label>
              <div className="flex gap-2">
                <Input
                  id="convexUrl"
                  value={convexUrl || "Not configured"}
                  readOnly
                  className="bg-gray-50 font-mono text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyUrl(convexUrl || "", "Convex URL")}
                  disabled={!convexUrl}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="googleRedirect">Google OAuth Redirect URI</Label>
              <div className="flex gap-2">
                <Input
                  id="googleRedirect"
                  value={googleRedirectUrl || "Not configured"}
                  readOnly
                  className="bg-gray-50 font-mono text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyUrl(googleRedirectUrl, "Redirect URI")}
                  disabled={!googleRedirectUrl}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Add this as an authorized redirect URI in your Google Cloud Console OAuth configuration.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              <strong>Setup Steps:</strong>
            </p>
            <ol className="list-decimal ml-5 space-y-1 text-xs text-muted-foreground mt-2">
              <li>Copy the Redirect URI above</li>
              <li>Go to Google Cloud Console → APIs & Services → Credentials</li>
              <li>Create or edit your OAuth 2.0 Client ID</li>
              <li>Add the Redirect URI to "Authorized redirect URIs"</li>
              <li>Copy your Client ID and Client Secret</li>
              <li>Add them to your Convex dashboard environment variables as GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET</li>
            </ol>
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
          <CardTitle>Test Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How to Configure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <ol className="list-decimal ml-5 space-y-1">
            <li>Configure your workspace-specific email settings above.</li>
            <li>Set your Resend API key and verify your sender domain in Resend.</li>
            <li>Set your public base URL to your app's public URL.</li>
            <li>Set your sales inbox to a monitored email address.</li>
            <li>For platform-wide configuration, contact your administrator.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}