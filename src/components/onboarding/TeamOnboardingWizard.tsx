import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

interface TeamOnboardingWizardProps {
  open: boolean;
  onClose: () => void;
  userId: Id<"users">;
  businessId: Id<"businesses">;
}

export function TeamOnboardingWizard({
  open,
  onClose,
  userId,
  businessId,
}: TeamOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState<"admin" | "editor" | "viewer" | "custom">("viewer");

  const onboarding = useQuery(api.teamOnboarding.getUserOnboarding, { userId, businessId });
  const completeStep = useMutation(api.teamOnboarding.completeOnboardingStep);

  const steps = onboarding?.steps || [
    { id: "welcome", title: "Welcome", description: "Get started with your team", completed: false },
    { id: "role", title: "Select Role", description: "Choose your role", completed: false },
    { id: "permissions", title: "Review Permissions", description: "Confirm your access", completed: false },
    { id: "first-task", title: "First Task", description: "Complete your first action", completed: false },
  ];

  const progress = (steps.filter((s: any) => s.completed).length / steps.length) * 100;

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      try {
        await completeStep({
          userId,
          businessId,
          stepId: steps[currentStep].id,
        });
        setCurrentStep(currentStep + 1);
        toast.success("Step completed!");
      } catch (error: any) {
        toast.error(error.message || "Failed to complete step");
      }
    } else {
      toast.success("Onboarding completed!");
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    const step = steps[currentStep];

    switch (step.id) {
      case "welcome":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Welcome to the Team!</h3>
            <p className="text-muted-foreground">
              We're excited to have you on board. This quick wizard will help you get set up and ready to contribute.
            </p>
            <div className="bg-emerald-50 p-4 rounded-lg">
              <p className="text-sm">
                <strong>Estimated time:</strong> 5 minutes
              </p>
            </div>
          </div>
        );

      case "role":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select Your Role</h3>
            <p className="text-muted-foreground">Choose the role that best fits your responsibilities:</p>
            <div className="grid grid-cols-2 gap-3">
              {(["admin", "editor", "viewer", "custom"] as const).map((role) => (
                <Card
                  key={role}
                  className={`cursor-pointer transition-all ${
                    selectedRole === role ? "border-emerald-600 bg-emerald-50" : ""
                  }`}
                  onClick={() => setSelectedRole(role)}
                >
                  <CardContent className="p-4">
                    <h4 className="font-medium capitalize">{role}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {role === "admin" && "Full access to all features"}
                      {role === "editor" && "Can edit and approve content"}
                      {role === "viewer" && "Read-only access"}
                      {role === "custom" && "Customized permissions"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case "permissions":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Review Your Permissions</h3>
            <p className="text-muted-foreground">
              As a <strong className="capitalize">{selectedRole}</strong>, you will have:
            </p>
            <div className="space-y-2">
              {[
                { label: "View Analytics", enabled: true },
                { label: "Edit Content", enabled: selectedRole !== "viewer" },
                { label: "Approve Workflows", enabled: selectedRole === "admin" || selectedRole === "editor" },
                { label: "Manage Team", enabled: selectedRole === "admin" },
                { label: "Manage Settings", enabled: selectedRole === "admin" },
              ].map((perm) => (
                <div key={perm.label} className="flex items-center gap-2">
                  {perm.enabled ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300" />
                  )}
                  <span className={perm.enabled ? "" : "text-muted-foreground"}>{perm.label}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case "first-task":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Complete Your First Task</h3>
            <p className="text-muted-foreground">
              Great! You're all set up. Here's a quick task to get you started:
            </p>
            <Card className="bg-blue-50">
              <CardContent className="p-4">
                <h4 className="font-medium">Explore the Dashboard</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Take a moment to familiarize yourself with the main dashboard and its features.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Team Onboarding</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Steps Indicator */}
          <div className="flex justify-between">
            {steps.map((step: any, index: number) => (
              <div key={step.id} className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index === currentStep
                      ? "bg-emerald-600 text-white"
                      : step.completed
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {step.completed ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                </div>
                <span className="text-xs text-center">{step.title}</span>
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="min-h-[200px]">{renderStepContent()}</div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
              Back
            </Button>
            <Button onClick={handleNext}>
              {currentStep === steps.length - 1 ? "Complete" : "Next"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
