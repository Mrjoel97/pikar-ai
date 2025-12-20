import React, { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { Brain, ArrowLeft } from "lucide-react";

export default function AdminForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const requestReset = useAction(api.adminPasswordReset.requestPasswordReset);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await requestReset({ email });
      setResetSent(true);
      toast.success("Password reset instructions sent to your email");
    } catch (error: any) {
      toast.error(error?.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-emerald-50 to-emerald-100">
      <Card className="w-full max-w-md bg-emerald-800 text-emerald-50 neu-raised rounded-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Brain className="h-12 w-12 text-emerald-200" />
          </div>
          <CardTitle className="text-2xl font-bold text-emerald-50">
            Reset Admin Password
          </CardTitle>
          <p className="text-sm text-emerald-200">
            {resetSent
              ? "Check your email for reset instructions"
              : "Enter your email to receive reset instructions"}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {!resetSent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-emerald-100">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-emerald-700 border-emerald-600 text-emerald-50 placeholder:text-emerald-300"
                  placeholder="admin@example.com"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-white hover:bg-emerald-50 text-emerald-700 shadow border border-emerald-200"
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-emerald-700 border border-emerald-600">
                <p className="text-sm text-emerald-100">
                  If an account exists with this email, you will receive password reset
                  instructions shortly.
                </p>
              </div>
              <Button
                onClick={() => navigate("/admin-auth")}
                className="w-full bg-white hover:bg-emerald-50 text-emerald-700 shadow border border-emerald-200"
              >
                Back to Login
              </Button>
            </div>
          )}

          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => navigate("/admin-auth")}
              className="text-emerald-200 hover:text-emerald-100 hover:bg-emerald-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
