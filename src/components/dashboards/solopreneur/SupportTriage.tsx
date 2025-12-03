import React, { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface SupportTriageProps {
  isGuest: boolean;
}

interface TriageSuggestion {
  label: string;
  priority: "high" | "medium" | "low";
  reply: string;
}

export function SupportTriage({ isGuest }: SupportTriageProps) {
  const [emailBody, setEmailBody] = useState("");
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageSuggestions, setTriageSuggestions] = useState<TriageSuggestion[]>([]);

  const triageAction = useAction(api.supportTickets.triageEmail);

  const handleSuggestReplies = async () => {
    if (!emailBody.trim()) {
      toast.error("Please enter an email body");
      return;
    }

    setTriageLoading(true);
    try {
      const result = await triageAction({ emailBody });
      setTriageSuggestions(result.suggestions || []);
      toast.success("Suggestions generated");
    } catch (error: any) {
      toast.error(error?.message || "Failed to generate suggestions");
    } finally {
      setTriageLoading(false);
    }
  };

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Support Triage (beta)</h2>
      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Paste a customer email below to get AI-suggested replies and priority
            classification.
          </p>
          <Textarea
            placeholder="Paste customer email here..."
            value={emailBody}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setEmailBody(e.target.value)
            }
            className="min-h-28"
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSuggestReplies}
              disabled={triageLoading}
            >
              {triageLoading ? "Generating..." : "Suggest Replies"}
            </Button>
            {!isGuest && (
              <span className="text-xs text-muted-foreground">
                Suggestions are also lightly logged to audit when signed in.
              </span>
            )}
          </div>

          {triageSuggestions.length > 0 && (
            <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
              {triageSuggestions.map((s: TriageSuggestion, idx: number) => (
                <Card key={`${s.label}-${idx}`}>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{s.label}</span>
                      <Badge
                        variant={
                          s.priority === "high" ? "destructive" : "outline"
                        }
                        className="capitalize"
                      >
                        {s.priority}
                      </Badge>
                    </div>
                    <div className="text-sm whitespace-pre-wrap">
                      {s.reply}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(s.reply).then(
                            () => toast("Copied reply"),
                            () => toast.error("Copy failed"),
                          );
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}