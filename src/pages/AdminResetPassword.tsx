import React, { useState, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router";
import { Brain } from "lucide-react";

export default function AdminResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const resetPassword = useAction(api.adminPasswordReset.resetPassword);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      toast.error("Invalid reset link");
      navigate("/admin-auth");
    } else {
      setResetToken(token);
    }
  }, [searchParams, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (!resetToken) {
      toast.error("Invalid reset token");
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword({ resetToken, newPassword: password });
      toast.success("Password reset successfully");
      navigate("/admin-auth");
    } catch (error: any) {
      toast.error(error?.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  if (!resetToken) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-emerald-50 to-emerald-100">
      <Card className="w-full max-w-md bg-emerald-800 text-emerald-50 neu-raised rounded-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Brain className="h-12 w-12 text-emerald-200" />
          </div>
          <CardTitle className="text-2xl font-bold text-emerald-50">
            Set New Password
          </CardTitle>
          <p className="text-sm text-emerald-200">
            Enter your new password below
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-emerald-100">
                New Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="bg-emerald-700 border-emerald-600 text-emerald-50 placeholder:text-emerald-300"
                placeholder="At least 8 characters"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-emerald-100">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="bg-emerald-700 border-emerald-600 text-emerald-50 placeholder:text-emerald-300"
                placeholder="Re-enter password"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white hover:bg-emerald-50 text-emerald-700 shadow border border-emerald-200"
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>

          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => navigate("/admin-auth")}
              className="text-emerald-300 hover:text-emerald-200 hover:bg-emerald-700"
            >
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
