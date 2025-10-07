import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sidebar } from "@/components/layout/Sidebar";
import { useNavigate, useLocation } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isGuestMode, getSelectedTier, getDemoData } from "@/lib/guestUtils";
import { getTierConfig, TierType } from "@/lib/tierConfig";
import React, { Suspense, lazy, useState } from "react";
import { NotificationsCenter } from "@/components/NotificationsCenter";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// Add: lazy-loaded tier dashboards (code-splitting)
const SolopreneurDashboard = lazy(() =>
  import("@/components/dashboards/SolopreneurDashboard").then((m) => ({
    default: m.SolopreneurDashboard,
  })),
);
const StartupDashboard = lazy(() =>
  import("@/components/dashboards/StartupDashboard").then((m) => ({
    default: m.StartupDashboard,
  })),
);
const SmeDashboard = lazy(() =>
  import("@/components/dashboards/SmeDashboard").then((m) => ({
    default: m.SmeDashboard,
  })),
);
const EnterpriseDashboard = lazy(() =>
  import("@/components/dashboards/EnterpriseDashboard").then((m) => ({
    default: m.EnterpriseDashboard,
  })),
);

export default function Dashboard() {
  const { isLoading, isAuthenticated, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);

  // Local lazy dashboard re-definitions removed; using module-scoped lazy components.

  // Guest mode detection (prefer router location, fallback to utils/localStorage)
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search || "");
  const guestParam = searchParams.get("guest");
  const tierParam = searchParams.get("tier");
  const guestMode = guestParam === "1" || isGuestMode();
  const selectedTier = (tierParam as any) || getSelectedTier();
  const tierConfig = getTierConfig(selectedTier);
  
  // Data fetching - skip in guest mode
  const business = useQuery(
    api.businesses.currentUserBusiness,
    // Use "skip" to avoid type mismatch when skipping
    guestMode || !isAuthenticated ? undefined : {}
  );
  
  // Determine which tier to use
  const normalizeTier = (t: unknown): TierType =>
    t === "solopreneur" || t === "startup" || t === "sme" || t === "enterprise" ? (t as TierType) : "solopreneur";

  const effectiveTier: TierType = normalizeTier(guestMode ? selectedTier : business?.tier);
  const effectiveConfig = getTierConfig(effectiveTier);
  
  // Demo data for guest mode
  const demoDataForTier = guestMode ? getDemoData(selectedTier) : null;

  // Add: usage-based upgrade nudges (skip in guest mode)
  const isGuestFromUrl = guestParam === "1";
  const businessId = !isGuestFromUrl ? business?._id : null;
  const upgradeNudges = useQuery(
    api.telemetry.getUpgradeNudges,
    guestMode || !business?._id ? undefined : { businessId: business._id }
  );

  // Add seeding handler and mutation
  const seedDemoData = useMutation(api.seed.seedDemoData);
  const handleSeedDemoData = async () => {
    try {
      const res = await seedDemoData({});
      toast.success(`Demo data ready: ${res.tasksCreated} tasks, ${res.contactsCreated} contacts, ${res.kpisCreated} KPI snapshot`);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to seed demo data");
    }
  };

  // Add: SLA summary for display
  const slaSummary = useQuery(
    api.health.envStatus,
    guestMode || !business?._id ? undefined : {}
  );

  // Helper to emit lightweight telemetry without backend coupling
  const logTelemetry = (event: string, data?: Record<string, any>) => {
    try {
      window.dispatchEvent(new CustomEvent("telemetry", { detail: { event, ...data } }));
    } catch {}
  };

  // ADD: Trial info computation (non-guest, authenticated)
  const nowMs = Date.now();
  const bizSettings = (business as any)?.settings ?? {};
  const trialStart: number | undefined = typeof bizSettings.trialStart === "number" ? bizSettings.trialStart : undefined;
  const trialEnd: number | undefined = typeof bizSettings.trialEnd === "number" ? bizSettings.trialEnd : undefined;
  const isTrialStatus = bizSettings.status === "trial";
  const trialActive =
    !guestMode &&
    isTrialStatus &&
    typeof trialEnd === "number" &&
    nowMs < trialEnd;

  const trialDaysLeft =
    typeof trialEnd === "number"
      ? Math.max(0, Math.ceil((trialEnd - nowMs) / (24 * 60 * 60 * 1000)))
      : undefined;

  const trialExpired =
    !guestMode &&
    isTrialStatus &&
    typeof trialEnd === "number" &&
    nowMs >= trialEnd;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated and not in guest mode
  if (!isAuthenticated && !guestMode) {
    navigate("/auth");
    return null;
  }

  // Redirect to onboarding if authenticated but no business setup
  if (isAuthenticated && business === null && !guestMode) {
    navigate("/onboarding");
    return null;
  }

  const handleNavigation = (to: string) => {
    navigate(to);
  };

  const handleLogout = () => {
    if (guestMode) {
      navigate("/");
      return;
    }
    signOut();
  };

  const handleSignIn = () => {
    navigate("/auth");
  };

  const userDisplay = guestMode 
    ? `Guest (${effectiveConfig.label})` 
    : (user?.email || "User");
    
  const planLabel = guestMode 
    ? "Demo Mode" 
    : (business?.tier ? effectiveConfig.label : "Free");

  const renderDashboardContent = () => {
    const props = {
      business: guestMode ? null : business,
      demoData: demoDataForTier,
      isGuest: guestMode,
      tier: effectiveTier,
      onUpgrade: () => {},
    };

    switch (effectiveTier) {
      case "solopreneur":
        return <SolopreneurDashboard {...props} />;
      case "startup":
        return <StartupDashboard {...props} />;
      case "sme":
        return <SmeDashboard {...props} />;
      case "enterprise":
        return <EnterpriseDashboard {...props} />;
      default:
        return <SolopreneurDashboard {...props} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Help Dialog */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Need a hand?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-slate-700">
            <p>Get started quickly with templates, or reach out for help.</p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  logTelemetry("help_template_click");
                  navigate("/workflows");
                }}
              >
                Browse Templates
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  logTelemetry("help_contact_click");
                  navigate("/pricing");
                }}
              >
                Contact Sales
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Sidebar
        items={effectiveConfig.sidebarItems}
        userDisplay={userDisplay}
        planLabel={planLabel}
        onNavigate={handleNavigation}
        onLogout={handleLogout}
        featureHighlights={effectiveConfig.featureHighlights}
      />

      <main className="md:ml-72 p-6">
        {/* Top actions */}
        <div className="mb-4 flex items-center justify-end gap-2">
          {/* Add Help for guest mode */}
          {guestMode && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setHelpOpen(true);
                logTelemetry("help_open", { tier: effectiveTier });
              }}
            >
              Get Help
            </Button>
          )}
          <NotificationsCenter disabled={guestMode} />
        </div>

        {/* Guest mode header */}
        {guestMode && (
          <div className="mb-6 flex items-center justify-between bg-white rounded-lg p-4 border border-emerald-200">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                Viewing: {effectiveConfig.label} (Guest Mode)
              </Badge>
              <span className="text-sm text-muted-foreground">
                Explore the {effectiveConfig.label} dashboard with demo data
              </span>
            </div>
            <Button onClick={handleSignIn} size="sm">
              Sign In to Get Started
            </Button>
          </div>
        )}

        {/* ADD: Trial banner (auth only, non-guest) */}
        {!guestMode && isTrialStatus && trialActive && (
          <Card className="mb-6 border-emerald-200 bg-emerald-50">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-emerald-300 text-emerald-800">Free Trial</Badge>
                <span className="text-sm text-emerald-900">
                  {typeof trialDaysLeft === "number" ? `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left` : "Active trial"} on {effectiveConfig.label}.
                </span>
              </div>
              <Button size="sm" onClick={() => navigate("/pricing")}>
                Manage Plan
              </Button>
            </CardContent>
          </Card>
        )}

        {!guestMode && isTrialStatus && trialExpired && (
          <Card className="mb-6 border-amber-300 bg-amber-50">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-amber-400 text-amber-800">Trial Ended</Badge>
                <span className="text-sm text-amber-900">
                  Your free trial has ended. Activate a plan to keep access to advanced features.
                </span>
              </div>
              <Button size="sm" onClick={() => navigate("/pricing")}>
                Activate Plan
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Solopreneur Initiative Journey rail */}
        {effectiveTier === "solopreneur" && (
          <Card className="mb-6 border-emerald-200 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-emerald-800">Initiative Journey</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                  {["Discovery", "Planning", "Foundation", "Execution", "Scale", "Sustainability"].map((p) => (
                    <div
                      key={p}
                      className="rounded border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs md:text-sm px-2 py-2 text-center"
                    >
                      {p}
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      logTelemetry("initiative_quick_action", { action: "create_content" });
                      navigate("/workflows");
                    }}
                  >
                    Create Content
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      logTelemetry("initiative_quick_action", { action: "schedule_posts" });
                      navigate("/workflows");
                    }}
                  >
                    Schedule Posts
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      logTelemetry("initiative_quick_action", { action: "send_newsletter" });
                      navigate("/analytics");
                    }}
                  >
                    Send Newsletter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add: Solopreneur quick-start card */}
        {effectiveTier === "solopreneur" && (
          <Card className="mb-6 border-emerald-200 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-emerald-800">Get set up in 2 minutes</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="text-sm text-slate-700">
                Quick wins: copy a Brand Booster template or head to Workflows to start automating.
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => navigate("/workflows")}>
                  Browse Templates
                </Button>
                <Button size="sm" onClick={() => navigate("/workflows")}>
                  Go to Workflows
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add: Upgrade CTA for non-enterprise authenticated users */}
        {!guestMode && effectiveTier !== "enterprise" && (
          <Card className="mb-6 border-emerald-200 bg-emerald-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-emerald-800">Unlock more with a higher plan</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="text-sm text-emerald-900">
                You're on {effectiveConfig.label}. Upgrade to access advanced automations, higher limits, and priority support.
              </div>
              <div>
                <Button size="sm" onClick={() => navigate("/pricing")}>
                  View plans
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add: Progressive disclosure upgrade nudges (auth only) */}
        {!guestMode && upgradeNudges && upgradeNudges.showBanner && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-amber-800">Heads up</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {upgradeNudges.nudges.map((n: any) => (
                <div key={n.id} className="flex items-start gap-2">
                  <Badge
                    variant="outline"
                    className={
                      n.severity === "warn"
                        ? "border-amber-400 text-amber-700"
                        : "border-emerald-400 text-emerald-700"
                    }
                  >
                    {n.severity === "warn" ? "Usage" : "Tip"}
                  </Badge>
                  <span className="text-sm text-slate-700">
                    <span className="font-medium">{n.title}:</span> {n.reason}
                  </span>
                </div>
              ))}
              <div className="text-xs text-slate-500">
                Snapshot — Workflows: {upgradeNudges.snapshot.workflowsCount} • Runs: {upgradeNudges.snapshot.runsCount} • Agents: {upgradeNudges.snapshot.agentsCount}
              </div>
              <div>
                {/* Route to dedicated pricing page */}
                <Button size="sm" onClick={() => navigate("/pricing")}>
                  View plans
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add: SLA overdue badge */}
        {!guestMode && slaSummary && slaSummary.overdueApprovalsCount > 0 && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-red-300 text-red-700">
                  SLA Alert
                </Badge>
                <span className="text-sm text-red-900">
                  {slaSummary.overdueApprovalsCount} overdue approvals require attention
                </span>
              </div>
              <Button size="sm" onClick={() => navigate("/workflows")}>
                Review Approvals
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Analytics CTA card */}
        <Card className="mb-6 border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="text-sm text-slate-700">Dive deeper into your performance metrics.</div>
            <Button
              size="sm"
              onClick={() => {
                logTelemetry("analytics_cta_click", { tier: effectiveTier });
                navigate("/analytics");
              }}
            >
              View Analytics
            </Button>
          </CardContent>
        </Card>

        {/* Audit & Analytics CTA - add View all link */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Recent audit events
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              try {
                // Prefer client-side navigation
                (window as any).appNavigate
                  ? (window as any).appNavigate("/analytics")
                  : (window.location.href = "/analytics");
              } catch {
                window.location.href = "/analytics";
              }
            }}
          >
            View all
          </Button>
        </div>

        {/* Render a fixed action button for authenticated, non-guest users */}
        {isAuthenticated && !guestMode && (
          <div className="fixed bottom-6 right-6 z-40">
            <Button
              onClick={handleSeedDemoData}
              className="shadow-lg"
              variant="default"
              size="lg"
            >
              Seed Demo Data
            </Button>
          </div>
        )}

        {/* Dashboard content (code-split) */}
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
            </div>
          }
        >
          {renderDashboardContent()}
        </Suspense>
      </main>
    </div>
  );
}