import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sparkles, Calendar, Mail, Share2, BarChart3, Plus } from "lucide-react";
import { toast } from "sonner";
import { CapsuleWizardStep1 } from "./capsule/CapsuleWizardStep1";
import { CapsuleLibrary } from "./capsule/CapsuleLibrary";
import { CapsuleAnalytics } from "./capsule/CapsuleAnalytics";
import { CapsuleSocialPreview } from "./capsule/CapsuleSocialPreview";
import { CapsuleEmailPreview } from "./capsule/CapsuleEmailPreview";
import { Id } from "@/convex/_generated/dataModel";

export default function ContentCapsule() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("professional");
  const [platforms, setPlatforms] = useState<Array<"twitter" | "linkedin" | "facebook">>([]);
  const [generating, setGenerating] = useState(false);
  
  // Mock capsule content state
  const [capsule, setCapsule] = useState({
    tweets: ["", "", ""],
    linkedinPost: "",
    facebookPost: "",
  });
  
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const capsules = useQuery(api.contentCapsules.list);
  const deleteCapsule = useMutation(api.contentCapsules.remove);
  const generateCapsule = useMutation(api.contentCapsules.generate);

  const togglePlatform = (platform: "twitter" | "linkedin" | "facebook") => {
    setPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handleGenerate = async () => {
    if (!topic || platforms.length === 0) return;
    
    setGenerating(true);
    try {
      await generateCapsule({ topic, tone });
      toast.success("Content capsule generated!");
      setWizardOpen(false);
      setTopic("");
      setPlatforms([]);
    } catch (error) {
      toast.error("Failed to generate capsule");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (capsuleId: Id<"contentCapsules">) => {
    try {
      await deleteCapsule({ capsuleId });
      toast.success("Capsule deleted");
    } catch (error) {
      toast.error("Failed to delete capsule");
    }
  };

  const handleCopy = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  // Mock analytics data
  const analytics = {
    totalCapsules: capsules?.length || 0,
    published: capsules?.filter((c: any) => c.status === "published").length || 0,
    scheduled: capsules?.filter((c: any) => c.status === "scheduled").length || 0,
    drafts: capsules?.filter((c: any) => c.status === "draft").length || 0,
  };

  const engagement = {
    totalImpressions: 12500,
    totalEngagements: 850,
    avgEngagementRate: 6.8,
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <CardTitle>Content Capsules</CardTitle>
            <Badge variant="secondary">AI-Powered</Badge>
          </div>
          <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Capsule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Content Capsule</DialogTitle>
              </DialogHeader>
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
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="library" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="library">
              <Calendar className="h-4 w-4 mr-2" />
              Library
            </TabsTrigger>
            <TabsTrigger value="social">
              <Share2 className="h-4 w-4 mr-2" />
              Social
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="h-4 w-4 mr-2" />
              Email
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library">
            <CapsuleLibrary capsules={capsules} onDelete={handleDelete} />
          </TabsContent>

          <TabsContent value="social">
            <CapsuleSocialPreview
              capsule={capsule}
              setCapsule={setCapsule}
              platforms={platforms}
              onCopy={handleCopy}
            />
          </TabsContent>

          <TabsContent value="email">
            <CapsuleEmailPreview
              emailSubject={emailSubject}
              emailBody={emailBody}
              onSubjectChange={setEmailSubject}
              onBodyChange={setEmailBody}
              onCopy={handleCopy}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <CapsuleAnalytics analytics={analytics} engagement={engagement} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}