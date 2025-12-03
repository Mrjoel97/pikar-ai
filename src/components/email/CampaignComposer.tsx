import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Upload, Users, Mail, Plus, FileText } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNavigate } from "react-router";
import { DraftsList } from "./DraftsList";
import { AudienceSelector } from "./AudienceSelector";
import { CsvImportDialog } from "./CsvImportDialog";
import { SegmentationControls } from "./SegmentationControls";
import { AbTestingControls } from "./AbTestingControls";
import { SenderConfigAlert } from "./SenderConfigAlert";
import { ComplianceWarnings } from "./ComplianceWarnings";

type AgentTone = "concise" | "friendly" | "premium";
type AgentPersona = "maker" | "coach" | "executive";
type AgentCadence = "light" | "standard" | "aggressive";

interface CampaignComposerProps {
  businessId: Id<"businesses">;
  onClose: () => void;
  onCreated?: () => void;
  defaultScheduledAt?: number;
  agentTone?: AgentTone;
  agentPersona?: AgentPersona;
  agentCadence?: AgentCadence;
}

interface CsvContact {
  email: string;
  name?: string;
  tags?: string[];
}

function CampaignComposer({ businessId, onClose, onCreated, defaultScheduledAt, agentTone, agentPersona, agentCadence }: CampaignComposerProps) {
  const [formData, setFormData] = useState({
    fromName: "",
    fromEmail: "",
    replyTo: "",
    subject: "",
    previewText: "",
    body: "",
    buttons: [] as Array<{ text: string; url: string; style?: string }>,
  });

  const [enableAb, setEnableAb] = useState(false);
  const [variantB, setVariantB] = useState({
    subject: "",
    body: "",
  });

  const [audienceType, setAudienceType] = useState<"direct" | "list">("direct");
  const [selectedListId, setSelectedListId] = useState<Id<"contactLists"> | null>(null);
  const [directRecipients, setDirectRecipients] = useState("");
  const [testEmail, setTestEmail] = useState("");

  // Segmentation state (new)
  const [useSegmentation, setUseSegmentation] = useState(false);
  const [segmentType, setSegmentType] = useState<"status" | "tag" | "engagement">("tag");
  const [segmentValue, setSegmentValue] = useState("");

  // CSV Import state
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [csvContacts, setCsvContacts] = useState<CsvContact[]>([]);
  const [csvListName, setCsvListName] = useState("");
  const [csvPreview, setCsvPreview] = useState<CsvContact[]>([]);

  // Add draft dialog state
  const [draftDialogOpen, setDraftDialogOpen] = useState(false);
  const [selectedDraftId, setSelectedDraftId] = useState<Id<"emailDrafts"> | null>(null);

  // Add query for selected draft
  const selectedDraft = useQuery(
    api.emailDrafts.getDraft,
    selectedDraftId ? { draftId: selectedDraftId } : "skip"
  );

  // Queries and mutations
  const contactLists = useQuery(api.contacts.listLists, { businessId });
  const createCampaign = useMutation(api.emails.createCampaign);
  const sendTestEmail = useAction(api.emailsActions.sendTestEmail);
  const bulkUploadCsv = useMutation(api.contacts.bulkUploadCsv);
  const navigate = useNavigate();

  // Fetch segments and (conditionally) segment emails (new)
  const segments = useQuery(api.contacts.getContactSegments as any, { businessId });
  const segmentEmails = useQuery(
    api.contacts.getContactsBySegmentForCampaign as any,
    useSegmentation && segmentValue ? { businessId, segmentType, segmentValue } : "skip"
  );

  // Fetch workspace email configuration summary (guest-safe; returns null if unauthenticated or unset)
  const emailSummary = useQuery(api.emailConfig.getForBusinessSummary, {});
  const missingFromEmail = !emailSummary?.fromEmail;
  const missingReplyTo = !emailSummary?.replyTo; // require reply-to for compliance
  const hasSenderIssues = missingFromEmail || missingReplyTo;

  const selectedList = contactLists?.find((list: any) => list._id === selectedListId);
  const recipientCount = selectedList ? "Loading..." : directRecipients.split(",").filter(Boolean).length;

  // Add handler to load draft
  const handleLoadDraft = (draftId: Id<"emailDrafts">) => {
    setSelectedDraftId(draftId);
    setDraftDialogOpen(false);
  };

  // Effect to populate form from selected draft
  useEffect(() => {
    if (selectedDraft) {
      setFormData(prev => ({
        ...prev,
        subject: selectedDraft.subject,
        body: selectedDraft.body,
      }));
      setDirectRecipients(selectedDraft.recipientEmail);
      setAudienceType("direct");
      toast.success("Draft loaded!");
    }
  }, [selectedDraft]);

  // Add: expanded compliance checks including consent/unsub language with docs link
  const preflightWarnings = React.useMemo(() => {
    const warnings: string[] = [];
    const lowerBody = (formData.body || "").toLowerCase();

    if (!formData.fromEmail) {
      warnings.push("From Email is empty. Add a valid sender address for deliverability.");
    }
    if (!formData.subject) {
      warnings.push("Subject is empty. Emails without a subject are likely to be flagged or ignored.");
    }
    if (!lowerBody.includes("unsubscribe")) {
      warnings.push("Missing unsubscribe language. Include a clear unsubscribe option to minimize complaints.");
    }
    // New: consent/preference reminder (heuristic UI check)
    if (
      !lowerBody.includes("consent") &&
      !lowerBody.includes("opted in") &&
      !lowerBody.includes("opt-in") &&
      !lowerBody.includes("preferences")
    ) {
      warnings.push("Missing consent/preference reminder. Consider referencing how the recipient subscribed or can manage preferences.");
    }
    if (audienceType === "direct" && directRecipients.split(",").filter(Boolean).length === 0) {
      warnings.push("No direct recipients provided. Add at least one recipient or switch to a Contact List.");
    }
    if (audienceType === "list" && !selectedListId) {
      warnings.push("No contact list selected. Choose a list to target your campaign.");
    }
    return warnings;
  }, [formData.body, formData.subject, formData.fromEmail, audienceType, directRecipients, selectedListId]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleButtonChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      buttons: prev.buttons.map((btn, i) => 
        i === index ? { ...btn, [field]: value } : btn
      ),
    }));
  };

  const addButton = () => {
    setFormData(prev => ({
      ...prev,
      buttons: [...prev.buttons, { text: "", url: "", style: "primary" }],
    }));
  };

  const removeButton = (index: number) => {
    setFormData(prev => ({
      ...prev,
      buttons: prev.buttons.filter((_, i) => i !== index),
    }));
  };

  // CSV parsing and preview
  const parseCsvText = useCallback((text: string): CsvContact[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const emailIndex = headers.findIndex(h => h.includes('email'));
    const nameIndex = headers.findIndex(h => h.includes('name'));
    const tagsIndex = headers.findIndex(h => h.includes('tag'));

    if (emailIndex === -1) return [];

    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const contact: CsvContact = {
        email: values[emailIndex] || '',
      };

      if (nameIndex >= 0 && values[nameIndex]) {
        contact.name = values[nameIndex];
      }

      if (tagsIndex >= 0 && values[tagsIndex]) {
        contact.tags = values[tagsIndex].split(';').map(t => t.trim()).filter(Boolean);
      }

      return contact;
    }).filter(contact => contact.email && contact.email.includes('@'));
  }, []);

  const handleCsvTextChange = (text: string) => {
    setCsvText(text);
    const parsed = parseCsvText(text);
    setCsvContacts(parsed);
    setCsvPreview(parsed.slice(0, 5)); // Show first 5 for preview
  };

  const handleCsvImport = async () => {
    if (csvContacts.length === 0) {
      toast.error("No valid contacts found in CSV");
      return;
    }

    if (!csvListName.trim()) {
      toast.error("Please provide a name for the contact list");
      return;
    }

    try {
      const result = await bulkUploadCsv({
        businessId,
        listName: csvListName,
        contacts: csvContacts,
      });

      toast.success(`Imported ${result.added} contacts (${result.skipped} skipped)`);
      
      if (result.listId) {
        setSelectedListId(result.listId);
        setAudienceType("list");
      }

      setCsvDialogOpen(false);
      setCsvText("");
      setCsvContacts([]);
      setCsvListName("");
    } catch (error: any) {
      toast.error(`Import failed: ${error.message}`);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail || !formData.subject || !formData.body) {
      toast.error("Please fill in test email, subject, and body");
      return;
    }

    try {
      await sendTestEmail({
        businessId,
        to: testEmail,
        subject: `[TEST] ${formData.subject}`,
        fromEmail: formData.fromEmail || "test@example.com",
        fromName: formData.fromName,
        replyTo: formData.replyTo,
        previewText: formData.previewText,
        htmlContent: formData.body,
        buttons: formData.buttons.map(({ text, url }) => ({ text, url })),
      });
      toast.success(`Test email sent to ${testEmail}`);
    } catch (error: any) {
      toast.error(`Failed to send test: ${error.message}`);
    }
  };

  const handleScheduleCampaign = async () => {
    if (hasSenderIssues) {
      toast.error("Configure From Email and Reply-To in Settings before scheduling.");
      navigate("/settings");
      return;
    }

    if (!formData.subject || !formData.body) {
      toast.error("Please fill in subject and body");
      return;
    }

    // Segmentation validation (new)
    if (useSegmentation) {
      if (!segmentValue) {
        toast.error("Select a segment to target");
        return;
      }
      if (!Array.isArray(segmentEmails) || segmentEmails.length === 0) {
        toast.error("No contacts found for the selected segment");
        return;
      }
    } else {
      // Original audience validations
      if (audienceType === "direct" && !directRecipients.trim()) {
        toast.error("Please provide recipients");
        return;
      }
      if (audienceType === "list" && !selectedListId) {
        toast.error("Please select a contact list");
        return;
      }
    }

    // Validate A/B test if enabled
    if (enableAb) {
      if (!variantB.subject || !variantB.body) {
        toast.error("Please fill in both subject and body for Variant B");
        return;
      }
    }

    try {
      const recipients = useSegmentation
        ? (segmentEmails || [])
        : audienceType === "direct"
          ? directRecipients.split(",").map((email) => email.trim()).filter(Boolean)
          : [];

      await createCampaign({
        businessId,
        subject: formData.subject,
        fromEmail: formData.fromEmail || "noreply@example.com",
        fromName: formData.fromName,
        replyTo: formData.replyTo,
        previewText: formData.previewText,
        body: formData.body,
        recipients,
        audienceType: useSegmentation ? "direct" : audienceType,
        audienceListId: !useSegmentation && audienceType === "list" ? selectedListId : undefined,
        buttons: formData.buttons.map(({ text, url }) => ({ text, url })),
        scheduledAt: defaultScheduledAt ?? Date.now(),
        enableAbTest: enableAb,
        variantB: enableAb ? variantB : undefined,
      });

      toast.success(
        useSegmentation
          ? "Campaign scheduled successfully to selected segment!"
          : enableAb && variantB.subject && variantB.body
            ? "Campaign with A/B test scheduled successfully!"
            : "Campaign scheduled successfully!"
      );

      onCreated?.();
      onClose();
    } catch (error: any) {
      toast.error(`Failed to schedule campaign: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Load from Draft button */}
      <div className="flex justify-between items-center">
        <Dialog open={draftDialogOpen} onOpenChange={setDraftDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Load from Draft
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Select a Draft</DialogTitle>
            </DialogHeader>
            <DraftsList
              businessId={businessId}
              onSelectDraft={handleLoadDraft}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Scheduled badge */}
      {typeof defaultScheduledAt === "number" && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            Scheduled for {new Date(defaultScheduledAt).toLocaleString()}
          </Badge>
        </div>
      )}

      {/* Agent profile alert */}
      {(agentTone || agentPersona || agentCadence) && (
        <Alert>
          <AlertTitle>Using your Agent Profile</AlertTitle>
          <AlertDescription>
            {agentTone ? `Tone: ${agentTone}` : ""}{agentTone && (agentPersona || agentCadence) ? " · " : ""}
            {agentPersona ? `Persona: ${agentPersona}` : ""}{agentPersona && agentCadence ? " · " : ""}
            {agentCadence ? `Cadence: ${agentCadence}` : ""}
          </AlertDescription>
        </Alert>
      )}

      {/* Sender configuration alert */}
      <SenderConfigAlert
        show={hasSenderIssues}
        missingFromEmail={missingFromEmail}
        missingReplyTo={missingReplyTo}
        onFix={() => navigate("/settings")}
      />

      {/* Compliance preflight warnings */}
      <ComplianceWarnings
        warnings={preflightWarnings}
        onLearn={() => {
          try {
            navigate("/learning-hub");
          } catch {
            window.location.href = "/learning-hub";
          }
        }}
      />

      {/* Sender fields */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fromName">From Name</Label>
            <Input
              id="fromName"
              value={formData.fromName}
              onChange={(e) => handleInputChange("fromName", e.target.value)}
              placeholder="Your Name"
            />
          </div>
          <div>
            <Label htmlFor="fromEmail">From Email</Label>
            <Input
              id="fromEmail"
              type="email"
              value={formData.fromEmail}
              onChange={(e) => handleInputChange("fromEmail", e.target.value)}
              placeholder="you@company.com"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="replyTo">Reply To (optional)</Label>
          <Input
            id="replyTo"
            type="email"
            value={formData.replyTo}
            onChange={(e) => handleInputChange("replyTo", e.target.value)}
            placeholder="replies@company.com"
          />
        </div>

        <div>
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            value={formData.subject}
            onChange={(e) => handleInputChange("subject", e.target.value)}
            placeholder="Your email subject"
          />
        </div>

        <div>
          <Label htmlFor="previewText">Preview Text (optional)</Label>
          <Input
            id="previewText"
            value={formData.previewText}
            onChange={(e) => handleInputChange("previewText", e.target.value)}
            placeholder="This appears in email previews"
          />
        </div>

        <div>
          <Label htmlFor="body">Email Body</Label>
          <Textarea
            id="body"
            value={formData.body}
            onChange={(e) => handleInputChange("body", e.target.value)}
            placeholder="Your email content"
            rows={10}
          />
        </div>
      </div>

      <Separator />

      {/* Audience Selector - extracted component */}
      <AudienceSelector
        audienceType={audienceType}
        setAudienceType={setAudienceType}
        directRecipients={directRecipients}
        setDirectRecipients={setDirectRecipients}
        selectedListId={selectedListId}
        setSelectedListId={setSelectedListId}
        contactLists={contactLists}
        selectedList={selectedList}
        recipientCount={recipientCount}
        onOpenCsvDialog={() => setCsvDialogOpen(true)}
      />

      {/* CSV Import Dialog - extracted component */}
      <CsvImportDialog
        open={csvDialogOpen}
        onOpenChange={setCsvDialogOpen}
        csvText={csvText}
        onCsvTextChange={handleCsvTextChange}
        csvListName={csvListName}
        onCsvListNameChange={setCsvListName}
        csvPreview={csvPreview}
        csvContacts={csvContacts}
        onImport={handleCsvImport}
      />

      <Separator />

      {/* Segmentation Controls - extracted component */}
      <SegmentationControls
        useSegmentation={useSegmentation}
        setUseSegmentation={setUseSegmentation}
        segmentType={segmentType}
        setSegmentType={setSegmentType}
        segmentValue={segmentValue}
        setSegmentValue={setSegmentValue}
        segments={segments}
        segmentEmails={segmentEmails}
      />

      <Separator />

      {/* A/B Testing Controls - extracted component */}
      <AbTestingControls
        enableAb={enableAb}
        setEnableAb={setEnableAb}
        variantB={variantB}
        setVariantB={setVariantB}
      />

      {/* Action buttons */}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleScheduleCampaign}
          disabled={
            hasSenderIssues ||
            !formData.subject ||
            !formData.body ||
            (useSegmentation
              ? (!segmentValue || !Array.isArray(segmentEmails) || segmentEmails.length === 0)
              : ((audienceType === "direct" && !directRecipients.trim()) ||
                (audienceType === "list" && !selectedListId)))
          }
        >
          Schedule Campaign
        </Button>
      </div>
    </div>
  );
}

export default CampaignComposer;