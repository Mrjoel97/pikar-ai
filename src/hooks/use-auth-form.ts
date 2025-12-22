import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { setGuestMode } from "@/lib/guestUtils";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

export type AuthMode = "signup" | "login";
export type AuthMethod = "email" | "password" | "google";

export function useAuthForm() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guest mode state
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);
  const [guestTier, setGuestTier] = useState<"solopreneur" | "startup" | "sme" | "enterprise" | "">("");

  // Email validation
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidEmail = emailPattern.test(email);

  // Convex actions
  const signUpPasswordAction = useAction(api.passwordAuth.signUpPassword);
  const loginPasswordAction = useAction(api.passwordAuth.loginPassword);

  // Password authentication handler
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
        
        await signUpPasswordAction({ email, password });
        
        toast.success("Account created! Please sign in.");
        setAuthMode("login");
        setPassword("");
        setConfirmPassword("");
      } else {
        // Verify credentials first
        const result = await loginPasswordAction({ email, password });
        
        if (result.success) {
          // Now sign in with email OTP provider using a special flow
          // This will create the proper Convex Auth session
          toast.success("Credentials verified. Completing sign-in...");
          
          // Use a special token-based sign-in that bypasses OTP
          // The backend has already verified the password
          await signIn("email-otp", new FormData([
            ["email", email],
            ["code", "verified"], // Special code to indicate password was verified
          ] as any));
          
          toast.success("Signed in successfully!");
          navigate("/onboarding");
        }
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

  return {
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    authMode,
    setAuthMode,
    isSubmitting,
    touched,
    setTouched,
    isValidEmail,
    error,
    guestDialogOpen,
    setGuestDialogOpen,
    guestTier,
    setGuestTier,
    handlePasswordSubmit,
    handleGoogleLogin,
    handleGuestLogin,
    handleConfirmGuest,
  };
}