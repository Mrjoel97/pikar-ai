import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Save, Send, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface EmailDraftComposerProps {
  businessId: Id<"businesses">;
  draftId?: Id<"emailDrafts">;
  onSaved?: (draftId: Id<"emailDrafts">) => void;
  onSendNow?: (draft: any) => void;
  onSchedule?: (draft: any) => void;
}

type AgentTone = "concise" | "friendly" | "premium";

export function EmailDraftComposer({ 
  businessId, 
  draftId, 
  onSaved, 
  onSendNow, 
  onSchedule 
}: EmailDraftComposerProps) {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [intent, setIntent] = useState("");
  const [tone, setTone] = useState<AgentTone>("friendly");
  const [isGenerating, setIsGenerating] = useState(false);

  // Queries and mutations
  const contacts = useQuery(api.contacts.listContacts, { businessId });
  const existingDraft = useQuery(
    api.emailDrafts.getDraft, 
    draftId ? { draftId } : "skip"
  );
  const generateDraft = useAction(api.emailDraftAgent.generateEmailDraft);
  const saveDraft = useMutation(api.emailDrafts.saveDraft);
  const updateDraft = useMutation(api.emailDrafts.updateDraft);

  // Load existing draft
  useEffect(() => {
    if (existingDraft) {
      setRecipientEmail(existingDraft.recipientEmail);
      setSubject(existingDraft.subject);
      setBody(existingDraft.body);
      if (existingDraft.tone) setTone(existingDraft.tone);
      if (existingDraft.metadata?.intent) setIntent(existingDraft.metadata.intent);
    }
  }, [existingDraft]);

  const handleGenerateWithAI = async () => {
    if (!recipientEmail || !intent) {
      toast.error("Please provide recipient email and intent");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateDraft({
        businessId,
        recipientEmail,
        intent,
        tone,
      });

      setSubject(result.subject);
      setBody(result.body);
      if (result.suggestedTone) {
        setTone(result.suggestedTone as AgentTone);
      }

      toast.success("Email draft generated!");
    } catch (error: any) {
      toast.error(`Failed to generate draft: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!recipientEmail || !subject || !body) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (draftId) {
        await updateDraft({
          draftId,
          subject,
          body,
          tone,
        });
        toast.success("Draft updated!");
      } else {
        const newDraftId = await saveDraft({
          businessId,
          recipientEmail,
          subject,
          body,
          tone,
          metadata: {
            intent,
            aiGenerated: true,
          },
        });
        toast.success("Draft saved!");
        onSaved?.(newDraftId);
      }
    } catch (error: any) {
      toast.error(`Failed to save draft: ${error.message}`);
    }
  };

  const handleSendNow = () => {
    if (!recipientEmail || !subject || !body) {
      toast.error("Please fill in all required fields");
      return;
    }
    onSendNow?.({ recipientEmail, subject, body, tone });
  };

  const handleSchedule = () => {
    if (!recipientEmail || !subject || !body) {
      toast.error("Please fill in all required fields");
      return;
    }
    onSchedule?.({ recipientEmail, subject, body, tone });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Email Draft</CardTitle>
          <CardDescription>
            Generate personalized emails with AI assistance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recipient Selection */}
          <div>
            <Label htmlFor="recipient">Recipient Email *</Label>
            <Input
              id="recipient"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="customer@example.com"
              list="contacts-list"
            />
            <datalist id="contacts-list">
              {contacts?.map((contact: any) => (
                <option key={contact._id} value={contact.email}>
                  {contact.name || contact.email}
                </option>
              ))}
            </datalist>
          </div>

          {/* Intent Input */}
          <div>
            <Label htmlFor="intent">Email Purpose *</Label>
            <Input
              id="intent"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              placeholder="e.g., Follow up on product inquiry, Thank customer for purchase"
            />
          </div>

          {/* Tone Selection */}
          <div>
            <Label htmlFor="tone">Tone</Label>
            <Select value={tone} onValueChange={(value) => setTone(value as AgentTone)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="concise">Concise</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* AI Generate Button */}
          <Button
            onClick={handleGenerateWithAI}
            disabled={isGenerating || !recipientEmail || !intent}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate with AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Email Content */}
      {(subject || body) && (
        <Card>
          <CardHeader>
            <CardTitle>Email Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
              />
            </div>

            <div>
              <Label htmlFor="body">Body *</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Email body"
                rows={12}
                className="font-mono text-sm"
              />
            </div>

            {tone && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Tone: {tone}</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Draft
        </Button>
        <Button variant="outline" onClick={handleSchedule}>
          <Calendar className="h-4 w-4 mr-2" />
          Schedule
        </Button>
        <Button onClick={handleSendNow}>
          <Send className="h-4 w-4 mr-2" />
          Send Now
        </Button>
      </div>
    </div>
  );
}
