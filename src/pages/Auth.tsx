import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Loader2, Mail, UserX, Brain, Lock } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
/* removed duplicate useEffect import */
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface AuthProps {
  redirectAfterAuth?: string;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isAuthenticated, isLoading: authLoading, signIn } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  // Add password state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidEmail = emailPattern.test(email);

  // Add: guest tier dialog state
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);
  const [guestTier, setGuestTier] = useState<"solopreneur" | "startup" | "sme" | "enterprise" | "">("");

  // Add: onboarding status query (skip until authenticated)
  const onboardingStatus = useQuery(
    api.onboarding.getOnboardingStatus,
    isAuthenticated ? {} : undefined
  );

  // Add: auth method toggle and password auth state
  const [authMethod, setAuthMethod] = useState<"email" | "password" | "google">("password");
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [passwordAuthToken, setPasswordAuthToken] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) return;
    // If authenticated and onboarding status says we need onboarding, route there
    if (onboardingStatus && onboardingStatus.needsOnboarding) {
      navigate("/onboarding");
      return;
    }
    if (!authLoading && isAuthenticated) {
      const redirect = redirectAfterAuth || "/";
      navigate(redirect);
    }
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

        const result = await fetch("/api/convex", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: "passwordAuth:signUpPassword",
            args: { email, password },
          }),
        }).then(r => r.json());

        if (result.error) throw new Error(result.error);
        
        toast.success("Account created! Please verify your email to continue.");
        navigate("/onboarding");
      } else {
        const result = await fetch("/api/convex", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: "passwordAuth:loginPassword",
            args: { email, password },
          }),
        }).then(r => r.json());

        if (result.error) throw new Error(result.error);
        
        setPasswordAuthToken(result.token);
        toast.success("Signed in! Verify your email for full access.");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Password auth error:", error);
      setError(error instanceof Error ? error.message : "Authentication failed");
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

      console.log("signed in");

      // Route signups directly to onboarding
      const redirect =
        authMode === "signup" ? "/onboarding" : (redirectAfterAuth || "/");
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
    // Open tier selection dialog instead of immediate sign-in
    setError(null);
    setGuestDialogOpen(true);
  };

  // Add: Confirm guest tier selection -> anonymous sign-in
  const handleConfirmGuest = async () => {
    if (!guestTier) {
      setError("Please select a tier to continue as a guest.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      // Persist tier override for dashboard
      try {
        localStorage.setItem("tierOverride", guestTier);
      } catch {}
      toast("Signed in as guest");
      // Ensure dashboard treats this as guest mode
      const redirect = "/dashboard?guest=1&tier=" + encodeURIComponent(guestTier);
      navigate(redirect);
    } catch (error) {
      console.error("Guest login error:", error);
      setError(`Failed to sign in as guest: ${error instanceof Error ? error.message : "Unknown error"}`);
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
        {/* Optional: light heading to reflect mode without disrupting existing Card header */}
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

        {/* Auth Method Tabs */}
        <div className="flex rounded-lg bg-muted p-1">
          <button
            type="button"
            onClick={() => setAuthMethod("password")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              authMethod === "password"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => setAuthMethod("email")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              authMethod === "email"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Email Code
          </button>
        </div>

        {/* Auth Content */}
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
                    <form onSubmit={handlePasswordSubmit}>
                      <CardContent className="space-y-4">
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            name="email"
                            placeholder="name@example.com"
                            type="email"
                            className="pl-9 neu-inset rounded-xl bg-white text-slate-900 placeholder:text-slate-500"
                            disabled={isLoading}
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onBlur={() => setTouched(true)}
                            aria-invalid={touched && !isValidEmail}
                          />
                        </div>
                        
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            name="password"
                            placeholder={authMode === "login" ? "Enter your password" : "Create a password"}
                            type="password"
                            className="h-10 w-full pl-9 neu-inset rounded-xl bg-white text-slate-900 placeholder:text-slate-500"
                            disabled={isLoading}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete={authMode === "login" ? "current-password" : "new-password"}
                          />
                        </div>

                        {authMode === "signup" && (
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              name="confirmPassword"
                              placeholder="Confirm your password"
                              type="password"
                              className="h-10 w-full pl-9 neu-inset rounded-xl bg-white text-slate-900 placeholder:text-slate-500"
                              disabled={isLoading}
                              required
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              autoComplete="new-password"
                            />
                          </div>
                        )}

                        {touched && !isValidEmail && (
                          <p className="mt-2 text-xs text-red-500">
                            Please enter a valid email address.
                          </p>
                        )}
                        {error && (
                          <p className="mt-2 text-sm text-red-500">{error}</p>
                        )}

                        <Button
                          type="submit"
                          className="w-full neu-raised rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white"
                          disabled={isLoading || !isValidEmail || !password}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {authMode === "signup" ? "Creating account..." : "Signing in..."}
                            </>
                          ) : (
                            authMode === "signup" ? "Create Account" : "Sign In"
                          )}
                        </Button>

                        <div className="mt-4">
                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t border-emerald-300/30" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                              <span className="bg-emerald-800 px-2 text-emerald-200">
                                Or
                              </span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full mt-4 neu-flat rounded-xl bg-emerald-700/30 border-emerald-300/70 text-emerald-50 hover:bg-emerald-700"
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                          >
                            <img
                              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                              alt="Google"
                              className="h-4 w-4 mr-2"
                            />
                            Continue with Google
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full mt-2 neu-flat rounded-xl bg-emerald-700/30 border-emerald-300/70 text-emerald-50 hover:bg-emerald-700"
                            onClick={handleGuestLogin}
                            disabled={isLoading}
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Continue as Guest
                          </Button>
                          <div className="mt-4 text-center text-xs sm:text-sm">
                            {authMode === "signup" ? (
                              <span className="text-emerald-200">
                                Already have an account?{" "}
                                <button
                                  type="button"
                                  onClick={() => setAuthMode("login")}
                                  className="text-emerald-200 underline underline-offset-4 hover:text-emerald-50"
                                >
                                  Log in
                                </button>
                              </span>
                            ) : (
                              <span className="text-emerald-200">
                                New here?{" "}
                                <button
                                  type="button"
                                  onClick={() => setAuthMode("signup")}
                                  className="text-emerald-200 underline underline-offset-4 hover:text-emerald-50"
                                >
                                  Create an account
                                </button>
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </form>
                  ) : (
                    <form onSubmit={handleEmailSubmit}>
                      <CardContent className="space-y-4">
                        <div className="relative flex items-center gap-3">
                          <div className="relative flex-1">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              name="email"
                              placeholder="name@example.com"
                              type="email"
                              className="pl-9 neu-inset rounded-xl bg-white text-slate-900 placeholder:text-slate-500"
                              disabled={isLoading}
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              onBlur={() => setTouched(true)}
                              aria-invalid={touched && !isValidEmail}
                              aria-describedby="email-error"
                            />
                          </div>
                          <Button
                            type="submit"
                            variant="default"
                            size="icon"
                            disabled={isLoading || !isValidEmail}
                            aria-label="Send verification code"
                            className="neu-raised rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 shadow border border-emerald-200"
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                            ) : (
                              <ArrowRight className="h-5 w-5 text-emerald-600" />
                            )}
                          </Button>
                        </div>
                        {touched && !isValidEmail && (
                          <p id="email-error" className="mt-2 text-xs text-red-500">
                            Please enter a valid email address.
                          </p>
                        )}
                        {error && (
                          <p className="mt-2 text-sm text-red-500">{error}</p>
                        )}
                        
                        <div className="mt-4">
                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t border-emerald-300/30" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                              <span className="bg-emerald-800 px-2 text-emerald-200">
                                Or
                              </span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full mt-4 neu-flat rounded-xl bg-emerald-700/30 border-emerald-300/70 text-emerald-50 hover:bg-emerald-700"
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                          >
                            <img
                              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                              alt="Google"
                              className="h-4 w-4 mr-2"
                            />
                            Continue with Google
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full mt-2 neu-flat rounded-xl bg-emerald-700/30 border-emerald-300/70 text-emerald-50 hover:bg-emerald-700"
                            onClick={handleGuestLogin}
                            disabled={isLoading}
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Continue as Guest
                          </Button>
                          <div className="mt-4 text-center text-xs sm:text-sm">
                            {authMode === "signup" ? (
                              <span className="text-emerald-200">
                                Already have an account?{" "}
                                <button
                                  type="button"
                                  onClick={() => setAuthMode("login")}
                                  className="text-emerald-200 underline underline-offset-4 hover:text-emerald-50"
                                >
                                  Log in
                                </button>
                              </span>
                            ) : (
                              <span className="text-emerald-200">
                                New here?{" "}
                                <button
                                  type="button"
                                  onClick={() => setAuthMode("signup")}
                                  className="text-emerald-200 underline underline-offset-4 hover:text-emerald-50"
                                >
                                  Create an account
                                </button>
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </form>
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
                  <form onSubmit={handleOtpSubmit}>
                    <CardContent className="pb-4">
                      <input type="hidden" name="email" value={step.email} />
                      <input type="hidden" name="code" value={otp} />

                      <div className="flex justify-center">
                        <InputOTP
                          className="neu-inset rounded-xl p-2"
                          value={otp}
                          onChange={setOtp}
                          maxLength={6}
                          disabled={isLoading}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && otp.length === 6 && !isLoading) {
                              // Find the closest form and submit it
                              const form = (e.target as HTMLElement).closest("form");
                              if (form) {
                                form.requestSubmit();
                              }
                            }
                          }}
                        >
                          <InputOTPGroup>
                            {Array.from({ length: 6 }).map((_, index) => (
                              <InputOTPSlot key={index} index={index} />
                            ))}
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                      {error && (
                        <p className="mt-2 text-sm text-red-500 text-center">
                          {error}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground text-center mt-4">
                        Didn't receive a code?{" "}
                        <Button
                          variant="link"
                          className="p-0 h-auto"
                          onClick={() => setStep("signIn")}
                        >
                          Try again
                        </Button>
                      </p>
                    </CardContent>
                    <CardFooter className="flex-col gap-2">
                      <Button
                        type="submit"
                        className="w-full neu-raised rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white"
                        disabled={isLoading || otp.length !== 6}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            Verify code
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setStep("signIn")}
                        disabled={isLoading}
                        className="w-full neu-flat rounded-xl text-emerald-50 hover:bg-emerald-700"
                      >
                        Use different email
                      </Button>
                    </CardFooter>
                  </form>
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

        {/* Guest Tier Selection Dialog */}
        <Dialog open={guestDialogOpen} onOpenChange={setGuestDialogOpen}>
          <DialogContent className="max-w-md w-[92vw] neu-raised rounded-2xl border-0">
            <DialogHeader>
              <DialogTitle>Select a dashboard tier</DialogTitle>
              <DialogDescription>
                Preview Pikar using a tier-specific dashboard while signed in as a guest.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <RadioGroup
                value={guestTier}
                onValueChange={(v) =>
                  setGuestTier(v as "solopreneur" | "startup" | "sme" | "enterprise")
                }
                className="grid grid-cols-1 gap-3"
              >
                <div className="flex items-center gap-3 neu-inset rounded-xl p-3">
                  <RadioGroupItem id="tier-solo" value="solopreneur" />
                  <Label htmlFor="tier-solo" className="cursor-pointer">
                    Solopreneur — $99/mo
                  </Label>
                </div>
                <div className="flex items-center gap-3 neu-inset rounded-xl p-3">
                  <RadioGroupItem id="tier-startup" value="startup" />
                  <Label htmlFor="tier-startup" className="cursor-pointer">
                    Startup — $297/mo
                  </Label>
                </div>
                <div className="flex items-center gap-3 neu-inset rounded-xl p-3">
                  <RadioGroupItem id="tier-sme" value="sme" />
                  <Label htmlFor="tier-sme" className="cursor-pointer">
                    SME — $597/mo
                  </Label>
                </div>
                <div className="flex items-center gap-3 neu-inset rounded-xl p-3">
                  <RadioGroupItem id="tier-enterprise" value="enterprise" />
                  <Label htmlFor="tier-enterprise" className="cursor-pointer">
                    Enterprise — Custom
                  </Label>
                </div>
              </RadioGroup>
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="ghost"
                className="neu-flat rounded-xl"
                onClick={() => setGuestDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                className="neu-raised rounded-xl bg-primary hover:bg-primary/90"
                onClick={handleConfirmGuest}
                disabled={isLoading || !guestTier}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Continuing...
                  </>
                ) : (
                  <>
                    Continue as Guest
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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