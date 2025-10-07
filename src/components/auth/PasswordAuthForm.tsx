import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mail, Lock, Loader2, UserX } from "lucide-react";

interface PasswordAuthFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (password: string) => void;
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

export function PasswordAuthForm({
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
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
}: PasswordAuthFormProps) {
  return (
    <form onSubmit={onSubmit}>
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
