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

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
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
          <CardTitle>System Health</CardTitle>
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
          <CardTitle>Feature Flags</CardTitle>
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
            <CardTitle>Pending Senior Admin Requests</CardTitle>
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
          <CardTitle>Administrators</CardTitle>
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

      {/* Audit Explorer (MVP) */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Explorer</CardTitle>
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
    </div>
  );
}