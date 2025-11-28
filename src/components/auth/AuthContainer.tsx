import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain } from "lucide-react";
import { useNavigate } from "react-router";
import { PasswordAuthForm } from "@/components/auth/PasswordAuthForm";
import { GuestTierDialog } from "@/components/auth/GuestTierDialog";
import { useAuthForm } from "@/hooks/use-auth-form";

interface AuthContainerProps {
  authMode: "signup" | "login";
}

export function AuthContainer({ authMode: initialAuthMode }: AuthContainerProps) {
  const navigate = useNavigate();
  const authForm = useAuthForm();

  // Sync initial auth mode
  if (authForm.authMode !== initialAuthMode) {
    authForm.setAuthMode(initialAuthMode);
  }

  return (
    <>
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
            {authForm.authMode === "signup" ? "Create your account" : "Sign in"} to continue.
          </CardDescription>
        </CardHeader>

        <PasswordAuthForm
          email={authForm.email}
          setEmail={authForm.setEmail}
          password={authForm.password}
          setPassword={authForm.setPassword}
          confirmPassword={authForm.confirmPassword}
          setConfirmPassword={authForm.setConfirmPassword}
          authMode={authForm.authMode}
          setAuthMode={authForm.setAuthMode}
          isLoading={authForm.isSubmitting}
          touched={authForm.touched}
          setTouched={authForm.setTouched}
          isValidEmail={authForm.isValidEmail}
          error={authForm.error}
          onSubmit={authForm.handlePasswordSubmit}
          onGoogleLogin={authForm.handleGoogleLogin}
          onGuestLogin={authForm.handleGuestLogin}
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

      {/* Guest Tier Selection Dialog */}
      <GuestTierDialog
        open={authForm.guestDialogOpen}
        onOpenChange={authForm.setGuestDialogOpen}
        guestTier={authForm.guestTier}
        setGuestTier={authForm.setGuestTier}
        isLoading={authForm.isSubmitting}
        error={authForm.error}
        onConfirm={authForm.handleConfirmGuest}
      />
    </>
  );
}
