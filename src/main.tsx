import { Toaster } from "sonner";
import { FullInstrumentationProvider } from "@/instrumentation.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React, { StrictMode, useEffect, Component } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation, Navigate, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import "./index.css";
import "./i18n/config";
import Landing from "./pages/Landing.tsx";
import NotFound from "./pages/NotFound.tsx";
import "./types/global.d.ts";

// Lazy-loaded pages for code splitting
// Import pages directly without lazy loading for instant transitions
import AuthPage from "@/pages/Auth.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Onboarding from "./pages/Onboarding.tsx";
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
import ApiBuilderPage from "./pages/ApiBuilder";
import SupportPage from "./pages/Support";
import TestRunnerPage from "./pages/TestRunner";
import DocsPage from "./pages/Docs";
import CrmIntegrationHubPage from "./pages/CrmIntegrationHub";
import CustomerJourneyPage from "./pages/CustomerJourney";
import VendorManagementPage from "./pages/VendorManagement";
import ContentCalendarPage from "./pages/ContentCalendar";
import PortfolioDashboardPage from "./pages/PortfolioDashboard";
import DataWarehousePage from "./pages/DataWarehouse";
import { DataWarehouseManager } from "./components/enterprise/DataWarehouseManager";
import { SecurityDashboard } from "./components/enterprise/SecurityDashboard";
import { PortfolioDashboard } from "./components/enterprise/PortfolioDashboard";
import ResetPassword from "./pages/ResetPassword";

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