import React from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Copy, Loader2, Sparkles } from "lucide-react";

interface ContentCapsuleProps {
  businessId: Id<"businesses">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Capsule {
  weeklyPost: string;
  emailSubject: string;
  emailBody: string;
  tweets: string[];
}

export function ContentCapsule({ businessId, open, onOpenChange }: ContentCapsuleProps) {
  const generateCapsuleAI = useAction(api.solopreneur.generateContentCapsule);
  const agentProfile = useQuery(api.agentProfile.getMyAgentProfile, { businessId });
  const quickAnalytics = useQuery(api.solopreneur.runQuickAnalytics, { businessId });

  const [capsule, setCapsule] = React.useState<Capsule>({
    weeklyPost: "",
    emailSubject: "",
    emailBody: "",
    tweets: ["", "", ""],
  });
  const [generating, setGenerating] = React.useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generateCapsuleAI({
        businessId,
        agentProfile: agentProfile ? {
          tone: agentProfile.tone,
          persona: agentProfile.persona,
          cadence: agentProfile.cadence,
        } : undefined,
        analyticsContext: quickAnalytics ? {
          revenue90d: quickAnalytics.revenue90d,
          churnAlert: quickAnalytics.churnAlert,
          topProducts: quickAnalytics.topProducts,
        } : undefined,
      });
      setCapsule(result as Capsule);
      toast.success("Content capsule generated!");
    } catch (error) {
      toast.error("Failed to generate content. Using fallback.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Content Capsule Generator
          </DialogTitle>
          <DialogDescription>
            AI-powered content package: weekly post, email, and 3 tweets
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button onClick={handleGenerate} disabled={generating} className="w-full">
            {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Content Capsule
          </Button>

          {capsule.weeklyPost && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Weekly Post</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={capsule.weeklyPost}
                    onChange={(e) => setCapsule({ ...capsule, weeklyPost: e.target.value })}
                    rows={6}
                    className="mb-2"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(capsule.weeklyPost, "Copied weekly post")}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Email</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs font-medium">Subject</label>
                    <Textarea
                      value={capsule.emailSubject}
                      onChange={(e) => setCapsule({ ...capsule, emailSubject: e.target.value })}
                      rows={2}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Body</label>
                    <Textarea
                      value={capsule.emailBody}
                      onChange={(e) => setCapsule({ ...capsule, emailBody: e.target.value })}
                      rows={6}
                      className="mt-1"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(`${capsule.emailSubject}\n\n${capsule.emailBody}`, "Copied email")}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Email
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Tweet Variants</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {capsule.tweets.map((tweet, i) => (
                    <div key={i}>
                      <label className="text-xs font-medium">Tweet {i + 1}</label>
                      <Textarea
                        value={tweet}
                        onChange={(e) => {
                          const newTweets = [...capsule.tweets];
                          newTweets[i] = e.target.value;
                          setCapsule({ ...capsule, tweets: newTweets });
                        }}
                        rows={3}
                        className="mt-1"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(tweet, `Copied tweet ${i + 1}`)}
                        className="mt-2"
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
