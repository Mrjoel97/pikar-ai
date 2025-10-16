import { Toaster } from "sonner";
import { FullInstrumentationProvider } from "@/instrumentation.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React, { StrictMode, useEffect, Component } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation, Navigate, useNavigate } from "react-router";
import "./index.css";
const Landing = React.lazy(() => import("./pages/Landing.tsx"));
import NotFound from "./pages/NotFound.tsx";
import "./types/global.d.ts";

// Lazy-loaded pages for code splitting
const AuthPage = React.lazy(() => import("@/pages/Auth.tsx"));
const Dashboard = React.lazy(() => import("./pages/Dashboard.tsx"));
const Onboarding = React.lazy(() => import("./pages/Onboarding.tsx"));
const InitiativesPage = React.lazy(() => import("@/pages/Initiatives.tsx"));
const AgentsPage = React.lazy(() => import("@/pages/Agents.tsx"));
const WorkflowsPage = React.lazy(() => import("@/pages/Workflows.tsx"));
const WorkflowTemplatesPage = React.lazy(() => import("@/pages/WorkflowTemplates.tsx"));
const BusinessPage = React.lazy(() => import("@/pages/Business.tsx"));
const AnalyticsPage = React.lazy(() => import("@/pages/Analytics.tsx"));
const ApprovalAnalyticsPage = React.lazy(() => import("@/pages/ApprovalAnalytics"));
const PricingPage = React.lazy(() => import("./pages/Pricing.tsx"));
const SettingsPage = React.lazy(() => import("@/pages/Settings.tsx"));
const AdminPage = React.lazy(() => import("@/pages/Admin.tsx"));
const AdminAuthPage = React.lazy(() => import("./pages/AdminAuth.tsx"));
const LearningHubPage = React.lazy(() => import("@/pages/LearningHub.tsx"));
const SystemAgentsPage = React.lazy(() => import("@/pages/SystemAgents"));
const BrandingPortal = React.lazy(() => import("./pages/BrandingPortal.tsx"));
const ApiDocsPage = React.lazy(() => import("./pages/ApiDocs"));
const WebhookManagementPage = React.lazy(() => import("./pages/WebhookManagement"));
const ScimProvisioningPage = React.lazy(() => import("./pages/ScimProvisioning"));
const SsoConfigurationPage = React.lazy(() => import("./pages/SsoConfiguration"));
const KmsConfigurationPage = React.lazy(() => import("./pages/KmsConfiguration"));
const ApiBuilderPage = React.lazy(() => import("./pages/ApiBuilder"));
const SupportPage = React.lazy(() => import("./pages/Support"));
const TestRunnerPage = React.lazy(() => import("./pages/TestRunner"));

