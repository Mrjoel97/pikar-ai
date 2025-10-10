import React from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Loader2, Mail } from "lucide-react";

export function SupportTriage() {
  const suggest = useAction(api.solopreneur.supportTriageSuggest);

  const [triageSubject, setTriageSubject] = React.useState("");
  const [triageBody, setTriageBody] = React.useState("");
  const [triageSuggestions, setTriageSuggestions] = React.useState<
    Array<{ label: string; reply: string; priority: string }>
  >([]);
  const [loading, setLoading] = React.useState(false);

  const handleAnalyze = async () => {
    if (!triageBody.trim()) {
      toast.error("Please enter an email body to analyze");
      return;
    }

    setLoading(true);
    try {
      const result = await suggest({
        subject: triageSubject,
        body: triageBody,
      });
      setTriageSuggestions(result.suggestions || []);
      toast.success("AI suggestions generated");
    } catch (error) {
      toast.error("Failed to generate suggestions");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Support Triage (beta)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Email Subject (optional)</label>
          <Textarea
            placeholder="Subject line..."
            value={triageSubject}
            onChange={(e) => setTriageSubject(e.target.value)}
            rows={1}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Email Body</label>
          <Textarea
            placeholder="Paste the email content here..."
            value={triageBody}
            onChange={(e) => setTriageBody(e.target.value)}
            rows={4}
          />
        </div>

        <Button onClick={handleAnalyze} disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Analyze & Suggest Replies
        </Button>

        {triageSuggestions.length > 0 && (
          <div className="space-y-3 mt-4">
            <p className="text-sm font-medium">AI-Suggested Replies:</p>
            {triageSuggestions.map((s: any, idx: number) => (
              <Card key={idx} className="border-l-4 border-l-primary">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{s.label}</Badge>
                      <Badge
                        variant={
                          s.priority === "high"
                            ? "destructive"
                            : s.priority === "medium"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {s.priority}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(s.reply)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {s.reply}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
