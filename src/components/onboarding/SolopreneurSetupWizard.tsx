import { useState, useEffect } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  Building2, 
  Palette, 
  Share2, 
  Mail, 
  Bot, 
  FileText,
  ArrowRight,
  ArrowLeft,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

interface SolopreneurSetupWizardProps {
  open: boolean;
  onClose: () => void;
  userId: Id<"users">;
  businessId: Id<"businesses">;
}

export function SolopreneurSetupWizard({
  open,
  onClose,
  userId,
  businessId,
}: SolopreneurSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const setupProgress = useQuery(api.setupWizardData.getSetupProgress, { businessId });
  const initializeSetup = useMutation(api.setupWizardData.initializeSetup);
  const completeStep = useMutation(api.setupWizardData.completeStep);
  const updateSetupData = useMutation(api.setupWizardData.updateSetupData);
  const generateContent = useAction(api.setupWizard.generateDefaultContent);
  const skipSetup = useMutation(api.setupWizardData.skipSetup);

  // Initialize setup on mount
  useEffect(() => {
    if (open && businessId && userId) {
      initializeSetup({ businessId, userId }).catch((err) => {
        console.error("Failed to initialize setup:", err);
      });
    }
  }, [open, businessId, userId]);

  const steps = setupProgress?.steps || [
    { id: "business-profile", title: "Business Profile", completed: false },
    { id: "brand-identity", title: "Brand Identity", completed: false },
    { id: "social-media", title: "Social Media", completed: false },
    { id: "email-setup", title: "Email Setup", completed: false },
    { id: "ai-agent", title: "AI Agent", completed: false },
    { id: "templates", title: "Template Selection", completed: false },
    { id: "review", title: "Review & Launch", completed: false },
  ];

  const progress = setupProgress?.progress || 0;
  const currentStepData = steps[currentStep];

  const handleNext = async () => {
    if (!setupProgress?._id) {
      toast.error("Setup not initialized");
      return;
    }

    try {
      const result = await completeStep({
        setupId: setupProgress._id,
        stepId: currentStepData.id,
        stepData: formData[currentStepData.id] || {},
      });

      if (result.allCompleted) {
        toast.success("Setup completed! 🎉");
        onClose();
      } else if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
        toast.success("Step completed!");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to complete step");
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    if (!setupProgress?._id) return;
    
    try {
      await skipSetup({ setupId: setupProgress._id });
      toast.info("Setup skipped. You can complete it later from settings.");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to skip setup");
    }
  };

  const handleGenerateContent = async (contentType: "bio" | "tagline" | "mission" | "social-post") => {
    setIsGenerating(true);
    try {
      const result = await generateContent({
        businessId,
        contentType,
        context: {
          businessName: formData["business-profile"]?.name,
          industry: formData["business-profile"]?.industry,
          targetAudience: formData["business-profile"]?.targetAudience,
        },
      });

      setFormData({
        ...formData,
        [currentStepData.id]: {
          ...formData[currentStepData.id],
          [contentType]: result.content,
        },
      });

      toast.success("Content generated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate content");
    } finally {
      setIsGenerating(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData({
      ...formData,
      [currentStepData.id]: {
        ...formData[currentStepData.id],
        [field]: value,
      },
    });
  };

  const renderStepContent = () => {
    const stepId = currentStepData.id;
    const data = formData[stepId] || {};

    switch (stepId) {
      case "business-profile":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-semibold">Tell us about your business</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="name">Business Name</Label>
                <Input
                  id="name"
                  value={data.name || ""}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Acme Inc."
                />
              </div>

              <div>
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={data.industry || ""}
                  onChange={(e) => updateField("industry", e.target.value)}
                  placeholder="Technology, Marketing, etc."
                />
              </div>

              <div>
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Input
                  id="targetAudience"
                  value={data.targetAudience || ""}
                  onChange={(e) => updateField("targetAudience", e.target.value)}
                  placeholder="Small businesses, Entrepreneurs, etc."
                />
              </div>

              <div>
                <Label htmlFor="description">Business Description</Label>
                <Textarea
                  id="description"
                  value={data.description || ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="What does your business do?"
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case "brand-identity":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-semibold">Define your brand identity</h3>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerateContent("tagline")}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    <span className="ml-1">Generate</span>
                  </Button>
                </div>
                <Input
                  id="tagline"
                  value={data.tagline || ""}
                  onChange={(e) => updateField("tagline", e.target.value)}
                  placeholder="Your catchy tagline"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="mission">Mission Statement</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerateContent("mission")}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    <span className="ml-1">Generate</span>
                  </Button>
                </div>
                <Textarea
                  id="mission"
                  value={data.mission || ""}
                  onChange={(e) => updateField("mission", e.target.value)}
                  placeholder="Your mission statement"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="brandColors">Brand Colors (comma-separated)</Label>
                <Input
                  id="brandColors"
                  value={data.brandColors || ""}
                  onChange={(e) => updateField("brandColors", e.target.value)}
                  placeholder="#10B981, #059669, #047857"
                />
              </div>

              <div>
                <Label htmlFor="brandVoice">Brand Voice</Label>
                <Input
                  id="brandVoice"
                  value={data.brandVoice || ""}
                  onChange={(e) => updateField("brandVoice", e.target.value)}
                  placeholder="Professional, Friendly, Casual, etc."
                />
              </div>
            </div>
          </div>
        );

      case "social-media":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Share2 className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-semibold">Connect your social media</h3>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Connect your social media accounts to start posting and tracking engagement.
            </p>

            <div className="space-y-3">
              {["LinkedIn", "Twitter", "Facebook", "Instagram"].map((platform) => (
                <Card key={platform}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Share2 className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{platform}</h4>
                        <p className="text-xs text-muted-foreground">
                          {data[platform.toLowerCase()] ? "Connected" : "Not connected"}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={data[platform.toLowerCase()] ? "outline" : "default"}
                      onClick={() => updateField(platform.toLowerCase(), !data[platform.toLowerCase()])}
                    >
                      {data[platform.toLowerCase()] ? "Disconnect" : "Connect"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case "email-setup":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-semibold">Configure email settings</h3>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="senderName">Sender Name</Label>
                <Input
                  id="senderName"
                  value={data.senderName || ""}
                  onChange={(e) => updateField("senderName", e.target.value)}
                  placeholder="Your Name or Business Name"
                />
              </div>

              <div>
                <Label htmlFor="senderEmail">Sender Email</Label>
                <Input
                  id="senderEmail"
                  type="email"
                  value={data.senderEmail || ""}
                  onChange={(e) => updateField("senderEmail", e.target.value)}
                  placeholder="hello@yourbusiness.com"
                />
              </div>

              <div>
                <Label htmlFor="replyTo">Reply-To Email</Label>
                <Input
                  id="replyTo"
                  type="email"
                  value={data.replyTo || ""}
                  onChange={(e) => updateField("replyTo", e.target.value)}
                  placeholder="support@yourbusiness.com"
                />
              </div>

              <Card className="bg-blue-50">
                <CardContent className="p-4">
                  <p className="text-sm">
                    💡 <strong>Tip:</strong> Use a professional email address to improve deliverability and build trust with your audience.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case "ai-agent":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Bot className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-semibold">Configure your AI agent</h3>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="agentName">Agent Name</Label>
                <Input
                  id="agentName"
                  value={data.agentName || ""}
                  onChange={(e) => updateField("agentName", e.target.value)}
                  placeholder="My Assistant"
                />
              </div>

              <div>
                <Label htmlFor="agentPersonality">Agent Personality</Label>
                <Input
                  id="agentPersonality"
                  value={data.agentPersonality || ""}
                  onChange={(e) => updateField("agentPersonality", e.target.value)}
                  placeholder="Professional, Helpful, Friendly"
                />
              </div>

              <div>
                <Label>Agent Capabilities</Label>
                <div className="space-y-2 mt-2">
                  {[
                    { id: "content", label: "Content Generation" },
                    { id: "scheduling", label: "Smart Scheduling" },
                    { id: "analytics", label: "Analytics Insights" },
                    { id: "support", label: "Customer Support" },
                  ].map((capability) => (
                    <label key={capability.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.capabilities?.[capability.id] || false}
                        onChange={(e) => updateField("capabilities", {
                          ...data.capabilities,
                          [capability.id]: e.target.checked,
                        })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{capability.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "templates":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-semibold">Choose your templates</h3>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Select templates to get started quickly with pre-built workflows.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "social-posting", name: "Social Media Posting", icon: Share2 },
                { id: "email-campaign", name: "Email Campaigns", icon: Mail },
                { id: "content-creation", name: "Content Creation", icon: FileText },
                { id: "customer-support", name: "Customer Support", icon: Bot },
              ].map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all ${
                    data.selectedTemplates?.includes(template.id)
                      ? "border-emerald-600 bg-emerald-50"
                      : ""
                  }`}
                  onClick={() => {
                    const selected = data.selectedTemplates || [];
                    const newSelected = selected.includes(template.id)
                      ? selected.filter((t: string) => t !== template.id)
                      : [...selected, template.id];
                    updateField("selectedTemplates", newSelected);
                  }}
                >
                  <CardContent className="p-4 text-center">
                    <template.icon className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
                    <h4 className="font-medium text-sm">{template.name}</h4>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case "review":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-semibold">Review & Launch</h3>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              You're all set! Review your setup and launch your workspace.
            </p>

            <div className="space-y-3">
              {Object.entries(formData).map(([stepId, stepData]) => {
                const step = steps.find((s: any) => s.id === stepId);
                if (!step || !stepData || Object.keys(stepData).length === 0) return null;

                return (
                  <Card key={stepId}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">{step.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-muted-foreground space-y-1">
                        {Object.entries(stepData).map(([key, value]) => (
                          <div key={key}>
                            <strong className="capitalize">{key.replace(/([A-Z])/g, " $1")}:</strong>{" "}
                            {typeof value === "object" ? JSON.stringify(value) : String(value).substring(0, 50)}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="bg-emerald-50 border-emerald-200">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-emerald-900">
                  🎉 Ready to launch! Click "Complete" to start using Pikar AI.
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Setup Wizard</DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              <X className="h-4 w-4 mr-1" />
              Skip for now
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Progress</span>
              <span className="text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Steps Indicator */}
          <div className="flex justify-between overflow-x-auto pb-2">
            {steps.map((step: any, index: number) => (
              <div key={step.id} className="flex flex-col items-center gap-1 min-w-[80px]">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    index === currentStep
                      ? "bg-emerald-600 text-white"
                      : step.completed
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {step.completed ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                </div>
                <span className="text-xs text-center leading-tight">{step.title}</span>
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="min-h-[300px] py-4">{renderStepContent()}</div>

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button onClick={handleNext}>
              {currentStep === steps.length - 1 ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Complete
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
