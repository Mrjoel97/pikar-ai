import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sidebar } from "@/components/layout/Sidebar";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isGuestMode, getSelectedTier, getDemoData } from "@/lib/guestUtils";
import { getTierConfig, canShowFeature, TierType } from "@/lib/tierConfig";
import { SolopreneurDashboard } from "@/components/dashboards/SolopreneurDashboard";
import { StartupDashboard } from "@/components/dashboards/StartupDashboard";
import { SmeDashboard } from "@/components/dashboards/SmeDashboard";
import { EnterpriseDashboard } from "@/components/dashboards/EnterpriseDashboard";
import { toast } from "sonner";

export default function Dashboard() {
  const { isLoading, isAuthenticated, user, signOut } = useAuth();
  const navigate = useNavigate();
  
  // Guest mode detection
  const guestMode = isGuestMode();
  const selectedTier = getSelectedTier();
  const tierConfig = getTierConfig(selectedTier);
  
  // Data fetching - skip in guest mode
  const business = useQuery(
    api.businesses.currentUserBusiness,
    guestMode ? "skip" : {}
  );
  
  // Determine which tier to use
  const normalizeTier = (t: unknown): TierType =>
    t === "solopreneur" || t === "startup" || t === "sme" || t === "enterprise" ? (t as TierType) : "solopreneur";

  const effectiveTier: TierType = normalizeTier(guestMode ? selectedTier : business?.tier);
  const effectiveConfig = getTierConfig(effectiveTier);
  
  // Demo data for guest mode
  const demoDataForTier = guestMode ? getDemoData(selectedTier) : null;

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
    if (guestMode) {
      toast("Sign in to access this feature");
      return;
    }
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
      onUpgrade: () => toast("Sign in to upgrade your plan")
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

        {/* Dashboard content */}
        {renderDashboardContent()}
      </main>
    </div>
  );
}