const DataWarehouseManager = React.lazy(() =>
  import("./components/enterprise/DataWarehouseManager").then((m) => ({
    default: m.DataWarehouseManager,
  }))
);
const SecurityDashboard = React.lazy(() =>
  import("./components/enterprise/SecurityDashboard").then((m) => ({
    default: m.SecurityDashboard,
  }))
);
const PortfolioDashboard = React.lazy(() =>
  import("./components/enterprise/PortfolioDashboard").then((m) => ({
    default: m.PortfolioDashboard,
  }))
);

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
        <FullInstrumentationProvider>
          <MemoryRouter
            initialEntries={[
              `${window.location.pathname}${window.location.search}${window.location.hash}`,
            ]}
          >
            <RouteSyncer />
            <Routes>
              <Route
                path="/"
                element={
                  <React.Suspense fallback={<div className="p-6 text-sm">Loading…</div>}>
                    <Landing />
                  </React.Suspense>
                }
              />
              <Route
                path="/auth"
                element={
                  <React.Suspense fallback={<div className="p-6 text-sm">Loading…</div>}>
                    <AuthPage redirectAfterAuth="/dashboard" />
                  </React.Suspense>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <React.Suspense fallback={<div className="p-6 text-sm">Loading…</div>}>
                    <Dashboard />
                  </React.Suspense>
                }
              />
              <Route
                path="/onboarding"
                element={
                  <React.Suspense fallback={<div className="p-6 text-sm">Loading…</div>}>
                    <Onboarding />
                  </React.Suspense>
                }
              />
              <Route
                path="/initiatives"
                element={
                  <React.Suspense fallback={<div className="p-6 text-sm">Loading…</div>}>
                    <InitiativesPage />
                  </React.Suspense>
                }
              />
              <Route
                path="/agents"
                element={
                  <React.Suspense fallback={<div className="p-6 text-sm">Loading…</div>}>
                    <AgentsPage />
                  </React.Suspense>
                }
              />
              <Route
                path="/ai-agents"
                element={
                  <React.Suspense fallback={<div className="p-6 text-sm">Loading…</div>}>
                    <AgentsPage />
                  </React.Suspense>
                }
              />
              <Route
                path="/analytics"
                element={
                  <React.Suspense fallback={<div className="p-6 text-sm">Loading…</div>}>
                    <AnalyticsPage />
                  </React.Suspense>
                }
              />
              <Route
                path="/approval-analytics"
                element={
                  <React.Suspense fallback={<div className="p-6 text-sm">Loading…</div>}>
                    <ApprovalAnalyticsPage />
                  </React.Suspense>
                }
              />
              <Route
                path="/workflows"
                element={
                  <React.Suspense fallback={<div className="p-6 text-sm">Loading…</div>}>
                    <WorkflowsPage />
                  </React.Suspense>
                }
              />
              <Route
                path="/workflows/templates"
                element={
                  <React.Suspense fallback={<div className="p-6 text-sm">Loading…</div>}>
                    <WorkflowTemplatesPage />
                  </React.Suspense>
                }
              />
              <Route
                path="/business"
                element={
                  <React.Suspense fallback={<div className="p-6 text-sm">Loading…</div>}>
                    <BusinessPage />
                  </React.Suspense>
                }
              />
              <Route
                path="/settings"
                element={
                  <React.Suspense fallback={<div className="p-6 text-sm">Loading…</div>}>
                    <SettingsPage />
                  </React.Suspense>
                }
              />
              <Route
                path="/admin"
                element={
                  <React.Suspense fallback={<div className="p-6 text-sm">Loading…</div>}>
                    <AdminPage />
                  </React.Suspense>
                }
              />
              <Route
                path="/admin-auth"
                element={
                  <React.Suspense fallback={<div className="p-6 text-sm">Loading…</div>}>
                    <AdminAuthPage />
                  </React.Suspense>
                }
              />
              <Route
                path="/learning-hub"
                element={
                  <React.Suspense fallback={<div className="p-6 text-sm">Loading…</div>}>
                    <LearningHubPage />
                  </React.Suspense>
                }
              />
              <Route
                path="/admin/system-agents"
                element={
                  <React.Suspense fallback={<div className="p-6 text-sm">Loading…</div>}>
                    <SystemAgentsPage />
                  </React.Suspense>
                }
              />
              <Route
                path="/branding"
                element={
                  <React.Suspense fallback={<div className="p-6 text-sm">Loading…</div>}>
                    <BrandingPortal />
                  </React.Suspense>
                }
              />
              <Route
                path="/api-docs"
                element={
                  <React.Suspense fallback={<div className="p-6 text-sm">Loading…</div>}>
                    <ApiDocsPage />
                  </React.Suspense>
                }
              />
              <Route
                path="/webhooks"
                element={
                  <React.Suspense fallback={<div className="p-6 text-sm">Loading…</div>}>
                    <WebhookManagementPage />
                  </React.Suspense>
                }
              />
              <Route
                path="/scim"
                element={
                  <React.Suspense fallback={<div className="p-6 text-sm">Loading…</div>}>
                    <ScimProvisioningPage />
                  </React.Suspense>
                }
              />
              <Route
                path="/scim-provisioning"
                element={
                  <React.Suspense fallback={<div className="p-6 text-sm">Loading…</div>}>
                    <ScimProvisioningPage />
                  </React.Suspense>
                }
              />
              <Route
                path="/sso-configuration"
                element={
                  <React.Suspense fallback={<div className="p-6 text-sm">Loading…</div>}>
                    <SsoConfigurationPage />
                  </React.Suspense>
                }
              />
              <Route
                path="/kms-configuration"
                element={
                  <React.Suspense fallback={<div className="p-6 text-sm">Loading…</div>}>
                    <KmsConfigurationPage />
                  </React.Suspense>
                }
              />
              <Route
                path="/api/builder"
                element={
                  <React.Suspense fallback={<div className="p-6 text-sm">Loading…</div>}>
                    <ApiBuilderPage />
                  </React.Suspense>
                }
              />
              <Route
                path="/support"
                element={
                  <React.Suspense fallback={<div className="p-6 text-sm">Loading…</div>}>
                    <SupportPage />
                  </React.Suspense>
                }
              />
              <Route
                path="/admin/test-runner"
                element={
                  <React.Suspense fallback={<div className="p-6 text-sm">Loading…</div>}>
                    <TestRunnerPage />
                  </React.Suspense>
                }
              />
              <Route
                path="/src/components/dashboards/SolopreneurDashboard.tsx"
                element={<Navigate to="/dashboard" replace />}
              />
              <Route
                path="/enterprise/data-warehouse"
                element={
                  <React.Suspense fallback={<div className="p-6 text-sm">Loading…</div>}>
                    <DataWarehouseManager />
                  </React.Suspense>
                }
              />
              <Route
                path="/enterprise/security"
                element={
                  <React.Suspense fallback={<div className="p-6 text-sm">Loading…</div>}>
                    <SecurityDashboard />
                  </React.Suspense>
                }
              />
              <Route
                path="/enterprise/portfolio"
                element={
                  <React.Suspense fallback={<div className="p-6 text-sm">Loading…</div>}>
                    <PortfolioDashboard />
                  </React.Suspense>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MemoryRouter>
          <Toaster />
        </FullInstrumentationProvider>
      </AppProviders>
    </ErrorBoundary>
  </StrictMode>,
);