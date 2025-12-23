import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { setGuestMode } from "@/lib/guestUtils";

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

  // Password authentication handler using Convex Auth Password provider
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
      }
      
      // Create FormData from the actual form element
      const form = event.currentTarget;
      const formData = new FormData(form);
      
      // Ensure email and password are in the FormData
      formData.set("email", email);
      formData.set("password", password);
      formData.set("flow", authMode === "signup" ? "signUp" : "signIn");
      
      await signIn("password", formData);
      
      if (authMode === "signup") {
        toast.success("Account created! Redirecting to onboarding...");
      } else {
        toast.success("Signed in successfully!");
      }
      
      // Let Auth.tsx handle the redirect based on onboarding status
      // No explicit navigation needed here
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
      // After Google OAuth completes and redirects back, Auth.tsx will handle routing
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