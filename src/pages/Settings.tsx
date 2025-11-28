import React, { useState, Suspense } from "react";
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
import { Copy, Settings as SettingsIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

// Static imports for settings components
import SolopreneurSettings from "@/components/settings/SolopreneurSettings";
import StartupSettings from "@/components/settings/StartupSettings";
import SmeSettings from "@/components/settings/SmeSettings";
import EnterpriseSettings from "@/components/settings/EnterpriseSettings";

export default function SettingsPage() {
  const navigate = useNavigate();
  const env = useQuery(api.health.envStatus, {}) as any;
  const sendTestEmailAction = useAction(api.emailsActions.sendTestEmail);
  const business = useQuery(api.businesses.currentUserBusiness, {} as any);

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

  // Get user's tier
  const userTier = business?.settings?.plan || "solopreneur";

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

  function isEmail(s: string) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);
  }

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
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="neu-inset rounded-xl p-3 bg-primary/10">
            <SettingsIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your {userTier} tier settings and preferences
            </p>
          </div>
        </div>
        <Button variant="secondary" onClick={() => navigate("/dashboard")} className="neu-flat">
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

      <Tabs defaultValue="tier-specific" className="w-full">
        <TabsList className="grid w-full grid-cols-4 neu-inset">
          <TabsTrigger value="tier-specific">Tier Settings</TabsTrigger>
          <TabsTrigger value="email">Email & OAuth</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="test">Test Email</TabsTrigger>
        </TabsList>

        {/* Tier-Specific Settings Tab */}
        <TabsContent value="tier-specific" className="space-y-6 mt-6">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            {userTier === "solopreneur" && <SolopreneurSettings business={business} />}
            {userTier === "startup" && <StartupSettings business={business} />}
            {userTier === "sme" && <SmeSettings business={business} />}
            {userTier === "enterprise" && <EnterpriseSettings business={business} />}
          </Suspense>
        </TabsContent>

        {/* Email & OAuth Tab */}
        <TabsContent value="email" className="space-y-6 mt-6">
          <Card className="neu-raised border-0">
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
                      className="bg-gray-50 font-mono text-sm neu-inset"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyUrl(convexUrl || "", "Convex URL")}
                      disabled={!convexUrl}
                      className="neu-flat"
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
                      className="bg-gray-50 font-mono text-sm neu-inset"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyUrl(googleRedirectUrl, "Redirect URI")}
                      disabled={!googleRedirectUrl}
                      className="neu-flat"
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
        </TabsContent>

        {/* Workspace Tab */}
        <TabsContent value="workspace" className="space-y-6 mt-6">
          <Card className="neu-raised border-0">
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
                    className="neu-inset"
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
                    className="neu-inset"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="wsBaseUrl">Public Base URL (workspace)</Label>
                  <Input
                    id="wsBaseUrl"
                    placeholder="https://app.yourdomain.com"
                    value={wsBaseUrl}
                    onChange={(e) => setWsBaseUrl(e.target.value)}
                    className="neu-inset"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="wsFromEmail">Default From Email</Label>
                  <Input
                    id="wsFromEmail"
                    placeholder="noreply@yourdomain.com"
                    value={wsFromEmail}
                    onChange={(e) => setWsFromEmail(e.target.value)}
                    className="neu-inset"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="wsFromName">Default From Name</Label>
                  <Input
                    id="wsFromName"
                    placeholder="Your Brand"
                    value={wsFromName}
                    onChange={(e) => setWsFromName(e.target.value)}
                    className="neu-inset"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="wsReplyTo">Default Reply-To</Label>
                  <Input
                    id="wsReplyTo"
                    placeholder="support@yourdomain.com"
                    value={wsReplyTo}
                    onChange={(e) => setWsReplyTo(e.target.value)}
                    className="neu-inset"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleSaveWorkspace} className="neu-raised">
                  Save Workspace Settings
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Workspace settings override global env for your own sends. Admin communications keep using the platform's global configuration.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Email Tab */}
        <TabsContent value="test" className="space-y-6 mt-6">
          <Card className="neu-raised border-0">
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
                    className="neu-raised"
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
                      className="neu-inset"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="fromEmail">From</Label>
                    <Input
                      id="fromEmail"
                      placeholder="sender@yourdomain.com"
                      value={testFromEmail}
                      onChange={(e) => setTestFromEmail(e.target.value)}
                      className="neu-inset"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="fromName">From Name (optional)</Label>
                    <Input
                      id="fromName"
                      placeholder="Your Brand"
                      value={testFromName}
                      onChange={(e) => setTestFromName(e.target.value)}
                      className="neu-inset"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="Pikar AI Test Email"
                      value={testSubject}
                      onChange={(e) => setTestSubject(e.target.value)}
                      className="neu-inset"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Requires a verified sender in Resend. "From" must be a domain/address that's verified in your Resend account.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}