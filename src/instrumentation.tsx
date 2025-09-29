import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronDown, ExternalLink } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

type SyncError = {
  error: string;
  stack: string;
  filename: string;
  lineno: number;
  colno: number;
};

type AsyncError = {
  error: string;
  stack: string;
};

type GenericError = SyncError | AsyncError;

async function reportErrorToVly(errorData: {
  error: string;
  stackTrace?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
}) {
  if (!import.meta.env.VITE_VLY_APP_ID) {
    return;
  }

  try {
    await fetch(import.meta.env.VITE_VLY_MONITORING_URL, {
      method: "POST",
      body: JSON.stringify({
        ...errorData,
        url: window.location.href,
        projectSemanticIdentifier: import.meta.env.VITE_VLY_APP_ID,
      }),
    });
  } catch (error) {
    console.error("Failed to report error to Vly:", error);
  }
}

function ErrorDialog({
  error,
  setError,
}: {
  error: GenericError;
  setError: (error: GenericError | null) => void;
}) {
  return (
    <Dialog
      defaultOpen={true}
      onOpenChange={() => {
        setError(null);
      }}
    >
      <DialogContent className="bg-red-700 text-white max-w-4xl">
        <DialogHeader>
          <DialogTitle>Runtime Error</DialogTitle>
        </DialogHeader>
        A runtime error occurred. Open the vly editor to automatically debug the
        error.
        <div className="mt-4">
          <Collapsible>
            <CollapsibleTrigger>
              <div className="flex items-center font-bold cursor-pointer">
                See error details <ChevronDown />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="max-w-[460px]">
              <div className="mt-2 p-3 bg-neutral-800 rounded text-white text-sm overflow-x-auto max-h-60 max-w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <pre className="whitespace-pre">{error.stack}</pre>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
        <DialogFooter>
          <a
            href={`https://vly.ai/project/${import.meta.env.VITE_VLY_APP_ID}`}
            target="_blank"
          >
            <Button>
              <ExternalLink /> Open editor
            </Button>
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type ErrorBoundaryState = {
  hasError: boolean;
  error: GenericError | null;
};

class ErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
  },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // logErrorToMyService(
    //   error,
    //   // Example "componentStack":
    //   //   in ComponentThatThrows (created by App)
    //   //   in ErrorBoundary (created by App)
    //   //   in div (created by App)
    //   //   in App
    //   info.componentStack,
    //   // Warning: `captureOwnerStack` is not available in production.
    //   React.captureOwnerStack(),
    // );
    reportErrorToVly({
      error: error.message,
      stackTrace: error.stack,
    });
    this.setState({
      hasError: true,
      error: {
        error: error.message,
        stack: info.componentStack ?? error.stack ?? "",
      },
    });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <ErrorDialog
          error={{
            error: "An error occurred",
            stack: "",
          }}
          setError={() => {}}
        />
      );
    }

    return this.props.children;
  }
}

function FullInstrumentationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hasShownEnvToast, setHasShownEnvToast] = useState(false);
  const [hasShownQueueToast, setHasShownQueueToast] = useState(false);

  // Determine if Convex is configured before issuing any queries
  const hasConvex = Boolean(
    import.meta.env.VITE_CONVEX_URL && import.meta.env.VITE_CONVEX_URL !== "undefined"
  );

  // Gate queries to avoid network errors when Convex isn't configured/reachable
  const healthStatus = useQuery(api.health.envStatus as any, hasConvex ? ({} as any) : undefined);

  useEffect(() => {
    if (!hasConvex || !healthStatus || hasShownEnvToast) return;

    const missingVars = [];
    if (!healthStatus.hasRESEND) missingVars.push("RESEND_API_KEY");
    if (!healthStatus.hasSALES_INBOX && !healthStatus.hasPUBLIC_SALES_INBOX) {
      missingVars.push("SALES_INBOX or PUBLIC_SALES_INBOX");
    }
    if (!healthStatus.hasBASE_URL) missingVars.push("VITE_PUBLIC_BASE_URL");

    if (missingVars.length > 0) {
      toast.error(`Missing environment variables: ${missingVars.join(", ")}`);
      setHasShownEnvToast(true);
    }
  }, [hasConvex, healthStatus, hasShownEnvToast]);

  useEffect(() => {
    if (!hasConvex || !healthStatus || hasShownQueueToast) return;

    if (healthStatus.emailQueueDepth > 100) {
      toast.warning(`High email queue depth: ${healthStatus.emailQueueDepth} pending`);
      setHasShownQueueToast(true);
    }
  }, [hasConvex, healthStatus, hasShownQueueToast]);

  const [error, setError] = useState<GenericError | null>(null);

  // Add: environment precheck to surface actionable toasts once
  const envStatus = useQuery(api.health.envStatus as any, hasConvex ? ({} as any) : undefined);
  const [envToastsShown, setEnvToastsShown] = useState(false);

  useEffect(() => {
    if (!hasConvex || !envStatus || envToastsShown) return;
    try {
      const hasResend = Boolean((envStatus as any)?.hasRESEND);
      const hasSalesInbox = Boolean(
        (envStatus as any)?.hasSALES_INBOX || (envStatus as any)?.hasPUBLIC_SALES_INBOX
      );
      const hasBaseUrl = Boolean((envStatus as any)?.hasBASE_URL);
      const devSafeEmails = Boolean((envStatus as any)?.devSafeEmailsEnabled);

      if (!hasResend) {
        console.warn("[ENV] RESEND_API_KEY is missing. Email delivery is disabled.");
        toast("Email delivery is disabled (missing RESEND_API_KEY). Enable it or set DEV_SAFE_EMAILS=true to stub.");
      }
      if (!hasSalesInbox) {
        console.warn("[ENV] SALES_INBOX/PUBLIC_SALES_INBOX is missing. Sales inquiries cannot be delivered.");
        toast("Sales inbox is not configured. Set SALES_INBOX or PUBLIC_SALES_INBOX.");
      }
      if (!hasBaseUrl) {
        console.warn("[ENV] VITE_PUBLIC_BASE_URL is missing. Unsubscribe links may be invalid.");
        toast("Public base URL missing. Set VITE_PUBLIC_BASE_URL for correct unsubscribe links.");
      }
      if (devSafeEmails) {
        console.info("[ENV] DEV_SAFE_EMAILS enabled. Outbound emails will be stubbed.");
        toast("DEV safe mode is ON. Emails are stubbed, not sent.");
      }
    } catch (e) {
      console.error("Failed to show env toasts:", e);
    } finally {
      setEnvToastsShown(true);
    }
  }, [hasConvex, envStatus, envToastsShown]);

  useEffect(() => {
    const handleError = async (event: ErrorEvent) => {
      try {
        console.log(event);
        event.preventDefault();
        setError({
          error: event.message,
          stack: event.error?.stack || "",
          filename: event.filename || "",
          lineno: event.lineno,
          colno: event.colno,
        });

        if (import.meta.env.VITE_VLY_APP_ID) {
          await reportErrorToVly({
            error: event.message,
            stackTrace: event.error?.stack,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          });
        }
      } catch (error) {
        console.error("Error in handleError:", error);
      }
    };

    const handleRejection = async (event: PromiseRejectionEvent) => {
      try {
        console.error(event);

        if (import.meta.env.VITE_VLY_APP_ID) {
          await reportErrorToVly({
            error: event.reason.message,
            stackTrace: event.reason.stack,
          });
        }

        setError({
          error: event.reason.message,
          stack: event.reason.stack,
        });
      } catch (error) {
        console.error("Error in handleRejection:", error);
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);
  return (
    <>
      <ErrorBoundary>{children}</ErrorBoundary>
      {error && <ErrorDialog error={error} setError={setError} />}
    </>
  );
}

function LiteInstrumentation({
  children,
}: {
  children: React.ReactNode;
}) {
  const [error, setError] = useState<GenericError | null>(null);

  useEffect(() => {
    const handleError = async (event: ErrorEvent) => {
      try {
        event.preventDefault();
        setError({
          error: event.message,
          stack: event.error?.stack || "",
          filename: event.filename || "",
          lineno: event.lineno,
          colno: event.colno,
        });

        if (import.meta.env.VITE_VLY_APP_ID) {
          await reportErrorToVly({
            error: event.message,
            stackTrace: event.error?.stack,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          });
        }
      } catch (err) {
        console.error("Error in public handleError:", err);
      }
    };

    const handleRejection = async (event: PromiseRejectionEvent) => {
      try {
        if (import.meta.env.VITE_VLY_APP_ID) {
          await reportErrorToVly({
            error: event.reason?.message ?? "Unhandled rejection",
            stackTrace: event.reason?.stack,
          });
        }
        setError({
          error: event.reason?.message ?? "Unhandled rejection",
          stack: event.reason?.stack,
        });
      } catch (err) {
        console.error("Error in public handleRejection:", err);
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return (
    <>
      <ErrorBoundary>{children}</ErrorBoundary>
      {error && <ErrorDialog error={error} setError={setError} />}
    </>
  );
}

export function InstrumentationProvider({ children }: { children: React.ReactNode }) {
  const path = window.location.pathname;
  const isPublicLanding = path === "/";

  if (isPublicLanding) {
    return <LiteInstrumentation>{children}</LiteInstrumentation>;
  }
  return <FullInstrumentationProvider>{children}</FullInstrumentationProvider>;
}