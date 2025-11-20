import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Brain } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { setGuestMode } from "@/lib/guestUtils";
import { PasswordAuthForm } from "@/components/auth/PasswordAuthForm";
import { GuestTierDialog } from "@/components/auth/GuestTierDialog";

interface AuthProps {
  redirectAfterAuth?: string;
}

function Auth({ redirectAfterAuth = "/dashboard" }: AuthProps) {
  const { isAuthenticated, isLoading: authLoading, signIn } = useAuth();
  const navigate = useNavigate();
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Auth mode state
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  
  // Guest mode state
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);
  const [guestTier, setGuestTier] = useState<"solopreneur" | "startup" | "sme" | "enterprise" | "">("");

  // Email validation
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidEmail = emailPattern.test(email);

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

  // Password authentication handler (currently disabled)
  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (authMode === "signup") {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters long");
        }
        throw new Error("Password signup is not available yet. Please use Google Sign-In.");
      } else {
        throw new Error("Password login is not available yet. Please use Google Sign-In.");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Password auth error:", errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google Sign-In handler
  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      await signIn("google");
      toast.success("Redirecting to Google…");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("Google sign-in error:", errorMessage);
      setError("Google sign-in failed. Please try again.");
      toast.error("Google sign-in failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Guest mode handler
  const handleGuestLogin = async () => {
    setError(null);
    setGuestDialogOpen(true);
  };

  // Guest tier confirmation handler
  const handleConfirmGuest = async () => {
    if (!guestTier) {
      setError("Please select a tier to continue as a guest.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await signIn("anonymous");
      setGuestMode(guestTier);
      toast.success("Signed in as guest");
      navigate(`/dashboard?guest=1&tier=${encodeURIComponent(guestTier)}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Guest login error:", errorMessage);
      setError(`Failed to continue as guest: ${errorMessage}`);
      toast.error("Failed to sign in as guest");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-4 md:space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            {authMode === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {authMode === "login"
              ? "Sign in with Google or continue as a guest."
              : "Sign up with Google or continue as a guest."}
          </p>
        </div>

        {/* Auth Card */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="flex items-center justify-center h-full flex-col">
            <Card className="w-full neu-raised rounded-2xl border-0 shadow-xl bg-emerald-800 text-emerald-50">
              <CardHeader className="text-center">
                <div className="flex justify-center">
                  <Brain
                    className="h-16 w-16 rounded-xl mb-4 mt-4 cursor-pointer bg-emerald-700 p-2 text-emerald-50"
                    onClick={() => navigate("/")}
                  />
                </div>
                <CardTitle className="text-xl text-emerald-50">Get Started</CardTitle>
                <CardDescription className="text-emerald-200">
                  {authMode === "signup" ? "Create your account" : "Sign in"} to continue.
                </CardDescription>
              </CardHeader>

              <PasswordAuthForm
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                authMode={authMode}
                setAuthMode={setAuthMode}
                isLoading={isSubmitting}
                touched={touched}
                setTouched={setTouched}
                isValidEmail={isValidEmail}
                error={error}
                onSubmit={handlePasswordSubmit}
                onGoogleLogin={handleGoogleLogin}
                onGuestLogin={handleGuestLogin}
              />

              {/* Footer */}
              <div className="py-4 px-6 text-xs text-center bg-emerald-900/40 border-t border-emerald-700/50 rounded-b-lg text-emerald-200">
                Secured by{" "}
                <a
                  href="https://vly.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-emerald-50 transition-colors"
                >
                  vly.ai
                </a>
              </div>
            </Card>
          </div>
        </div>

        {/* Guest Tier Selection Dialog */}
        <GuestTierDialog
          open={guestDialogOpen}
          onOpenChange={setGuestDialogOpen}
          guestTier={guestTier}
          setGuestTier={setGuestTier}
          isLoading={isSubmitting}
          error={error}
          onConfirm={handleConfirmGuest}
        />
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return <Auth {...props} />;
}