import React from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Sparkles, Calendar, Save, Send, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { CapsuleWizardStep1 } from "./capsule/CapsuleWizardStep1";
import { CapsuleSocialPreview } from "./capsule/CapsuleSocialPreview";
import { CapsuleEmailPreview } from "./capsule/CapsuleEmailPreview";
import { CapsuleLibrary } from "./capsule/CapsuleLibrary";
import { CapsuleAnalytics } from "./capsule/CapsuleAnalytics";

interface ContentCapsuleProps {
  businessId: Id<"businesses">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CapsuleContent {
  weeklyPost: string;
  emailSubject: string;
  emailBody: string;
  tweets: string[];
  linkedinPost: string;
  facebookPost: string;
}

export function ContentCapsule({ businessId, open, onOpenChange }: ContentCapsuleProps) {
  const generateCapsuleAI = useAction(api.contentCapsules.generateContentCapsule);
  const saveCapsule = useMutation(api.contentCapsulesData.saveContentCapsule);
  const publishCapsule = useAction(api.contentCapsules.publishContentCapsule);
  const deleteCapsule = useMutation(api.contentCapsulesData.deleteContentCapsule);
  
  const capsules = useQuery(api.contentCapsulesData.listContentCapsules, { businessId });
  const analytics = useQuery(api.contentCapsulesData.getCapsuleAnalytics, { businessId });
  const engagement = useQuery(api.socialPosts.getAggregatedEngagement, { businessId, days: 30 });

  const [activeTab, setActiveTab] = React.useState<"wizard" | "library" | "analytics">("wizard");
  const [step, setStep] = React.useState(1);
  const [generating, setGenerating] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);

  // Form state
  const [title, setTitle] = React.useState("");
  const [topic, setTopic] = React.useState("");
  const [tone, setTone] = React.useState("professional");
  const [platforms, setPlatforms] = React.useState<Array<"twitter" | "linkedin" | "facebook">>([]);
  const [scheduledDate, setScheduledDate] = React.useState("");
  const [scheduledTime, setScheduledTime] = React.useState("");
  const [currentCapsuleId, setCurrentCapsuleId] = React.useState<Id<"contentCapsules"> | null>(null);

  const [capsule, setCapsule] = React.useState<CapsuleContent>({
    weeklyPost: "",
    emailSubject: "",
    emailBody: "",
    tweets: ["", "", ""],
    linkedinPost: "",
    facebookPost: "",
  });

