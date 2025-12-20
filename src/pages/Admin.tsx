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
import { EnvironmentSettings } from "@/components/admin/EnvironmentSettings";
import { SocialApiSettings } from "@/components/admin/SocialApiSettings";
import DemoVideoManager from "@/components/admin/DemoVideoManager";
import { DocsContentManager } from "@/components/admin/DocsContentManager";
import { UserManagement } from "@/components/admin/UserManagement";
import { AlertsIncidentsPanel } from "@/components/admin/AlertsIncidentsPanel";
import { TenantsPanel } from "@/components/admin/TenantsPanel";
import { PendingSeniorRequestsPanel } from "@/components/admin/PendingSeniorRequestsPanel";
import { AdministratorsPanel } from "@/components/admin/AdministratorsPanel";
import { KpiSnapshot } from "@/components/admin/KpiSnapshot";
import { FeatureFlagsPanel } from "@/components/admin/FeatureFlagsPanel";
import { ApiKeysPanel } from "@/components/admin/ApiKeysPanel";
import { BillingUsagePanel } from "@/components/admin/BillingUsagePanel";
import { CustomAgentsPanel } from "@/components/admin/CustomAgentsPanel";
import { IntegrationsHubPanel } from "@/components/admin/IntegrationsHubPanel";
import { AssistantDocsPanel } from "@/components/admin/AssistantDocsPanel";
import { AuditExplorerPanel } from "@/components/admin/AuditExplorerPanel";
import { SystemAgentsHub } from "@/components/admin/SystemAgentsHub";
import { AdminRoadmapCompliance } from "@/components/admin/AdminRoadmapCompliance";
import { AgentSessionDrawer } from "@/components/admin/AgentSessionDrawer";

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
    api.admin.validateAdminSession as any,
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
  const saveSystemConfigMutation = useMutation(api.admin.saveSystemConfig as any);

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

        <EnvironmentSettings env={env} />
        <KpiSnapshot kpis={kpis} />
        <FeatureFlagsPanel
          flags={flags}
          flagAnalytics={flagAnalytics}
          toggleFlag={toggleFlag}
          updateFlag={updateFlag}
        />
        <PendingSeniorRequestsPanel pending={pending} approveSenior={approveSenior} />
        <AdministratorsPanel adminList={adminList} />
        <TenantsPanel
          selectedTenantId={selectedTenantId}
          onSelectTenant={setSelectedTenantId}
        />
        <ApiKeysPanel
          selectedTenantId={selectedTenantId}
          tenants={tenants}
          onSelectTenant={setSelectedTenantId}
        />
        <BillingUsagePanel
          selectedTenantId={selectedTenantId}
          tenants={tenants}
        />
        <IntegrationsHubPanel
          env={env}
          saveSystemConfigMutation={saveSystemConfigMutation}
          adminToken={adminToken}
        />
        <CustomAgentsPanel
          selectedTenantId={selectedTenantId}
          recentAudits={recentAudits}
        />
        <AssistantDocsPanel
          hasAdminAccess={hasAdminAccess}
          generateDocsProposal={generateDocsProposal}
          approveDocsProposal={approveDocsProposal}
        />
        <DemoVideoManager />
        <DocsContentManager />
        <AuditExplorerPanel recentAudits={recentAudits} />
        <AlertsIncidentsPanel selectedTenantId={selectedTenantId} />
        <AdminAssistantSection
          adminSessionValid={isAdminSession}
          adminToken={adminToken}
        />
        <UserManagement />

        <div id="section-system-agents">
          <SystemAgentsHub />
        </div>

        <AdminRoadmapCompliance />

        <AgentSessionDrawer
          open={agentViewerOpen}
          onOpenChange={setAgentViewerOpen}
          agentId={viewAgentId}
          recentAudits={recentAudits}
        />
      </div>
    </>
  );
}