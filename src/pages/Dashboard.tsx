import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sidebar } from "@/components/layout/Sidebar";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isGuestMode, getSelectedTier, getDemoData } from "@/lib/guestUtils";
import { getTierConfig, TierType } from "@/lib/tierConfig";
import React, { Suspense, lazy } from "react";
import { NotificationsCenter } from "@/components/NotificationsCenter";
import { toast } from "sonner";

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

  // Local lazy dashboard re-definitions removed; using module-scoped lazy components.

  // Guest mode detection
  const guestMode = isGuestMode();
  const selectedTier = getSelectedTier();
  const tierConfig = getTierConfig(selectedTier);
  
  // Data fetching - skip in guest mode
  const business = useQuery(
    api.businesses.currentUserBusiness,
    // Use "skip" to avoid type mismatch when skipping
    guestMode || !isAuthenticated ? "skip" : {}
  );
  
  // Determine which tier to use
  const normalizeTier = (t: unknown): TierType =>
    t === "solopreneur" || t === "startup" || t === "sme" || t === "enterprise" ? (t as TierType) : "solopreneur";

  const effectiveTier: TierType = normalizeTier(guestMode ? selectedTier : business?.tier);
  const effectiveConfig = getTierConfig(effectiveTier);
  
  // Demo data for guest mode
  const demoDataForTier = guestMode ? getDemoData(selectedTier) : null;

  // Add: usage-based upgrade nudges (skip in guest mode)
  const nudges = useQuery(
    api.telemetry.getUpgradeNudges,
    guestMode || !business?._id ? "skip" : { businessId: business._id }
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
  if (isAuthenticated && !business && !guestMode) {
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
        <div className="mb-4 flex items-center justify-end">
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
        {!guestMode && nudges && nudges.showBanner && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-amber-800">Heads up</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {nudges.nudges.map((n: any) => (
                <div key={n.code} className="flex items-start gap-2">
                  <Badge variant="outline" className={n.level === "warn" ? "border-amber-400 text-amber-700" : "border-emerald-400 text-emerald-700"}>
                    {n.level === "warn" ? "Usage" : "Tip"}
                  </Badge>
                  <span className="text-sm text-slate-700">{n.message}</span>
                </div>
              ))}
              <div className="text-xs text-slate-500">
                Snapshot — Workflows: {nudges.snapshot.workflowsCount} • Runs: {nudges.snapshot.runsCount} • Agents: {nudges.snapshot.agentsCount}
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