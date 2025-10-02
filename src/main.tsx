import { Toaster } from "sonner";
import { InstrumentationProvider } from "@/instrumentation.tsx";
import AuthPage from "@/pages/Auth.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React, { StrictMode, useEffect, Component } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation, Navigate, useNavigate } from "react-router";
import "./index.css";
import Landing from "./pages/Landing.tsx";
import NotFound from "./pages/NotFound.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import "./types/global.d.ts";
import InitiativesPage from "@/pages/Initiatives.tsx";
import AgentsPage from "@/pages/Agents.tsx";
import WorkflowsPage from "@/pages/Workflows.tsx";
import WorkflowTemplatesPage from "@/pages/WorkflowTemplates.tsx";
import BusinessPage from "@/pages/Business.tsx";
import AnalyticsPage from "@/pages/Analytics.tsx";
import ApprovalAnalyticsPage from "@/pages/ApprovalAnalytics";
import PricingPage from "./pages/Pricing.tsx";
import SettingsPage from "@/pages/Settings.tsx";
import AdminPage from "@/pages/Admin.tsx";
import AdminAuthPage from "./pages/AdminAuth.tsx";
import LearningHubPage from "@/pages/LearningHub.tsx";
import SystemAgentsPage from "@/pages/SystemAgents";
import BrandingPortal from "./pages/BrandingPortal.tsx";
import ApiDocsPage from "./pages/ApiDocs";
import WebhookManagementPage from "./pages/WebhookManagement";
import ScimProvisioningPage from "./pages/ScimProvisioning";
import SsoConfigurationPage from "./pages/SsoConfiguration";
import KmsConfigurationPage from "./pages/KmsConfiguration";

class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: any }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any) {
    console.error("App crashed:", error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-lg text-center">
            <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">
              Please refresh the page. If the issue persists, contact support.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppProviders({ children }: { children: React.ReactNode }) {
  const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;
  if (!convexUrl || convexUrl === "undefined") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-lg text-center">
          <h1 className="text-2xl font-semibold mb-2">Configuration required</h1>
          <p className="text-sm text-muted-foreground">
            Missing VITE_CONVEX_URL. Set it in your environment and refresh.
          </p>
        </div>
      </div>
    );
  }
  const convex = new ConvexReactClient(convexUrl);
  return <ConvexAuthProvider client={convex}>{children}</ConvexAuthProvider>;
}

function RouteSyncer() {
  const navigate = useNavigate(); // Add in-app navigation support
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // Support programmatic route navigation within MemoryRouter
      if (event.data?.type === "navigateTo" && typeof event.data.path === "string") {
        navigate(event.data.path);
        return;
      }
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [navigate]);

  return null;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <AppProviders>
        <InstrumentationProvider>
          <MemoryRouter
            initialEntries={[
              `${window.location.pathname}${window.location.search}${window.location.hash}`,
            ]}
          >
            <RouteSyncer />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<AuthPage redirectAfterAuth="/dashboard" />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/initiatives" element={<InitiativesPage />} />
              <Route path="/agents" element={<AgentsPage />} />
              <Route path="/ai-agents" element={<AgentsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/approval-analytics" element={<ApprovalAnalyticsPage />} />
              <Route path="/workflows" element={<WorkflowsPage />} />
              <Route path="/workflows/templates" element={<WorkflowTemplatesPage />} />
              <Route path="/business" element={<BusinessPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin-auth" element={<AdminAuthPage />} />
              <Route path="/learning-hub" element={<LearningHubPage />} />
              <Route path="/admin/system-agents" element={<SystemAgentsPage />} />
              <Route path="/branding" element={<BrandingPortal />} />
              <Route path="/api-docs" element={<ApiDocsPage />} />
              <Route path="/webhooks" element={<WebhookManagementPage />} />
              <Route path="/scim" element={<ScimProvisioningPage />} />
              <Route path="/scim-provisioning" element={<ScimProvisioningPage />} />
              <Route path="/sso-configuration" element={<SsoConfigurationPage />} />
              <Route path="/kms-configuration" element={<KmsConfigurationPage />} />
              <Route
                path="/src/components/dashboards/SolopreneurDashboard.tsx"
                element={<Navigate to="/dashboard" replace />}
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MemoryRouter>
          <Toaster />
        </InstrumentationProvider>
      </AppProviders>
    </ErrorBoundary>
  </StrictMode>,
);