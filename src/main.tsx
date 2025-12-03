import { Toaster } from "sonner";
import { FullInstrumentationProvider } from "@/instrumentation.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React, { StrictMode, useEffect, Component, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation, Navigate, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import "./index.css";
import "./i18n/config";
import "./types/global.d.ts";

// Import critical pages directly for instant loading
import Landing from "./pages/Landing.tsx";
import AuthPage from "@/pages/Auth.tsx";
import NotFound from "./pages/NotFound.tsx";

// Lazy load all other pages for better initial load performance
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Onboarding = lazy(() => import("./pages/Onboarding.tsx"));
const InitiativesPage = lazy(() => import("@/pages/Initiatives.tsx"));
const AgentsPage = lazy(() => import("@/pages/Agents.tsx"));
const WorkflowsPage = lazy(() => import("@/pages/Workflows.tsx"));
const WorkflowTemplatesPage = lazy(() => import("@/pages/WorkflowTemplates.tsx"));
const BusinessPage = lazy(() => import("@/pages/Business.tsx"));
const AnalyticsPage = lazy(() => import("@/pages/Analytics.tsx"));
const ApprovalAnalyticsPage = lazy(() => import("@/pages/ApprovalAnalytics"));
const PricingPage = lazy(() => import("./pages/Pricing.tsx"));
const SettingsPage = lazy(() => import("@/pages/Settings.tsx"));
const AdminPage = lazy(() => import("@/pages/Admin.tsx"));
const AdminAuthPage = lazy(() => import("./pages/AdminAuth.tsx"));
const LearningHubPage = lazy(() => import("@/pages/LearningHub.tsx"));
const SystemAgentsPage = lazy(() => import("@/pages/SystemAgents"));
const BrandingPortal = lazy(() => import("./pages/BrandingPortal.tsx"));
const ApiDocsPage = lazy(() => import("./pages/ApiDocs"));
const WebhookManagementPage = lazy(() => import("./pages/WebhookManagement"));
const ScimProvisioningPage = lazy(() => import("./pages/ScimProvisioning"));
const SsoConfigurationPage = lazy(() => import("./pages/SsoConfiguration"));
const KmsConfigurationPage = lazy(() => import("./pages/KmsConfiguration"));
const ApiBuilderPage = lazy(() => import("./pages/ApiBuilder"));
const SupportPage = lazy(() => import("./pages/Support"));
const TestRunnerPage = lazy(() => import("./pages/TestRunner"));
const DocsPage = lazy(() => import("./pages/Docs"));
const CrmIntegrationHubPage = lazy(() => import("./pages/CrmIntegrationHub"));
const CustomerJourneyPage = lazy(() => import("./pages/CustomerJourney"));
const VendorManagementPage = lazy(() => import("./pages/VendorManagement"));
const ContentCalendarPage = lazy(() => import("./pages/ContentCalendar"));
const PortfolioDashboardPage = lazy(() => import("./pages/PortfolioDashboard"));
const DataWarehousePage = lazy(() => import("./pages/DataWarehouse"));
const DataWarehouseManager = lazy(() => import("./components/enterprise/DataWarehouseManager").then(m => ({ default: m.DataWarehouseManager })));
const SecurityDashboard = lazy(() => import("./components/enterprise/SecurityDashboard").then(m => ({ default: m.SecurityDashboard })));
const PortfolioDashboard = lazy(() => import("./components/enterprise/PortfolioDashboard").then(m => ({ default: m.PortfolioDashboard })));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

console.log("Main.tsx: Module loaded");

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
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("App crashed:", errorMessage);
  }
  render() {
    if (this.state.hasError) {
      console.log("Main.tsx: ErrorBoundary caught error", this.state.error);
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-lg text-center">
            <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">
              Please refresh the page. If the issue persists, contact support.
            </p>
            <pre className="mt-4 p-4 bg-muted rounded text-left text-xs overflow-auto max-h-40">
              {String(this.state.error)}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function AppProviders({ children }: { children: React.ReactNode }) {
  console.log("Main.tsx: Rendering AppProviders");
  const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;
  if (!convexUrl || convexUrl === "undefined") {
    console.error("Main.tsx: Missing VITE_CONVEX_URL");
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
  console.log("Main.tsx: Rendering AnimatedRoutes", location.pathname);
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ 
          duration: 0.15, 
          ease: [0.22, 1, 0.36, 1]
        }}
      >
        <Suspense fallback={null}>
          <Routes location={location} key={location.pathname}>
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
            <Route path="/api/builder" element={<ApiBuilderPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/admin/test-runner" element={<TestRunnerPage />} />
            <Route path="/enterprise/data-warehouse" element={<DataWarehouseManager />} />
            <Route path="/enterprise/security" element={<SecurityDashboard />} />
            <Route path="/enterprise/portfolio" element={<PortfolioDashboard />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/crm-integration-hub" element={<CrmIntegrationHubPage />} />
            <Route path="/customer-journey" element={<CustomerJourneyPage />} />
            <Route path="/vendor-management" element={<VendorManagementPage />} />
            <Route path="/content-calendar" element={<ContentCalendarPage />} />
            <Route path="/portfolio-dashboard" element={<PortfolioDashboardPage />} />
            <Route path="/data-warehouse" element={<DataWarehousePage />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
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