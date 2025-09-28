import React, { useState, useCallback } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerTrigger } from "@/components/ui/drawer";
import { Select } from "@/components/ui/select"; // Add: for mode dropdown in assistant
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminAssistantSection } from "@/components/admin/AdminAssistantSection";
import { Textarea } from "@/components/ui/textarea"; // may be unused; safe import

// Add local types for transcript steps
export default function AdminPage() {
  const navigate = useNavigate();
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    try {
      return typeof window !== "undefined"
        ? localStorage.getItem("adminSessionToken")
        : null;
    } catch {
      return null;
    }
  });
  const [safeModeDismissed, setSafeModeDismissed] = useState(false);

  // Add: Health drawer UI state
  const [healthOpen, setHealthOpen] = useState(false);

  // Validate admin session
  const adminSession = useQuery(
    api.adminAuthData.validateSession as any,
    adminToken ? { token: adminToken } : undefined
  );

  // Existing user-based admin check
  const isAdmin = useQuery(api.admin.getIsAdmin, {} as any);
  const ensureAdmin = useMutation(api.admin.ensureAdminSelf);
  const requestSenior = useMutation(api.admin.requestSeniorAdmin);
  const approveSenior = useMutation(api.admin.approveSeniorAdmin);

  // Determine if user has admin access via either method (STRICT boolean check)
  const hasAdminAccess = (adminSession?.valid === true) || (isAdmin === true);
  // removed unused adminRole
  const isAdminSession = adminSession?.valid === true;

  // Admin queries (only run if has access)
  const pending = useQuery(
    api.admin.listPendingAdminRequests as any,
    hasAdminAccess ? {} : undefined
  ) as Array<{ email: string; role: string; _id: string }> | undefined;

  const adminList = useQuery(
    api.admin.listAdmins as any,
    hasAdminAccess ? {} : undefined
  ) as Array<{ _id: string; email: string; role: string }> | undefined;

  // removed unused myRole

  // Add: health and feature flags queries
  const env = useQuery(api.health.envStatus, {} as any);
  const flags = useQuery(api.featureFlags.getFeatureFlags as any, hasAdminAccess ? {} : undefined) as Array<{
    _id: string;
    flagName: string;
    isEnabled: boolean;
    rolloutPercentage?: number;
    businessId?: string | null;
  }> | undefined;
  const flagAnalytics = useQuery(api.featureFlags.getFeatureFlagAnalytics as any, hasAdminAccess ? {} : undefined) as
    | {
        flags: any[];
        totalFlags: number;
        enabledFlags: number;
        usageEvents: number;
      }
    | undefined;

  const toggleFlag = useMutation(api.featureFlags.toggleFeatureFlag);
  const updateFlag = useMutation(api.featureFlags.updateFeatureFlag);
  const recentAudits = useQuery(
    api.audit.listRecent as any,
    hasAdminAccess
      ? (
          isAdminSession
            ? { limit: 200, adminToken }  // pass token when using independent Admin Portal session
            : { limit: 200 }              // user-based admin
        )
      : undefined
  ) as
    | Array<{
        _id: string;
        businessId: string;
        userId?: string;
        action: string;
        entityType: string;
        entityId: string;
        details?: any;
        createdAt: number;
      }>
    | undefined;

  // Add: Tenants & selection
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const tenants = useQuery(
    api.admin.listTenants as any,
    hasAdminAccess ? {} : undefined
  ) as Array<{ _id: string; name?: string; plan?: string; status?: string }> | undefined;

  // Add: Tenant Users for selected tenant (guest-safe)
  const tenantUsers = useQuery(
    api.admin.listTenantUsers as any,
    selectedTenantId ? { businessId: selectedTenantId } : undefined
  ) as Array<{ _id: string; name?: string; email?: string; role?: string }> | undefined;

  // Add: Usage & Billing queries (guest-safe; only fetched when a tenant is selected)
  const usage = useQuery(
    api.admin.getUsageSummary as any,
    selectedTenantId ? { tenantId: selectedTenantId } : undefined
  ) as
    | {
        workflows?: number;
        runs?: number;
        agents?: number;
        emailsSentLast7?: number;
      }
    | undefined;

  const billingEvents = useQuery(
    api.admin.listBillingEvents as any,
    selectedTenantId ? { tenantId: selectedTenantId } : undefined
  ) as
    | Array<{
        _id: string;
        type?: string;
        amount?: number;
        currency?: string;
        status?: string;
        _creationTime?: number;
      }>
    | undefined;

  // Add: API Keys panel state & operations
  const apiKeys = useQuery(
    api.admin.listApiKeys as any,
    selectedTenantId ? { tenantId: selectedTenantId } : undefined
  ) as Array<{ _id: string; name: string; scopes: string[]; createdAt: number; revokedAt?: number }> | undefined;

  const createApiKey = useMutation(api.admin.createApiKey as any);
  const revokeApiKey = useMutation(api.admin.revokeApiKey as any);
  const [newKeyName, setNewKeyName] = useState<string>("");
  const [newKeyScopes, setNewKeyScopes] = useState<string>("");
  const [freshSecret, setFreshSecret] = useState<string | null>(null);

  // Add: Alerts & Incidents operations
  const alerts = useQuery(
    api.admin.listAlerts as any,
    hasAdminAccess ? (selectedTenantId ? { tenantId: selectedTenantId } : {}) : undefined
  ) as Array<{ _id: string; title: string; severity: "low" | "medium" | "high"; status: "open" | "resolved"; createdAt: number }> | undefined;

  const createAlertMutation = useMutation(api.admin.createAlert as any);
  const resolveAlertMutation = useMutation(api.admin.resolveAlert as any);

  // Add Admin Assistant transcript + dry-run state
  const [assistantTranscriptOpen, setAssistantTranscriptOpen] = useState(false);
  const [assistantSteps, setAssistantSteps] = useState<Array<{ tool: string; title: string; data: any }>>([]);
  const [assistantSummaryText, setAssistantSummaryText] = useState<string | undefined>(undefined);
  const [assistantDryRun, setAssistantDryRun] = useState<boolean>(false);

  // Add: Assistant core UI state and action hook
  const [assistantMode, setAssistantMode] = useState<"explain" | "confirm" | "auto">("explain");
  const [assistantTools, setAssistantTools] = useState<{ health: boolean; flags: boolean; alerts: boolean }>({
    health: true,
    flags: true,
    alerts: true,
  });
  const [assistantMessages, setAssistantMessages] = useState<Array<{ role: "user" | "assistant"; content: string; steps?: any[] }>>([]);
  const [assistantInput, setAssistantInput] = useState<string>("");
  const [assistantBusy, setAssistantBusy] = useState<boolean>(false);
  const sendAssistantMessage = useAction(api.adminAssistant.sendMessage as any);

  // Audit Explorer filters
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [sinceDays, setSinceDays] = useState<number>(7);

  // Alerts & Incidents input state
  const [alertSeverity, setAlertSeverity] = useState<"low" | "medium" | "high">("low");
  const [alertTitle, setAlertTitle] = useState<string>("");
  const [alertDesc, setAlertDesc] = useState<string>("");

  // Add: Docs proposals + actions (Phase 6)
  const docsProposals = useQuery(
    api.docs.listProposals as any,
    hasAdminAccess ? {} : undefined
  ) as Array<{
    _id: string;
    title: string;
    slug: string;
    diffPreview: string;
    contentMarkdown: string;
    source: string;
    status: "pending" | "approved" | "rejected";
    createdAt: number;
  }> | undefined;

  const generateDocsProposal = useAction(api.docs.generateFromSeed as any);
  const approveDocsProposal = useMutation(api.docs.approveAndPublish as any);

  // Add: Agents admin queries and mutations, colocated near other admin queries
  const agentSummary = useQuery(
    api.aiAgents.adminAgentSummary as any,
    hasAdminAccess ? (selectedTenantId ? { tenantId: selectedTenantId } : {}) : undefined
  ) as { total: number; byTenant: Array<{ businessId: string; count: number }> } | undefined;

  const agents = useQuery(
    api.aiAgents.adminListAgents as any,
    hasAdminAccess ? (selectedTenantId ? { tenantId: selectedTenantId, limit: 200 } : { limit: 200 }) : undefined
  ) as Array<{
    _id: string;
    businessId: string;
    userId: string;
    brandVoice?: string;
    timezone?: string;
    lastUpdated?: number;
    trainingNotes?: string;
  }> | undefined;

  const adminUpdateAgentProfile = useMutation(api.aiAgents.adminUpdateAgentProfile as any);
  const adminMarkAgentDisabled = useMutation(api.aiAgents.adminMarkAgentDisabled as any);

  // Add: Agent session viewer state
  const [agentViewerOpen, setAgentViewerOpen] = useState(false);
  const [viewAgentId, setViewAgentId] = useState<string | null>(null);

  const handleLogout = () => {
    localStorage.removeItem("adminSessionToken");
    setAdminToken(null);
    toast.success("Logged out successfully");
    navigate("/admin-auth");
  };

  // Removed early return to avoid violating React Hooks rules (hooks must run in the same order every render).
  // When isAdmin is undefined and there's no adminToken yet, we will still render the shell; downstream sections
  // already handle undefined data and won't crash.

  if (!hasAdminAccess) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You don't have access to the Admin Panel.
            </p>
            
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <h4 className="font-medium text-emerald-800 mb-2">Admin Portal</h4>
              <p className="text-sm text-emerald-700 mb-3">
                Use the independent Admin Portal for platform administration.
              </p>
              <Button
                onClick={() => navigate("/admin-auth")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Use Admin Portal
              </Button>
            </div>

            <Separator />

            <p className="text-xs text-muted-foreground">
              Alternative: If your email is in the ADMIN_EMAILS allowlist (comma-separated), you can claim super admin:
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await ensureAdmin({});
                    toast.success("Admin access claimed. Reloading...");
                    window.location.reload();
                  } catch (e: any) {
                    toast.error(e?.message || "Failed to claim admin");
                  }
                }}
              >
                Claim Super Admin (Allowlist)
              </Button>
              <Button
                variant="secondary"
                onClick={async () => {
                  try {
                    await requestSenior({});
                    toast.success("Requested Senior Admin access. A Super Admin must approve.");
                  } catch (e: any) {
                    toast.error(e?.message || "Failed to request Senior Admin");
                  }
                }}
              >
                Request Senior Admin
              </Button>
            </div>
            <Separator />
            <Button variant="secondary" onClick={() => navigate("/auth")}>
              Sign in / Create Account
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Add helper to scroll to sections by id
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Add: KPI snapshot computed from queries
  const kpis = (() => {
    const flagsTotal = (flagAnalytics?.totalFlags ?? (flags?.length ?? 0)) as number;
    const flagsEnabled = (flagAnalytics?.enabledFlags ?? (flags ? flags.filter((f) => f.isEnabled).length : 0)) as number;
    return {
      admins: (adminList?.length ?? 0) as number,
      pending: (pending?.length ?? 0) as number,
      flagsEnabled,
      flagsTotal,
      emailQueueDepth: (env?.emailQueueDepth ?? 0) as number,
      overdueApprovals: (env?.overdueApprovalsCount ?? 0) as number,
    };
  })();

  // Add: Audit filtering and CSV export helper
  const filteredAudits = (() => {
    const cutoff = Date.now() - (sinceDays || 0) * 24 * 60 * 60 * 1000;
    const list = (recentAudits || []) as any[];
    const af = (actionFilter || "").toLowerCase();
    const ef = (entityFilter || "").toLowerCase();
    return list.filter((a) => {
      if (typeof a.createdAt === "number" && a.createdAt < cutoff) return false;
      if (af && !(a.action || "").toLowerCase().includes(af)) return false;
      const entity = ((a.entityType || "") + (a.entityId ? `:${a.entityId}` : "")).toLowerCase();
      if (ef && !entity.includes(ef)) return false;
      return true;
    });
  })();

  const exportAuditsCsv = () => {
    const header = ["createdAt", "businessId", "action", "entityType", "entityId", "userId"].join(",");
    const body = filteredAudits
      .map((a) =>
        [
          a.createdAt,
          a.businessId ?? "",
          a.action ?? "",
          a.entityType ?? "",
          a.entityId ?? "",
          a.userId ?? "",
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    const csv = [header, body].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audits_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Derived: Agent-specific audits, top intents, last errors for the session viewer
  const viewAgentAudits = useMemo(() => {
    if (!viewAgentId) return [] as any[];
    const list = (recentAudits || []) as any[];
    return list.filter(
      (a) =>
        a.entityId === viewAgentId ||
        (a.details &&
          typeof a.details === "object" &&
          ((a.details.profileId && String(a.details.profileId) === viewAgentId) ||
            (a.details.agentId && String(a.details.agentId) === viewAgentId)))
    );
  }, [viewAgentId, recentAudits]);

  const agentTopIntents = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of viewAgentAudits) {
      const intent = (a?.details?.intent ?? "") as string;
      if (intent) counts[intent] = (counts[intent] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [viewAgentAudits]);

  const agentLastErrors = useMemo(() => {
    const errs: Array<{ when: number; message: string }> = [];
    for (const a of viewAgentAudits) {
      const action = String(a.action || "").toLowerCase();
      const msg = (a?.details?.error || a?.details?.message || "") as string;
      if (action.includes("error") || action.includes("fail") || msg) {
        errs.push({ when: a.createdAt as number, message: msg || action });
      }
    }
    return errs.slice(0, 5);
  }, [viewAgentAudits]);

  return (
    <>
      {/* Admin-only emerald sidebar */}
      <AdminSidebar
        onNavigate={scrollToSection}
        isAdminSession={isAdminSession}
        onLogout={handleLogout}
      />

      {/* Shift main content to accommodate the sidebar */}
      <div className="md:pl-64">
        {/* Safe Mode banner */}
        {env?.devSafeEmailsEnabled && !safeModeDismissed && (
          <div className="p-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 flex items-start justify-between">
            <div className="pr-4">
              <div className="font-medium">DEV Safe Mode is active</div>
              <div className="text-sm">
                Outbound email delivery is stubbed (DEV_SAFE_EMAILS=true). Use Settings to configure live sending when ready.
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setSafeModeDismissed(true)}>
              Dismiss
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <div className="flex gap-2">
            {isAdminSession && (
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            )}
            <Button variant="secondary" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* System Health Strip with drill-down tooltips */}
        <Card>
          <CardHeader>
            <CardTitle id="section-system-health" className="flex items-center gap-2">
              <span>System Health</span>
              <Drawer open={healthOpen} onOpenChange={setHealthOpen}>
                <DrawerTrigger asChild>
                  <Button size="xs" variant="outline">Details</Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>System Health Details</DrawerTitle>
                    <DrawerDescription className="text-sm">
                      Quick remediation and validation tools.
                    </DrawerDescription>
                  </DrawerHeader>
                  <div className="px-6 pb-6 space-y-4">
                    <div className="space-y-1">
                      <div className="font-medium">RESEND</div>
                      <div className="text-sm text-muted-foreground">
                        {env?.hasRESEND ? "Configured. You can send emails." : "Missing. Set RESEND_API_KEY in Integrations."}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            toast("Opening Settings...");
                            // Navigate to Settings so admins can run tests from there
                            window.location.href = "/settings";
                          }}
                        >
                          Open Settings
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-1">
                      <div className="font-medium">Public Base URL</div>
                      <div className="text-sm text-muted-foreground">
                        {env?.hasBASE_URL ? "Configured" : "Missing (VITE_PUBLIC_BASE_URL)"}
                      </div>
                      <div className="flex gap-2">
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
                          Show & Open Base URL
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-1">
                      <div className="font-medium">Operational Signals</div>
                      <div className="text-sm text-muted-foreground">
                        Queue depth: {env?.emailQueueDepth ?? 0} • Overdue approvals: {env?.overdueApprovalsCount ?? 0}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Cron last processed: {env?.cronLastProcessed ? new Date(env.cronLastProcessed).toLocaleString() : "Unknown"}
                      </div>
                    </div>
                  </div>
                </DrawerContent>
              </Drawer>
            </CardTitle>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 rounded-md border">
                <div className="text-sm text-muted-foreground">Email Queue Depth</div>
                <div className="text-xl font-semibold">{kpis.emailQueueDepth}</div>
              </div>
              <div className="p-3 rounded-md border">
                <div className="text-sm text-muted-foreground">Overdue Approvals</div>
                <div className="text-xl font-semibold">{kpis.overdueApprovals}</div>
              </div>
              <div className="p-3 rounded-md border">
                <div className="text-sm text-muted-foreground">Cron Freshness</div>
                <div className="text-xs text-muted-foreground">
                  {env?.cronLastProcessed ? new Date(env.cronLastProcessed).toLocaleString() : "Unknown"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Snapshot Row */}
        <div id="section-kpis" className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Admins</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-semibold">{kpis.admins}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Pending Requests</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-semibold">{kpis.pending}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Flags Enabled</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{kpis.flagsEnabled}</div>
              <div className="text-xs text-muted-foreground">of {kpis.flagsTotal}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Email Queue</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-semibold">{kpis.emailQueueDepth}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">SLA Overdue</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-semibold">{kpis.overdueApprovals}</div></CardContent>
          </Card>
        </div>

        {/* Feature Flags Panel with inline rollout % and scope controls */}
        <Card>
          <CardHeader>
            <CardTitle id="section-feature-flags">Feature Flags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Manage global and tenant-specific feature flags. Toggling and edits take effect immediately.
            </p>
            <div className="rounded-md border overflow-hidden">
              <div className="grid grid-cols-3 md:grid-cols-7 gap-2 p-3 bg-muted/40 text-xs font-medium">
                <div>Name</div>
                <div>Status</div>
                <div>Rollout %</div>
                <div className="hidden md:block">Scope</div>
                <div className="hidden md:block">Edit %</div>
                <div className="hidden md:block">Scope To</div>
                <div className="text-right">Toggle</div>
              </div>
              <Separator />
              <div className="divide-y">
                {(flags || []).map((f) => (
                  <div key={f._id} className="grid grid-cols-3 md:grid-cols-7 gap-2 p-3 text-sm items-center">
                    <div className="truncate">{f.flagName}</div>
                    <div>
                      <Badge variant={f.isEnabled ? "outline" : "secondary"}>
                        {f.isEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <div>{typeof f.rolloutPercentage === "number" ? `${f.rolloutPercentage}%` : "—"}</div>
                    <div className="hidden md:block">{f.businessId ? "Tenant" : "Global"}</div>

                    {/* Edit rollout% */}
                    <div className="hidden md:block">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          const current = typeof f.rolloutPercentage === "number" ? f.rolloutPercentage : 100;
                          const input = prompt(`Set rollout percentage for "${f.flagName}" (0-100):`, String(current));
                          if (input == null) return;
                          const pct = Number(input);
                          if (Number.isNaN(pct) || pct < 0 || pct > 100) {
                            toast.error("Please enter a valid number between 0 and 100.");
                            return;
                          }
                          try {
                            await updateFlag({ flagId: f._id as any, rolloutPercentage: pct });
                            toast.success(`Updated rollout to ${pct}%`);
                          } catch (e: any) {
                            toast.error(e?.message || "Failed to update rollout");
                          }
                        }}
                      >
                        Edit %
                      </Button>
                    </div>

                    {/* Scope controls */}
                    <div className="hidden md:flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          const bid = prompt(
                            `Scope "${f.flagName}" to a tenant businessId.\nEnter "global" to remove tenant scope.`,
                            f.businessId ? String(f.businessId) : "global"
                          );
                          if (bid == null) return;
                          try {
                            if (bid.toLowerCase() === "global") {
                              await updateFlag({ flagId: f._id as any, businessId: null });
                              toast.success("Scoped to Global");
                            } else {
                              await updateFlag({ flagId: f._id as any, businessId: bid as any });
                              toast.success(`Scoped to tenant: ${bid}`);
                            }
                          } catch (e: any) {
                            toast.error(e?.message || "Failed to update scope");
                          }
                        }}
                      >
                        Scope
                      </Button>
                    </div>

                    {/* Toggle */}
                    <div className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            const newVal = await toggleFlag({ flagId: f._id as any });
                            toast.success(`Flag "${f.flagName}" is now ${newVal ? "Enabled" : "Disabled"}`);
                          } catch (e: any) {
                            toast.error(e?.message || "Failed to toggle flag");
                          }
                        }}
                      >
                        Toggle
                      </Button>
                    </div>
                  </div>
                ))}
                {(!flags || flags.length === 0) && (
                  <div className="p-3 text-sm text-muted-foreground">No flags configured yet.</div>
                )}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Usage events observed: {flagAnalytics?.usageEvents ?? 0}
            </div>
          </CardContent>
        </Card>

        {/* Pending Senior Admin Requests (unchanged) */}
        {(pending && pending.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle id="section-pending-senior">Pending Senior Admin Requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Approve requests to grant Senior Admin privileges.
              </p>
              <div className="rounded-md border">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-muted/40 text-xs font-medium">
                  <div>Email</div>
                  <div>Status</div>
                  <div className="hidden md:block">Action</div>
                </div>
                <Separator />
                <div className="divide-y">
                  {pending.map((p) => (
                    <div key={p._id} className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 text-sm items-center">
                      <div>{p.email}</div>
                      <div>
                        <Badge variant="outline">Pending</Badge>
                      </div>
                      <div className="hidden md:flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={async () => {
                            try {
                              await approveSenior({ email: p.email });
                              toast.success(`Approved ${p.email} as Senior Admin`);
                            } catch (e: any) {
                              toast.error(e?.message || "Approval failed");
                            }
                          }}
                        >
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Administrators Table (unchanged) */}
        <Card>
          <CardHeader>
            <CardTitle id="section-admins">Administrators</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Allowlist: set ADMIN_EMAILS (comma-separated). You can also persist admins in the table below.
            </p>
            <div className="rounded-md border">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-muted/40 text-xs font-medium">
                <div>Email</div>
                <div>Role</div>
                <div className="hidden md:block">Id</div>
              </div>
              <Separator />
              <div className="divide-y">
                {(adminList || []).map((a) => (
                  <div key={a._id} className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 text-sm">
                    <div>{a.email}</div>
                    <div>
                      <Badge variant="outline">{a.role}</Badge>
                    </div>
                    <div className="hidden md:block text-muted-foreground">{a._id}</div>
                  </div>
                ))}
                {(!adminList || adminList.length === 0) && (
                  <div className="p-3 text-sm text-muted-foreground">No admins found yet.</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tenants Panel (read-only) */}
        <Card>
          <CardHeader>
            <CardTitle id="section-tenants">Tenants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Read-only list of tenants. Select a tenant to view its users and API keys.
            </p>

            <div className="rounded-md border overflow-hidden">
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2 p-3 bg-muted/40 text-xs font-medium">
                <div>Name</div>
                <div className="hidden md:block">Plan</div>
                <div>Status</div>
                <div className="hidden md:block">Id</div>
                <div className="text-right">Select</div>
              </div>
              <Separator />
              <div className="divide-y">
                {(tenants || []).map((t) => (
                  <div key={t._id} className="grid grid-cols-3 md:grid-cols-5 gap-2 p-3 text-sm items-center">
                    <div className="truncate">{t.name || "Tenant"}</div>
                    <div className="hidden md:block">{t.plan || "—"}</div>
                    <div>{t.status || "active"}</div>
                    <div className="hidden md:block text-muted-foreground truncate">{t._id}</div>
                    <div className="text-right">
                      <Button
                        size="sm"
                        variant={selectedTenantId === t._id ? "default" : "outline"}
                        onClick={() => setSelectedTenantId(selectedTenantId === t._id ? "" : t._id)}
                      >
                        {selectedTenantId === t._id ? "Selected" : "Select"}
                      </Button>
                    </div>
                  </div>
                ))}
                {(!tenants || tenants.length === 0) && (
                  <div className="p-3 text-sm text-muted-foreground">No tenants found.</div>
                )}
              </div>
            </div>

            {selectedTenantId && (
              <div className="rounded-md border p-3">
                <div className="font-medium mb-2">Tenant Users</div>
                <div className="rounded-md border overflow-hidden">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 bg-muted/40 text-xs font-medium">
                    <div>Name</div>
                    <div>Email</div>
                    <div className="hidden md:block">Role</div>
                    <div className="text-right">Id</div>
                  </div>
                  <Separator />
                  <div className="divide-y">
                    {(tenantUsers || []).map((u) => (
                      <div key={u._id} className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 text-sm items-center">
                        <div className="truncate">{u.name || "User"}</div>
                        <div className="truncate">{u.email || "—"}</div>
                        <div className="hidden md:block">{u.role || "member"}</div>
                        <div className="text-right text-muted-foreground truncate">{u._id}</div>
                      </div>
                    ))}
                    {(!tenantUsers || tenantUsers.length === 0) && (
                      <div className="p-3 text-sm text-muted-foreground">No users for this tenant.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Keys Panel (generate/revoke) */}
        <Card>
          <CardHeader>
            <CardTitle id="section-api-keys">API Keys</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Keys are scoped to the selected tenant. New keys are shown once; the secret cannot be retrieved again.
            </p>

            <div className="grid md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <div className="text-sm font-medium">Tenant</div>
                <select
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                >
                  <option value="">Select a tenant</option>
                  {(tenants || []).map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name || t._id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="text-sm font-medium">Key Name</div>
                <Input
                  placeholder="Server Key"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <div className="text-sm font-medium">Scopes (comma-separated)</div>
                <Input
                  placeholder="admin:read,admin:write"
                  value={newKeyScopes}
                  onChange={(e) => setNewKeyScopes(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={async () => {
                  if (!selectedTenantId) {
                    toast.error("Select a tenant first.");
                    return;
                  }
                  if (!newKeyName.trim()) {
                    toast.error("Enter a key name.");
                    return;
                  }
                  try {
                    toast("Creating API key...");
                    const scopesArr = newKeyScopes
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean);
                    const res = await createApiKey({
                      tenantId: selectedTenantId,
                      name: newKeyName.trim(),
                      scopes: scopesArr,
                    } as any);
                    // Expect { secret: string }
                    setFreshSecret(res?.secret || null);
                    if (res?.secret) {
                      toast.success("Key created. Copy and store it securely.");
                    } else {
                      toast.success("Key created.");
                    }
                    setNewKeyName("");
                  } catch (e: any) {
                    toast.error(e?.message || "Failed to create API key");
                  }
                }}
                disabled={!selectedTenantId}
              >
                Generate Key
              </Button>

              {freshSecret && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(freshSecret).then(() => {
                      toast.success("Copied API key secret");
                    });
                  }}
                >
                  Copy New Key
                </Button>
              )}
            </div>

            {freshSecret && (
              <div className="p-3 rounded-md border bg-amber-50 text-amber-900 text-sm">
                This secret will not be shown again. Copy and store it securely now.
              </div>
            )}

            <div className="rounded-md border overflow-hidden">
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 p-3 bg-muted/40 text-xs font-medium">
                <div>Name</div>
                <div className="hidden md:block">Scopes</div>
                <div>Created</div>
                <div className="hidden md:block">Revoked</div>
                <div className="hidden md:block">Id</div>
                <div className="text-right">Action</div>
              </div>
              <Separator />
              <div className="divide-y">
                {(apiKeys || []).map((k) => (
                  <div key={k._id} className="grid grid-cols-3 md:grid-cols-6 gap-2 p-3 text-sm items-center">
                    <div className="truncate">{k.name}</div>
                    <div className="hidden md:block truncate">{(k.scopes || []).join(", ") || "—"}</div>
                    <div className="truncate">{new Date(k.createdAt).toLocaleString()}</div>
                    <div className="hidden md:block">{k.revokedAt ? new Date(k.revokedAt).toLocaleString() : "—"}</div>
                    <div className="hidden md:block text-muted-foreground truncate">{k._id}</div>
                    <div className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!!k.revokedAt}
                        onClick={async () => {
                          try {
                            await revokeApiKey({ apiKeyId: k._id } as any);
                            toast.success("Key revoked");
                          } catch (e: any) {
                            toast.error(e?.message || "Failed to revoke key");
                          }
                        }}
                      >
                        Revoke
                      </Button>
                    </div>
                  </div>
                ))}
                {(!apiKeys || apiKeys.length === 0) && (
                  <div className="p-3 text-sm text-muted-foreground">
                    {selectedTenantId ? "No API keys for this tenant yet." : "Select a tenant to view keys."}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing & Usage Section */}
        <Card>
          <CardHeader>
            <CardTitle id="section-billing">Billing & Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Select a tenant to view plan, status, recent billing events, and usage.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-md border">
                <div className="text-xs text-muted-foreground">Tenant</div>
                <div className="text-sm font-medium">
                  {selectedTenantId
                    ? (tenants || []).find((t) => t._id === selectedTenantId)?.name || selectedTenantId
                    : "None"}
                </div>
              </div>
              <div className="p-3 rounded-md border">
                <div className="text-xs text-muted-foreground">Plan</div>
                <div className="text-sm font-medium">
                  {(tenants || []).find((t) => t._id === selectedTenantId)?.plan || "—"}
                </div>
              </div>
              <div className="p-3 rounded-md border">
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="text-sm font-medium">
                  {(tenants || []).find((t) => t._id === selectedTenantId)?.status || "—"}
                </div>
              </div>
              <div className="p-3 rounded-md border">
                <div className="text-xs text-muted-foreground">Stripe IDs</div>
                <div className="text-xs text-muted-foreground">
                  Not available in summary
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-md border">
                <div className="text-xs text-muted-foreground">Workflows</div>
                <div className="text-xl font-semibold">{usage?.workflows ?? 0}</div>
              </div>
              <div className="p-3 rounded-md border">
                <div className="text-xs text-muted-foreground">Runs</div>
                <div className="text-xl font-semibold">{usage?.runs ?? 0}</div>
              </div>
              <div className="p-3 rounded-md border">
                <div className="text-xs text-muted-foreground">Agents</div>
                <div className="text-xl font-semibold">{usage?.agents ?? 0}</div>
              </div>
              <div className="p-3 rounded-md border">
                <div className="text-xs text-muted-foreground">Emails (7d)</div>
                <div className="text-xl font-semibold">{usage?.emailsSentLast7 ?? 0}</div>
              </div>
            </div>

            <div className="rounded-md border overflow-hidden">
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2 p-3 bg-muted/40 text-xs font-medium">
                <div>When</div>
                <div className="hidden md:block">Type</div>
                <div>Amount</div>
                <div className="hidden md:block">Currency</div>
                <div>Status</div>
                <div className="text-right">Info</div>
              </div>
              <Separator />
              <div className="divide-y">
                {(billingEvents || []).map((ev) => (
                  <div key={ev._id} className="grid grid-cols-4 md:grid-cols-6 gap-2 p-3 text-sm items-center">
                    <div className="text-xs text-muted-foreground">
                      {ev._creationTime ? new Date(ev._creationTime).toLocaleString() : "—"}
                    </div>
                    <div className="hidden md:block truncate">{ev.type || "—"}</div>
                    <div className="truncate">{typeof ev.amount === "number" ? ev.amount : "—"}</div>
                    <div className="hidden md:block">{ev.currency || "—"}</div>
                    <div>{ev.status || "—"}</div>
                    <div className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toast(JSON.stringify(ev, null, 2))}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ))}
                {(!billingEvents || billingEvents.length === 0) && (
                  <div className="p-3 text-sm text-muted-foreground">
                    {selectedTenantId ? "No recent billing events." : "Select a tenant to view billing events."}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integrations Hub */}
        <Card>
          <CardHeader>
            <CardTitle id="section-integrations">Integrations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Integration posture derives from System Health. Use quick actions to remediate.
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
            <div className="text-xs text-muted-foreground">
              For test email sending and deeper checks, use the Settings page's inline validators.
            </div>
          </CardContent>
        </Card>

        {/* Custom Agents Admin Panel */}
        <Card>
          <CardHeader>
            <CardTitle id="section-custom-agents">Custom Agents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Read-only visibility with safe admin overrides (training notes, brand voice). Use tenant filter above to scope.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-md border">
                <div className="text-xs text-muted-foreground">Total Agents</div>
                <div className="text-xl font-semibold">{agentSummary?.total ?? 0}</div>
              </div>
              <div className="p-3 rounded-md border md:col-span-3">
                <div className="text-xs text-muted-foreground">Counts by Tenant</div>
                <div className="text-xs">
                  {(agentSummary?.byTenant || []).slice(0, 6).map((t) => (
                    <span key={t.businessId} className="inline-block mr-2 mb-1 px-2 py-0.5 rounded border">
                      {t.businessId}: {t.count}
                    </span>
                  ))}
                  {!(agentSummary?.byTenant?.length) && <span className="text-muted-foreground">None</span>}
                </div>
              </div>
            </div>

            <div className="rounded-md border overflow-hidden">
              <div className="grid grid-cols-4 md:grid-cols-8 gap-2 p-3 bg-muted/40 text-xs font-medium">
                <div>Tenant</div>
                <div className="hidden md:block">User</div>
                <div>Brand Voice</div>
                <div className="hidden md:block">Timezone</div>
                <div className="hidden md:block">Last Updated</div>
                <div className="hidden md:block">Disabled?</div>
                <div className="hidden md:block">Actions</div>
                <div className="text-right">Id</div>
              </div>
              <Separator />
              <div className="divide-y">
                {(agents || []).map((a) => {
                  const disabled = (a.trainingNotes || "").includes("[DISABLED]");
                  return (
                    <div key={a._id} className="grid grid-cols-4 md:grid-cols-8 gap-2 p-3 text-sm items-center">
                      <div className="truncate">{a.businessId}</div>
                      <div className="hidden md:block truncate">{a.userId}</div>
                      <div className="truncate">{a.brandVoice || "—"}</div>
                      <div className="hidden md:block truncate">{a.timezone || "—"}</div>
                      <div className="hidden md:block text-xs text-muted-foreground">
                        {a.lastUpdated ? new Date(a.lastUpdated).toLocaleString() : "—"}
                      </div>
                      <div className="hidden md:block">
                        <Badge variant={disabled ? "destructive" : "outline"}>{disabled ? "Disabled" : "Active"}</Badge>
                      </div>
                      <div className="hidden md:flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const input = prompt("Update training notes (will overwrite):", a.trainingNotes || "");
                            if (input == null) return;
                            try {
                              await adminUpdateAgentProfile({ profileId: a._id, trainingNotes: input });
                              toast.success("Training notes updated");
                            } catch (e: any) {
                              toast.error(e?.message || "Failed to update notes");
                            }
                          }}
                        >
                          Notes
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const input = prompt("Update brand voice (e.g., casual, formal):", a.brandVoice || "");
                            if (input == null) return;
                            try {
                              await adminUpdateAgentProfile({ profileId: a._id, brandVoice: input });
                              toast.success("Brand voice updated");
                            } catch (e: any) {
                              toast.error(e?.message || "Failed to update voice");
                            }
                          }}
                        >
                          Voice
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const reason = prompt("Reason for disabling this agent? (optional)") || "";
                            try {
                              await adminMarkAgentDisabled({ profileId: a._id, reason });
                              toast.success("Agent marked disabled");
                            } catch (e: any) {
                              toast.error(e?.message || "Failed to mark disabled");
                            }
                          }}
                          disabled={disabled}
                        >
                          Disable
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setViewAgentId(a._id);
                            setAgentViewerOpen(true);
                          }}
                        >
                          View
                        </Button>
                      </div>
                      <div className="text-right text-muted-foreground truncate">{a._id}</div>
                    </div>
                  );
                })}
                {(!agents || agents.length === 0) && (
                  <div className="p-3 text-sm text-muted-foreground">
                    {selectedTenantId ? "No agents for this tenant." : "No agents found."}
                  </div>
                )}
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Guardrails: Admin-only; all operations audited. "Disable" adds a sentinel to notes. For full isolation, use tenant-scoped feature flags.
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Incident Console */}
        <Card>
          <CardHeader>
            <CardTitle id="section-alerts">Alerts & Incidents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Create and resolve operational alerts. Scope to a tenant when applicable.
            </p>

            <div className="grid md:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <div className="text-sm font-medium">Severity</div>
                <select
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  value={alertSeverity}
                  onChange={(e) => setAlertSeverity(e.target.value as any)}
                >
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <div className="text-sm font-medium">Title</div>
                <Input
                  placeholder="Queue depth high on tenant ABC"
                  value={alertTitle}
                  onChange={(e) => setAlertTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <div className="text-sm font-medium">Scope (Tenant)</div>
                <select
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                >
                  <option value="">Global</option>
                  {(tenants || []).map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name || t._id}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-4">
                <div className="text-sm font-medium">Description</div>
                <textarea
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="Optional context"
                  rows={3}
                  value={alertDesc}
                  onChange={(e) => setAlertDesc(e.target.value)}
                />
              </div>
              <div className="md:col-span-4 flex justify-end">
                <Button
                  size="sm"
                  onClick={async () => {
                    if (!alertTitle.trim()) {
                      toast.error("Enter a title for the alert.");
                      return;
                    }
                    try {
                      await createAlertMutation({
                        tenantId: selectedTenantId || undefined,
                        severity: alertSeverity,
                        title: alertTitle.trim(),
                        description: alertDesc || undefined,
                      } as any);
                      setAlertTitle("");
                      setAlertDesc("");
                      toast.success("Alert created");
                    } catch (e: any) {
                      toast.error(e?.message || "Failed to create alert");
                    }
                  }}
                >
                  Create Alert
                </Button>
              </div>
            </div>

            <div className="rounded-md border overflow-hidden">
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 p-3 bg-muted/40 text-xs font-medium">
                <div>When</div>
                <div className="hidden md:block">Severity</div>
                <div>Title</div>
                <div className="hidden md:block">Status</div>
                <div className="hidden md:block">Tenant</div>
                <div className="text-right">Action</div>
              </div>
              <Separator />
              <div className="divide-y">
                {(alerts || []).map((a) => (
                  <div key={a._id} className="grid grid-cols-3 md:grid-cols-6 gap-2 p-3 text-sm items-center">
                    <div className="text-xs text-muted-foreground">
                      {a.createdAt ? new Date(a.createdAt).toLocaleString() : "—"}
                    </div>
                    <div className="hidden md:block">
                      <Badge variant={a.severity === "high" ? "destructive" : "outline"}>{a.severity}</Badge>
                    </div>
                    <div className="truncate">{a.title}</div>
                    <div className="hidden md:block">{a.status || "open"}</div>
                    <div className="hidden md:block truncate">
                      {selectedTenantId ? (tenants || []).find((t) => t._id === selectedTenantId)?.name || selectedTenantId : "—"}
                    </div>
                    <div className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await resolveAlertMutation({ alertId: a._id } as any);
                            toast.success("Alert resolved");
                          } catch (e: any) {
                            toast.error(e?.message || "Failed to resolve alert");
                          }
                        }}
                      >
                        Resolve
                      </Button>
                    </div>
                  </div>
                ))}
                {(!alerts || alerts.length === 0) && (
                  <div className="p-3 text-sm text-muted-foreground">
                    {selectedTenantId ? "No alerts for this tenant." : "No alerts found."}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add the new "Assistant Docs" section */}
        <Card>
          <CardHeader>
            <CardTitle id="section-assistant-docs">Assistant Docs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Generate docs proposals from internal sources and approve to publish. This MVP seeds from an internal overview.
            </p>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={async () => {
                  try {
                    toast("Generating proposal from seed...");
                    await generateDocsProposal({ source: "seed:readme" } as any);
                    toast.success("Proposal generated");
                  } catch (e: any) {
                    toast.error(e?.message || "Failed to generate proposal");
                  }
                }}
              >
                Generate from README seed
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  toast("Open proposals are listed below. Approve to publish.");
                }}
              >
                How it works
              </Button>
            </div>

            <div className="rounded-md border overflow-hidden">
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 p-3 bg-muted/40 text-xs font-medium">
                <div>Title</div>
                <div className="hidden md:block">Slug</div>
                <div>Source</div>
                <div className="hidden md:block">Created</div>
                <div className="hidden md:block">Status</div>
                <div className="text-right">Action</div>
              </div>
              <Separator />
              <div className="divide-y">
                {(docsProposals || []).map((p) => (
                  <div key={p._id} className="grid grid-cols-3 md:grid-cols-6 gap-2 p-3 text-sm items-center">
                    <div className="truncate">{p.title}</div>
                    <div className="hidden md:block truncate">/{p.slug}</div>
                    <div className="truncate">{p.source}</div>
                    <div className="hidden md:block text-xs text-muted-foreground">
                      {p.createdAt ? new Date(p.createdAt).toLocaleString() : "—"}
                    </div>
                    <div className="hidden md:block">
                      <Badge variant={p.status === "pending" ? "secondary" : "outline"}>{p.status}</Badge>
                    </div>
                    <div className="text-right flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toast(p.diffPreview)}
                      >
                        View Diff
                      </Button>
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            await approveDocsProposal({ proposalId: p._id } as any);
                            toast.success("Published");
                          } catch (e: any) {
                            toast.error(e?.message || "Failed to publish");
                          }
                        }}
                        disabled={p.status !== "pending"}
                      >
                        Approve & Publish
                      </Button>
                    </div>
                  </div>
                ))}
                {(!docsProposals || docsProposals.length === 0) && (
                  <div className="p-3 text-sm text-muted-foreground">No pending proposals. Generate one above.</div>
                )}
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Publishing writes a docs page record. Future steps: multi-source ingestion, manual edits, and a public docs viewer.
            </div>
          </CardContent>
        </Card>

        {/* Audit Explorer (MVP) */}
        <Card>
          <CardHeader>
            <CardTitle id="section-audit-explorer">Audit Explorer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <Input
                placeholder="Filter by action"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              />
              <Input
                placeholder="Filter by entity type"
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
              />
              <div className="col-span-1 md:col-span-2 flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  value={sinceDays}
                  onChange={(e) => setSinceDays(Number(e.target.value || 0))}
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={exportAuditsCsv}>
                  Export CSV
                </Button>
              </div>
            </div>

            <div className="rounded-md border overflow-hidden">
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2 p-3 bg-muted/40 text-xs font-medium">
                <div>When</div>
                <div className="hidden md:block">Tenant</div>
                <div>Action</div>
                <div>Entity</div>
                <div className="hidden md:block">Actor</div>
                <div className="text-right">Details</div>
              </div>
              <Separator />
              <div className="divide-y">
                {filteredAudits.map((a) => (
                  <div key={a._id} className="grid grid-cols-4 md:grid-cols-6 gap-2 p-3 text-sm">
                    <div className="text-xs text-muted-foreground">
                      {new Date(a.createdAt).toLocaleString()}
                    </div>
                    <div className="hidden md:block truncate">{a.businessId}</div>
                    <div className="truncate">{a.action}</div>
                    <div className="truncate">{a.entityType}{a.entityId ? `:${a.entityId}` : ""}</div>
                    <div className="hidden md:block truncate">{a.userId || "—"}</div>
                    <div className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          toast(JSON.stringify(a.details ?? {}, null, 2));
                        }}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredAudits.length === 0 && (
                  <div className="p-3 text-sm text-muted-foreground">No audit events found for the current filters.</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Assistant Section (moved to component) */}
        <AdminAssistantSection
          adminSessionValid={isAdminSession}
          adminToken={adminToken}
        />

        {/* System Agents placeholder section (training studio to be built in next phase) */}
        <Card>
          <CardHeader>
            <CardTitle id="section-system-agents">System Agents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Registry and training studio for built-in agents will appear here (next phase).
            </div>
            <div className="rounded-md border p-3 text-sm">
              Coming soon: list of built-ins, prompt editor, datasets, tool permissions, evals, test harness, and publish flow.
            </div>
          </CardContent>
        </Card>

        {/* Admin Roadmap Compliance card */}
        <Card>
          <CardHeader>
            <CardTitle id="section-roadmap-compliance">Admin Roadmap Compliance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Feature Management */}
              <div className="p-3 rounded-md border">
                <div className="font-medium">Feature Flags & Rollouts</div>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="outline">Implemented</Badge>
                  <span className="text-muted-foreground">Per-tenant flags, toggle, rollout % edit, scope</span>
                </div>
              </div>

              {/* Audit & Compliance */}
              <div className="p-3 rounded-md border">
                <div className="font-medium">Audit & Compliance</div>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="outline">Implemented</Badge>
                  <span className="text-muted-foreground">Audit Explorer with filters and CSV export</span>
                </div>
              </div>

              {/* System Health & Observability */}
              <div className="p-3 rounded-md border">
                <div className="font-medium">System Health & Alerting</div>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="outline">Implemented</Badge>
                  <span className="text-muted-foreground">Env checks, queue depth, cron freshness, SLA</span>
                </div>
              </div>

              {/* Tenant & User Management */}
              <div className="p-3 rounded-md border">
                <div className="font-medium">Tenant & User Management</div>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="secondary">Partial</Badge>
                  <span className="text-muted-foreground">Admin roles present; full tenant provisioning planned</span>
                </div>
              </div>

              {/* Auth/Onboarding/SSO/SCIM */}
              <div className="p-3 rounded-md border">
                <div className="font-medium">SSO/SCIM & Onboarding</div>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="secondary">Partial</Badge>
                  <span className="text-muted-foreground">Independent admin auth done; SSO/SCIM planned</span>
                </div>
              </div>

              {/* API Key Management */}
              <div className="p-3 rounded-md border">
                <div className="font-medium">API Key Management</div>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="secondary">Planned</Badge>
                  <span className="text-muted-foreground">Create/rotate/revoke service keys pending</span>
                </div>
              </div>

              {/* Billing & Usage */}
              <div className="p-3 rounded-md border">
                <div className="font-medium">Billing & Usage</div>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="secondary">Partial</Badge>
                  <span className="text-muted-foreground">Stripe onboarding integrated; usage metering planned</span>
                </div>
              </div>

              {/* Agent Orchestration */}
              <div className="p-3 rounded-md border">
                <div className="font-medium">Agent Orchestration & Templates</div>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="secondary">Partial</Badge>
                  <span className="text-muted-foreground">Custom AI Agent base present; registry/rollback planned</span>
                </div>
              </div>

              {/* Integrations & Connectors */}
              <div className="p-3 rounded-md border">
                <div className="font-medium">Integrations & Connectors</div>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="secondary">Planned</Badge>
                  <span className="text-muted-foreground">Connector store, webhooks, secret store pending</span>
                </div>
              </div>

              {/* Support & Changelog */}
              <div className="p-3 rounded-md border">
                <div className="font-medium">Support & Changelog</div>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="secondary">Planned</Badge>
                  <span className="text-muted-foreground">Support console & release notes pending</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Note: This checklist reflects current implementation within the Admin Panel UI and supporting backend. Items marked "Planned" or "Partial" are on the roadmap.
            </div>
          </CardContent>
        </Card>

        <Drawer open={agentViewerOpen} onOpenChange={setAgentViewerOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Agent Session</DrawerTitle>
              <DrawerDescription className="text-sm">
                Agent: {viewAgentId || "—"}
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-6 pb-6 space-y-4">
              <div>
                <div className="text-sm font-medium mb-1">Top Intents</div>
                <div className="flex flex-wrap gap-2">
                  {agentTopIntents.length > 0 ? (
                    agentTopIntents.map(([intent, count]) => (
                      <Badge key={intent as string} variant="outline">
                        {String(intent)}: {String(count)}
                      </Badge>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">No intents observed.</div>
                  )}
                </div>
              </div>
              <Separator />
              <div>
                <div className="text-sm font-medium mb-1">Recent Activity</div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {viewAgentAudits.map((ev: any, idx: number) => (
                    <div key={ev._id || idx} className="p-2 rounded border">
                      <div className="text-xs text-muted-foreground">
                        {ev.createdAt ? new Date(ev.createdAt).toLocaleString() : "—"}
                      </div>
                      <div className="text-sm font-medium">{ev.action || "event"}</div>
                      <div className="text-xs break-words text-muted-foreground">
                        {(() => {
                          try {
                            const preview = JSON.stringify(ev.details ?? {}, null, 0);
                            return preview.length > 240 ? preview.slice(0, 240) + "…" : preview;
                          } catch {
                            return "—";
                          }
                        })()}
                      </div>
                    </div>
                  ))}
                  {viewAgentAudits.length === 0 && (
                    <div className="text-sm text-muted-foreground">No recent activity for this agent.</div>
                  )}
                </div>
              </div>
              <Separator />
              <div>
                <div className="text-sm font-medium mb-1">Last Errors</div>
                <div className="space-y-1">
                  {agentLastErrors.length > 0 ? (
                    agentLastErrors.map((e, i) => (
                      <div key={i} className="text-xs">
                        <span className="text-muted-foreground mr-2">
                          {new Date(e.when).toLocaleString()}:
                        </span>
                        <span>{e.message || "Error"}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">None</div>
                  )}
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
}