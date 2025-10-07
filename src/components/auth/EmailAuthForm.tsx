import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mail, Loader2, ArrowRight, UserX } from "lucide-react";

interface EmailAuthFormProps {
  email: string;
  setEmail: (email: string) => void;
  authMode: "signup" | "login";
  setAuthMode: (mode: "signup" | "login") => void;
  isLoading: boolean;
  touched: boolean;
  setTouched: (touched: boolean) => void;
  isValidEmail: boolean;
  error: string | null;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleLogin: () => void;
  onGuestLogin: () => void;
}

export function EmailAuthForm({
  email,
  setEmail,
  authMode,
  setAuthMode,
  isLoading,
  touched,
  setTouched,
  isValidEmail,
  error,
  onSubmit,
  onGoogleLogin,
  onGuestLogin,
}: EmailAuthFormProps) {
  return (
    <form onSubmit={onSubmit}>
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
            onClick={onGoogleLogin}
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
            onClick={onGuestLogin}
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
  );
}
