import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mail, Lock, Loader2, UserX } from "lucide-react";

interface PasswordAuthFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  isLoading: boolean;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onTogglePassword: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onForgotPassword: () => void;
}

export function PasswordAuthForm({
  email,
  setEmail,
  password,
  setPassword,
  isLoading,
  onSubmit,
  onForgotPassword,
}: PasswordAuthFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
          />
        </div>
        
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            name="password"
            placeholder="Enter your password"
            type="password"
            className="h-10 w-full pl-9 neu-inset rounded-xl bg-white text-slate-900 placeholder:text-slate-500"
            disabled={isLoading}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>

        <Button
          type="button"
          variant="link"
          className="w-full text-sm"
          onClick={onForgotPassword}
          disabled={isLoading}
        >
          Forgot password?
        </Button>
      </CardContent>
    </form>
  );
}