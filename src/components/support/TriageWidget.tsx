import React, { useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Sparkles, Copy, Send } from "lucide-react";

interface TriageWidgetProps {
  businessId?: string;
  onTicketCreated?: (ticketId: string) => void;
}

export function TriageWidget({ businessId, onTicketCreated }: TriageWidgetProps) {
  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageResult, setTriageResult] = useState<any>(null);

  const triageAction = useAction(api.support.triage.triageEmail);
  const classifyAction = useAction(api.support.triage.classifyTicket);
  const createTicket = useMutation(api.supportTickets.createTicket);

  const handleTriage = async () => {
    if (!emailBody.trim()) {
      toast.error("Please enter email content");
      return;
    }

    setTriageLoading(true);
    try {
      const result = await triageAction({ emailBody });
      setTriageResult(result);
      toast.success("Triage complete!");
    } catch (error: any) {
      toast.error(error?.message || "Triage failed");
    } finally {
      setTriageLoading(false);
    }
  };

  const handleCreateTicket = async (suggestion: any) => {
    if (!businessId) {
      toast.error("Business ID required");
      return;
    }

    try {
      const classification = await classifyAction({
        subject: subject || "Support Request",
        description: emailBody
      });

      // Note: In production, you'd get the actual user ID
      // For now, we'll need to handle this appropriately
      toast.info("Ticket creation requires user authentication");
      
    } catch (error: any) {
      toast.error(error?.message || "Failed to create ticket");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => toast.success("Copied to clipboard"),
      () => toast.error("Copy failed")
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Support Triage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="subject">Subject (Optional)</Label>
          <Input
            id="subject"
            placeholder="Brief subject line..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="emailBody">Customer Email</Label>
          <Textarea
            id="emailBody"
            placeholder="Paste customer email content here..."
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            className="min-h-32"
          />
        </div>

        <Button
          onClick={handleTriage}
          disabled={triageLoading || !emailBody.trim()}
          className="w-full"
        >
          {triageLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze & Suggest Replies
            </>
          )}
        </Button>

        {triageResult && (
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Suggested Responses</h3>
              <Badge variant="outline" className="capitalize">
                Priority: {triageResult.detectedPriority}
              </Badge>
            </div>

            <div className="grid gap-3">
              {triageResult.suggestions?.map((suggestion: any, idx: number) => (
                <Card key={idx} className="border-2">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{suggestion.label}</span>
                      <Badge
                        variant={suggestion.priority === "high" ? "destructive" : "outline"}
                        className="capitalize"
                      >
                        {suggestion.priority}
                      </Badge>
                    </div>

                    <div className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                      {suggestion.reply}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(suggestion.reply)}
                      >
                        <Copy className="mr-2 h-3 w-3" />
                        Copy
                      </Button>
                      {businessId && (
                        <Button
                          size="sm"
                          onClick={() => handleCreateTicket(suggestion)}
                        >
                          <Send className="mr-2 h-3 w-3" />
                          Create Ticket
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {triageResult.categories && (
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="text-sm text-muted-foreground">Detected:</span>
                {Object.entries(triageResult.categories).map(([key, value]) => 
                  value ? (
                    <Badge key={key} variant="secondary" className="capitalize">
                      {key}
                    </Badge>
                  ) : null
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
