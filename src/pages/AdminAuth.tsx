import React, { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { Brain } from "lucide-react";

export default function AdminAuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const signUpAction = useAction(api.adminAuth.signUp);
  const loginAction = useAction(api.adminAuth.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const result = await loginAction({ email, password });
        localStorage.setItem("adminSessionToken", result.token);
        toast.success("Logged in successfully");
        navigate("/admin");
      } else {
        await signUpAction({ email, password });
        // Auto-login after signup
        const loginResult = await loginAction({ email, password });
        localStorage.setItem("adminSessionToken", loginResult.token);
        toast.success("Account created and logged in successfully");
        navigate("/admin");
      }
    } catch (error: any) {
      toast.error(error?.message || "Authentication failed");
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
            Admin Portal
          </CardTitle>
          <p className="text-sm text-emerald-200">
            {isLogin ? "Sign in to your admin account" : "Create a new admin account"}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
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

            <div className="space-y-2">
              <Label htmlFor="password" className="text-emerald-100">
                Password
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

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white hover:bg-emerald-50 text-emerald-700 shadow border border-emerald-200"
            >
              {isLoading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <Separator className="bg-emerald-600" />

          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => setIsLogin(!isLogin)}
              className="text-emerald-200 hover:text-emerald-100 hover:bg-emerald-700"
            >
              {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </Button>
          </div>

          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="text-emerald-300 hover:text-emerald-200 hover:bg-emerald-700"
            >
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
