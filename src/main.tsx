import { Toaster } from "sonner";
import { FullInstrumentationProvider } from "@/instrumentation.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React, { StrictMode, useEffect, Component } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation, Navigate, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import "./index.css";
import Landing from "./pages/Landing.tsx";
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

const DocsPage = React.lazy(() => import("./pages/Docs"));

// Add new lazy-loaded pages
const CrmIntegrationHubPage = React.lazy(() => import("./pages/CrmIntegrationHub"));
const CustomerJourneyPage = React.lazy(() => import("./pages/CustomerJourney"));
const VendorManagementPage = React.lazy(() => import("./pages/VendorManagement"));
const ContentCalendarPage = React.lazy(() => import("./pages/ContentCalendar"));
const PortfolioDashboardPage = React.lazy(() => import("./pages/PortfolioDashboard"));
const DataWarehousePage = React.lazy(() => import("./pages/DataWarehouse"));

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
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
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

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20, scale: 0.98 }}
        transition={{ 
          duration: 0.25, 
          ease: [0.22, 1, 0.36, 1],
          exit: { duration: 0.2 }
        }}
      >
        <Routes location={location}>
          <Route path="/" element={<Landing />} />
          <Route
            path="/auth"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <AuthPage redirectAfterAuth="/dashboard" />
              </React.Suspense>
            }
          />
          <Route
            path="/dashboard"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <Dashboard />
              </React.Suspense>
            }
          />
          <Route
            path="/onboarding"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <Onboarding />
              </React.Suspense>
            }
          />
          <Route
            path="/initiatives"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <InitiativesPage />
              </React.Suspense>
            }
          />
          <Route
            path="/agents"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <AgentsPage />
              </React.Suspense>
            }
          />
          <Route
            path="/ai-agents"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <AgentsPage />
              </React.Suspense>
            }
          />
          <Route
            path="/analytics"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <AnalyticsPage />
              </React.Suspense>
            }
          />
          <Route
            path="/approval-analytics"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <ApprovalAnalyticsPage />
              </React.Suspense>
            }
          />
          <Route
            path="/workflows"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <WorkflowsPage />
              </React.Suspense>
            }
          />
          <Route
            path="/workflows/templates"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <WorkflowTemplatesPage />
              </React.Suspense>
            }
          />
          <Route
            path="/business"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <BusinessPage />
              </React.Suspense>
            }
          />
          <Route
            path="/settings"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <SettingsPage />
              </React.Suspense>
            }
          />
          <Route
            path="/admin"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <AdminPage />
              </React.Suspense>
            }
          />
          <Route
            path="/admin-auth"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <AdminAuthPage />
              </React.Suspense>
            }
          />
          <Route
            path="/learning-hub"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <LearningHubPage />
              </React.Suspense>
            }
          />
          <Route
            path="/admin/system-agents"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <SystemAgentsPage />
              </React.Suspense>
            }
          />
          <Route
            path="/branding"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <BrandingPortal />
              </React.Suspense>
            }
          />
          <Route
            path="/api-docs"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <ApiDocsPage />
              </React.Suspense>
            }
          />
          <Route
            path="/webhooks"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <WebhookManagementPage />
              </React.Suspense>
            }
          />
          <Route
            path="/scim"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <ScimProvisioningPage />
              </React.Suspense>
            }
          />
          <Route
            path="/scim-provisioning"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <ScimProvisioningPage />
              </React.Suspense>
            }
          />
          <Route
            path="/sso-configuration"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <SsoConfigurationPage />
              </React.Suspense>
            }
          />
          <Route
            path="/kms-configuration"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <KmsConfigurationPage />
              </React.Suspense>
            }
          />
          <Route
            path="/api/builder"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <ApiBuilderPage />
              </React.Suspense>
            }
          />
          <Route
            path="/support"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <SupportPage />
              </React.Suspense>
            }
          />
          <Route
            path="/admin/test-runner"
            element={
              <React.Suspense fallback={<PageLoader />}>
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
              <React.Suspense fallback={<PageLoader />}>
                <DataWarehouseManager />
              </React.Suspense>
            }
          />
          <Route
            path="/enterprise/security"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <SecurityDashboard />
              </React.Suspense>
            }
          />
          <Route
            path="/enterprise/portfolio"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <PortfolioDashboard />
              </React.Suspense>
            }
          />
          <Route
            path="/docs"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <DocsPage />
              </React.Suspense>
            }
          />
          <Route
            path="/crm-integration-hub"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <CrmIntegrationHubPage />
              </React.Suspense>
            }
          />
          <Route
            path="/customer-journey"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <CustomerJourneyPage />
              </React.Suspense>
            }
          />
          <Route
            path="/vendor-management"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <VendorManagementPage />
              </React.Suspense>
            }
          />
          <Route
            path="/content-calendar"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <ContentCalendarPage />
              </React.Suspense>
            }
          />
          <Route
            path="/portfolio-dashboard"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <PortfolioDashboardPage />
              </React.Suspense>
            }
          />
          <Route
            path="/data-warehouse"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <DataWarehousePage />
              </React.Suspense>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function PageLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="min-h-screen flex items-center justify-center"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full"
      />
    </motion.div>
  );
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
            <AnimatedRoutes />
          </MemoryRouter>
          <Toaster />
        </FullInstrumentationProvider>
      </AppProviders>
    </ErrorBoundary>
  </StrictMode>,
);