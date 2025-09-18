import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
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

  // Audit Explorer filters
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [sinceDays, setSinceDays] = useState<number>(7);

  const filteredAudits = useMemo(() => {
    if (!recentAudits) return [];
    const since = Date.now() - Math.max(0, sinceDays) * 24 * 60 * 60 * 1000;
    return recentAudits.filter((a) => {
      const actionOk = actionFilter ? a.action.toLowerCase().includes(actionFilter.toLowerCase()) : true;
      const entityOk = entityFilter ? a.entityType.toLowerCase().includes(entityFilter.toLowerCase()) : true;
      const timeOk = a.createdAt >= since;
      return actionOk && entityOk && timeOk;
    });
  }, [recentAudits, actionFilter, entityFilter, sinceDays]);

  const exportAuditsCsv = () => {
    const rows = [
      ["createdAt", "businessId", "userId", "action", "entityType", "entityId", "details"],
      ...filteredAudits.map((a) => [
        new Date(a.createdAt).toISOString(),
        a.businessId,
        a.userId || "",
        a.action,
        a.entityType,
        a.entityId,
        JSON.stringify(a.details || {}),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_export_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const kpis = useMemo(() => {
    return {
      admins: (adminList || []).length,
      pending: (pending || []).length,
      flagsTotal: flagAnalytics?.totalFlags ?? (flags?.length ?? 0),
      flagsEnabled: flagAnalytics?.enabledFlags ?? (flags?.filter((f) => f.isEnabled).length ?? 0),
      emailQueueDepth: env?.emailQueueDepth ?? 0,
      overdueApprovals: env?.overdueApprovalsCount ?? 0,
    };
  }, [adminList, pending, flags, flagAnalytics, env]);

  const [selectedTenantId, setSelectedTenantId] = useState<string | "">("");
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyScopes, setNewKeyScopes] = useState("admin:read,admin:write");
  const [freshSecret, setFreshSecret] = useState<string | null>(null);
  const [healthOpen, setHealthOpen] = useState(false);

  // Tenants & API Keys state
  const tenants = useQuery(
    api.admin.listTenants as any,
    hasAdminAccess ? {} : undefined
  ) as Array<{ _id: string; name: string; plan?: string; ownerId?: string; status?: string }> | undefined;

  // Tenant users (derived) - only load when one is selected
  const tenantUsers = useQuery(
    api.admin.listTenantUsers as any,
    hasAdminAccess && selectedTenantId ? { businessId: selectedTenantId } : undefined
  ) as Array<{ _id: string; name: string; email?: string; role?: string }> | undefined;

  // API Keys
  const apiKeys = useQuery(
    api.admin.listApiKeys as any,
    hasAdminAccess && selectedTenantId ? { tenantId: selectedTenantId } : undefined
  ) as Array<{ _id: string; name: string; scopes: string[]; createdAt: number; revokedAt?: number }> | undefined;

  const createApiKey = useMutation(api.admin.createApiKey as any);
  const revokeApiKey = useMutation(api.admin.revokeApiKey as any);

  const handleLogout = () => {
    localStorage.removeItem("adminSessionToken");
    setAdminToken(null);
    toast.success("Logged out successfully");
    navigate("/admin-auth");
  };

  if (isAdmin === undefined && !adminToken) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">Loading...</CardContent>
        </Card>
      </div>
    );
  }

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

  return (
    <>
      {/* Admin-only emerald sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-gradient-to-b from-emerald-900 to-emerald-800 text-emerald-50 z-30">
        <div className="flex flex-col h-full w-full p-4 gap-3">
          <div className="text-xs uppercase tracking-wider text-emerald-200/80 mb-2">Admin Menu</div>
          <button
            onClick={() => scrollToSection("section-system-health")}
            className="text-left px-3 py-2 rounded-md hover:bg-white/10 transition"
          >
            System Health
          </button>
          <button
            onClick={() => scrollToSection("section-roadmap-compliance")}
            className="text-left px-3 py-2 rounded-md hover:bg-white/10 transition"
          >
            Roadmap Compliance
          </button>
          <button
            onClick={() => scrollToSection("section-kpis")}
            className="text-left px-3 py-2 rounded-md hover:bg-white/10 transition"
          >
            KPI Snapshot
          </button>
          <button
            onClick={() => scrollToSection("section-feature-flags")}
            className="text-left px-3 py-2 rounded-md hover:bg-white/10 transition"
          >
            Feature Flags
          </button>
          <button
            onClick={() => scrollToSection("section-pending-senior")}
            className="text-left px-3 py-2 rounded-md hover:bg-white/10 transition"
          >
            Pending Senior Requests
          </button>
          <button
            onClick={() => scrollToSection("section-admins")}
            className="text-left px-3 py-2 rounded-md hover:bg-white/10 transition"
          >
            Administrators
          </button>
          <button
            onClick={() => scrollToSection("section-tenants")}
            className="text-left px-3 py-2 rounded-md hover:bg-white/10 transition"
          >
            Tenants
          </button>
          <button
            onClick={() => scrollToSection("section-api-keys")}
            className="text-left px-3 py-2 rounded-md hover:bg-white/10 transition"
          >
            API Keys
          </button>
          <button
            onClick={() => scrollToSection("section-audit-explorer")}
            className="text-left px-3 py-2 rounded-md hover:bg-white/10 transition"
          >
            Audit Explorer
          </button>

          <div className="flex-1" />
          {isAdminSession && (
            <button
              onClick={handleLogout}
              className="mt-auto w-full text-left px-3 py-2 rounded-md bg-white/10 hover:bg-white/15 transition"
            >
              Logout
            </button>
          )}
        </div>
      </aside>

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
      </div>
    </>
  );
}