  const handleGenerate = async () => {
    if (!topic || platforms.length === 0) {
      toast.error("Please enter a topic and select at least one platform");
      return;
    }

    setGenerating(true);
    try {
      const result = await generateCapsuleAI({
        businessId,
        topic,
        tone,
        platforms,
      });
      setCapsule(result);
      setStep(2);
      toast.success("Content capsule generated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate content");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!title) {
      toast.error("Please enter a title for this capsule");
      return;
    }

    setSaving(true);
    try {
      const scheduledAt = scheduledDate && scheduledTime
        ? new Date(`${scheduledDate}T${scheduledTime}`).getTime()
        : undefined;

      const capsuleId = await saveCapsule({
        businessId,
        title,
        content: capsule,
        platforms,
        scheduledAt,
        status: scheduledAt ? "scheduled" : "draft",
      });

      setCurrentCapsuleId(capsuleId);
      toast.success("Content capsule saved!");
      setStep(3);
    } catch (error: any) {
      toast.error(error.message || "Failed to save capsule");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!currentCapsuleId) {
      toast.error("Please save the capsule first");
      return;
    }

    setPublishing(true);
    try {
      await publishCapsule({ capsuleId: currentCapsuleId });
      toast.success("Content capsule published!");
      handleReset();
    } catch (error: any) {
      toast.error(error.message || "Failed to publish capsule");
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async (capsuleId: Id<"contentCapsules">) => {
    try {
      await deleteCapsule({ capsuleId });
      toast.success("Content capsule deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete capsule");
    }
  };

  const handleCopy = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  const handleReset = () => {
    setStep(1);
    setTitle("");
    setTopic("");
    setTone("professional");
    setPlatforms([]);
    setScheduledDate("");
    setScheduledTime("");
    setCurrentCapsuleId(null);
    setCapsule({
      weeklyPost: "",
      emailSubject: "",
      emailBody: "",
      tweets: ["", "", ""],
      linkedinPost: "",
      facebookPost: "",
    });
  };

  const togglePlatform = (platform: "twitter" | "linkedin" | "facebook") => {
    setPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            Content Capsule Studio
          </DialogTitle>
          <DialogDescription>
            AI-powered content generation for all your social platforms
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="wizard">
              <Sparkles className="h-4 w-4 mr-2" />
              Create
            </TabsTrigger>
            <TabsTrigger value="library">
              <Save className="h-4 w-4 mr-2" />
              Library ({capsules?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Wizard Tab */}
          <TabsContent value="wizard" className="space-y-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-4 mb-6">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                      step >= s
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`w-16 h-1 ${
                        step > s ? "bg-emerald-600" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Configuration */}
            {step === 1 && (
              <CapsuleWizardStep1
                topic={topic}
                setTopic={setTopic}
                tone={tone}
                setTone={setTone}
                platforms={platforms}
                togglePlatform={togglePlatform}
                generating={generating}
                onGenerate={handleGenerate}
              />
            )}

            {/* Step 2: Preview & Edit */}
            {step === 2 && capsule.weeklyPost && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Preview & Edit Content</h3>
                  <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                    Back
                  </Button>
                </div>

                <Tabs defaultValue="social" className="w-full">
                  <TabsList>
                    <TabsTrigger value="social">Social Posts</TabsTrigger>
                    <TabsTrigger value="email">Email</TabsTrigger>
                  </TabsList>

                  <TabsContent value="social" className="space-y-4">
                    <CapsuleSocialPreview
                      capsule={capsule}
                      setCapsule={setCapsule}
                      platforms={platforms}
                      onCopy={handleCopy}
                    />
                  </TabsContent>

                  <TabsContent value="email" className="space-y-4">
                    <CapsuleEmailPreview
                      emailSubject={capsule.emailSubject}
                      emailBody={capsule.emailBody}
                      onSubjectChange={(subject) =>
                        setCapsule({ ...capsule, emailSubject: subject })
                      }
                      onBodyChange={(body) =>
                        setCapsule({ ...capsule, emailBody: body })
                      }
                      onCopy={handleCopy}
                    />
                  </TabsContent>
                </Tabs>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Save & Schedule</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title">Capsule Title</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Weekly Productivity Tips - Jan 2024"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date">Schedule Date (Optional)</Label>
                        <Input
                          id="date"
                          type="date"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="time">Schedule Time</Label>
                        <Input
                          id="time"
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          disabled={!scheduledDate}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleSave}
                        disabled={saving || !title}
                        className="flex-1"
                      >
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4" />
                        Save Capsule
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Publish */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <Card className="border-emerald-200 bg-emerald-50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-emerald-600" />
                      Content Capsule Saved!
                    </CardTitle>
                    <CardDescription>
                      Your content is ready to publish
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {platforms.length} platform{platforms.length > 1 ? "s" : ""}
                      </Badge>
                      {scheduledDate && (
                        <Badge variant="outline">
                          <Calendar className="h-3 w-3 mr-1" />
                          Scheduled
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handlePublish}
                        disabled={publishing}
                        className="flex-1"
                      >
                        {publishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Send className="mr-2 h-4 w-4" />
                        {scheduledDate ? "Schedule Posts" : "Publish Now"}
                      </Button>
                      <Button variant="outline" onClick={handleReset}>
                        Create Another
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          {/* Library Tab */}
          <TabsContent value="library" className="space-y-4">
            <CapsuleLibrary capsules={capsules} onDelete={handleDelete} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <CapsuleAnalytics analytics={analytics} engagement={engagement} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}