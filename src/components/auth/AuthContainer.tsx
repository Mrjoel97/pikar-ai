import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Sparkles } from "lucide-react";
import { useNavigate } from "react-router";
import { GuestTierDialog } from "@/components/auth/GuestTierDialog";
import { useAuthForm } from "@/hooks/use-auth-form";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

export function AuthContainer() {
  const authForm = useAuthForm();
  const navigate = useNavigate();

  return (
    <>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="w-full shadow-2xl rounded-2xl border-0 bg-white overflow-hidden">
          <CardHeader className="text-center bg-gradient-to-br from-emerald-50 to-white pb-8">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center"
            >
              <div className="relative">
                <Brain
                  className="h-16 w-16 rounded-xl mb-4 cursor-pointer bg-emerald-600 p-3 text-white shadow-lg"
                  onClick={() => navigate("/")}
                />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-1 -right-1"
                >
                  <Sparkles className="h-6 w-6 text-yellow-400" />
                </motion.div>
              </div>
            </motion.div>
            <CardTitle className="text-2xl text-gray-900 font-bold">
              {authForm.authMode === "signup" ? "Create Your Account" : "Welcome Back"}
            </CardTitle>
            <CardDescription className="text-gray-600 text-base">
              {authForm.authMode === "signup" 
                ? "Start automating your business in 60 seconds" 
                : "Sign in to continue your automation journey"}
            </CardDescription>
          </CardHeader>

          <div className="p-6 space-y-4">
            {/* Google Sign-In Button */}
            <Button
              onClick={authForm.handleGoogleLogin}
              disabled={authForm.isSubmitting}
              className="w-full h-12 rounded-xl bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 hover:border-emerald-500 transition-all shadow-sm font-semibold"
              variant="outline"
            >
              <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="relative">
              <Separator className="bg-gray-200" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-gray-500 font-medium">
                or explore as guest
              </span>
            </div>

            {/* Guest Sign-In Button */}
            <Button
              onClick={authForm.handleGuestLogin}
              disabled={authForm.isSubmitting}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg hover:shadow-xl transition-all font-semibold"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Try Free as Guest - No Signup Required
            </Button>

            {/* Benefits List */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Full access to all features</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Toggle between Sign In and Sign Up */}
          <div className="py-4 px-6 text-sm text-center border-t border-gray-100 bg-gray-50">
            {authForm.authMode === "signup" ? (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => authForm.setAuthMode("login")}
                  className="text-emerald-600 font-semibold hover:text-emerald-700 transition-colors underline"
                >
                  Sign In
                </button>
              </>
            ) : (
              <>
                Don't have an account?{" "}
                <button
                  onClick={() => authForm.setAuthMode("signup")}
                  className="text-emerald-600 font-semibold hover:text-emerald-700 transition-colors underline"
                >
                  Sign Up Free
                </button>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="py-3 px-6 text-xs text-center bg-gray-50 border-t border-gray-100 text-gray-500">
            Secured by{" "}
            <a
              href="https://vly.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-emerald-600 transition-colors font-medium"
            >
              vly.ai
            </a>
            {" • "}
            <a href="/privacy" className="underline hover:text-emerald-600 transition-colors">
              Privacy
            </a>
            {" • "}
            <a href="/terms" className="underline hover:text-emerald-600 transition-colors">
              Terms
            </a>
          </div>
        </Card>
      </motion.div>

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