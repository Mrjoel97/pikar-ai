import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { AuthContainer } from "@/components/auth/AuthContainer";

interface AuthProps {
  redirectAfterAuth?: string;
}

function Auth({ redirectAfterAuth = "/dashboard" }: AuthProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Fetch onboarding status for authenticated users
  const onboardingStatus = useQuery(
    api.onboarding.getOnboardingStatus,
    isAuthenticated ? {} : undefined
  );

  // Handle post-authentication redirection
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) return;

    // Wait for onboarding status to load
    if (onboardingStatus === undefined) return;

    // Redirect to onboarding if needed
    if (onboardingStatus?.needsOnboarding) {
      navigate("/onboarding");
      return;
    }

    // Otherwise redirect to dashboard or specified path
    navigate(redirectAfterAuth);
  }, [isAuthenticated, authLoading, onboardingStatus, navigate, redirectAfterAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[58rem] space-y-4 md:space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            Welcome to Pikar AI
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in with Google or continue as a guest to explore.
          </p>
        </div>

        {/* Auth Container */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="flex items-center justify-center h-full flex-col">
            <AuthContainer />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return <Auth {...props} />;
}