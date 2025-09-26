import { Toaster } from "sonner";
import { InstrumentationProvider } from "@/instrumentation.tsx";
import AuthPage from "@/pages/Auth.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React, { StrictMode, useEffect, Component, useRef } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
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
import PricingPage from "./pages/Pricing.tsx";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import SettingsPage from "@/pages/Settings.tsx";
import AdminPage from "./pages/Admin";
import AdminAuthPage from "./pages/AdminAuth";
import LearningHubPage from "@/pages/LearningHub.tsx";

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
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}

function EnvHealth() {
  const env = useQuery(api.health.envStatus, {});
  const warnedRef = useRef(false);

  React.useEffect(() => {
    if (warnedRef.current) return;
    if (env === undefined) return;

    const warnings: string[] = [];
    if (!env.hasResend) warnings.push("RESEND_API_KEY");
    if (!env.hasSalesInbox) warnings.push("SALES_INBOX");
    if (!env.hasPublicBaseUrl) warnings.push("VITE_PUBLIC_BASE_URL");

    if (warnings.length > 0) {
      warnedRef.current = true;
      toast.error(
        `Missing configuration: ${warnings.join(
          ", ",
        )}. Open Integrations to configure secrets. Some features will be disabled until set.`,
      );
    } else if (env.devSafeEmails) {
      warnedRef.current = true;
      toast("DEV_SAFE_EMAILS is enabled. Outbound email delivery will be stubbed in development.");
    }
  }, [env]);

  return null;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <AppProviders>
        <InstrumentationProvider>
          <MemoryRouter>
            <RouteSyncer />
            {/* <EnvHealth /> */}
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<AuthPage redirectAfterAuth="/dashboard" />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/initiatives" element={<InitiativesPage />} />
              <Route path="/agents" element={<AgentsPage />} />
              <Route path="/ai-agents" element={<AgentsPage />} />
              <Route path="/workflows" element={<WorkflowsPage />} />
              <Route path="/workflows/templates" element={<WorkflowTemplatesPage />} />
              <Route path="/business" element={<BusinessPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin-auth" element={<AdminAuthPage />} />
              <Route path="/learning-hub" element={<LearningHubPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MemoryRouter>
          <Toaster />
        </InstrumentationProvider>
      </AppProviders>
    </ErrorBoundary>
  </StrictMode>,
);