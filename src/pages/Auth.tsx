import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Brain } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { setGuestMode, clearGuestMode } from "@/lib/guestUtils";
import { AuthMethodTabs } from "@/components/auth/AuthMethodTabs";
import { PasswordAuthForm } from "@/components/auth/PasswordAuthForm";
import { EmailAuthForm } from "@/components/auth/EmailAuthForm";
import { OtpVerificationForm } from "@/components/auth/OtpVerificationForm";
import { GuestTierDialog } from "@/components/auth/GuestTierDialog";

interface AuthProps {
  redirectAfterAuth?: string;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isAuthenticated, isLoading: authLoading, signIn } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidEmail = emailPattern.test(email);

  const [guestDialogOpen, setGuestDialogOpen] = useState(false);
  const [guestTier, setGuestTier] = useState<"solopreneur" | "startup" | "sme" | "enterprise" | "">("");

  const onboardingStatus = useQuery(
    api.onboarding.getOnboardingStatus,
    isAuthenticated ? {} : undefined
  );

  const [authMethod, setAuthMethod] = useState<"email" | "password" | "google">("password");
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");

  const business = useQuery(api.businesses.currentUserBusiness, undefined);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    if (onboardingStatus === undefined) return;

    if (onboardingStatus?.needsOnboarding) {
      navigate("/onboarding");
      return;
    }

    const redirect = redirectAfterAuth || "/";
    navigate(redirect);
  }, [isAuthenticated, authLoading, onboardingStatus, navigate, redirectAfterAuth]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
      setIsLoading(false);
      toast.success(`Verification code sent to ${String(formData.get("email"))}`);
    } catch (error) {
      console.error("Email sign-in error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to send verification code. Please try again.",
      );
      setIsLoading(false);
      toast.error("Failed to send verification code");
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (authMode === "signup") {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters long");
        }

        // For now, redirect to email OTP flow for signup
        // Password auth can be added later with proper backend setup
        toast.info("Please use email verification to create your account");
        setAuthMethod("email");
        return;
      } else {
        // For login, also use email OTP for now
        toast.info("Please use email verification to sign in");
        setAuthMethod("email");
        return;
      }
    } catch (error) {
      console.error("Password auth error:", error);
      setError(error instanceof Error ? error.message : "Authentication failed");
      toast.error(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);

      clearGuestMode();

      const redirect = authMode === "signup" ? "/onboarding" : (redirectAfterAuth || "/");
      toast.success("Signed in");
      navigate(redirect);
    } catch (error) {
      console.error("OTP verification error:", error);
      setError("The verification code you entered is incorrect.");
      setIsLoading(false);
      setOtp("");
      toast.error("Incorrect verification code");
    }
  };

  const handleGuestLogin = async () => {
    setError(null);
    setGuestDialogOpen(true);
  };

  const handleConfirmGuest = async () => {
    if (!guestTier) {
      setError("Please select a tier to continue as a guest.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Sign in anonymously first
      await signIn("anonymous");
      
      // Set guest mode in localStorage
      setGuestMode(guestTier);
      
      toast("Signed in as guest");
      const redirect = "/dashboard?guest=1&tier=" + encodeURIComponent(guestTier);
      navigate(redirect);
    } catch (error) {
      console.error("Guest login error:", error);
      setError(`Failed to continue as guest: ${error instanceof Error ? error.message : "Unknown error"}`);
      toast.error("Failed to sign in as guest");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setError(null);
    toast("Redirecting to Google…");
    signIn("google").catch((err: unknown) => {
      console.error("Google sign-in error:", err);
      setError("Google sign-in failed. Please try again.");
      setIsLoading(false);
      toast.error("Google sign-in failed");
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-4 md:space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            {authMode === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {authMode === "login"
              ? "Sign in with your password, email verification, or Google."
              : "Sign up with your password, email verification, or Google."}
          </p>
        </div>

        <AuthMethodTabs authMethod={authMethod} setAuthMethod={setAuthMethod} />

        <div className="flex-1 flex items-center justify-center px-4">
          <div className="flex items-center justify-center h-full flex-col">
            <Card className="w-full neu-raised rounded-2xl border-0 shadow-xl bg-emerald-800 text-emerald-50">
              {step === "signIn" ? (
                <>
                  <CardHeader className="text-center">
                    <div className="flex justify-center">
                      <Brain
                        className="h-16 w-16 rounded-xl mb-4 mt-4 cursor-pointer bg-emerald-700 p-2 text-emerald-50"
                        onClick={() => navigate("/")}
                      />
                    </div>
                    <CardTitle className="text-xl text-emerald-50">Get Started</CardTitle>
                    <CardDescription className="text-emerald-200">
                      {authMethod === "password" 
                        ? `${authMode === "signup" ? "Create your account" : "Sign in"} with your password.`
                        : "Enter your email and we'll send you a 6‑digit code to sign in or create your account."
                      }
                    </CardDescription>
                  </CardHeader>

                  {authMethod === "password" ? (
                    <PasswordAuthForm
                      email={email}
                      setEmail={setEmail}
                      password={password}
                      setPassword={setPassword}
                      confirmPassword={confirmPassword}
                      setConfirmPassword={setConfirmPassword}
                      authMode={authMode}
                      setAuthMode={setAuthMode}
                      isLoading={isLoading}
                      touched={touched}
                      setTouched={setTouched}
                      isValidEmail={isValidEmail}
                      error={error}
                      onSubmit={handlePasswordSubmit}
                      onGoogleLogin={handleGoogleLogin}
                      onGuestLogin={handleGuestLogin}
                    />
                  ) : (
                    <EmailAuthForm
                      email={email}
                      setEmail={setEmail}
                      authMode={authMode}
                      setAuthMode={setAuthMode}
                      isLoading={isLoading}
                      touched={touched}
                      setTouched={setTouched}
                      isValidEmail={isValidEmail}
                      error={error}
                      onSubmit={handleEmailSubmit}
                      onGoogleLogin={handleGoogleLogin}
                      onGuestLogin={handleGuestLogin}
                    />
                  )}
                </>
              ) : (
                <>
                  <CardHeader className="text-center">
                    <CardTitle className="text-emerald-50">Check your email</CardTitle>
                    <CardDescription className="text-emerald-200">
                      We've sent a code to {step.email}
                    </CardDescription>
                  </CardHeader>
                  <OtpVerificationForm
                    email={step.email}
                    otp={otp}
                    setOtp={setOtp}
                    isLoading={isLoading}
                    error={error}
                    onSubmit={handleOtpSubmit}
                    onBackToSignIn={() => setStep("signIn")}
                  />
                </>
              )}

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

        <GuestTierDialog
          open={guestDialogOpen}
          onOpenChange={setGuestDialogOpen}
          guestTier={guestTier}
          setGuestTier={setGuestTier}
          isLoading={isLoading}
          error={error}
          onConfirm={handleConfirmGuest}
        />
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}