import React, { useState, useCallback, useMemo } from "react";
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
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

export function CampaignComposer({ businessId, onClose, onCreated, defaultScheduledAt, agentTone, agentPersona, agentCadence }: CampaignComposerProps) {
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

  // CSV Import state
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [csvContacts, setCsvContacts] = useState<CsvContact[]>([]);
  const [csvListName, setCsvListName] = useState("");
  const [csvPreview, setCsvPreview] = useState<CsvContact[]>([]);

  // Queries and mutations
  const contactLists = useQuery(api.contacts.listLists, { businessId });
  const createCampaign = useMutation(api.emails.createCampaign);
  const sendTestEmail = useAction(api.emailsActions.sendTestEmail);
  const bulkUploadCsv = useMutation(api.contacts.bulkUploadCsv);

  const selectedList = contactLists?.find((list: any) => list._id === selectedListId);
  const recipientCount = selectedList ? "Loading..." : directRecipients.split(",").filter(Boolean).length;

  // Add: Compliance preflight heuristics (UI-only)
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
    if (!formData.subject || !formData.body) {
      toast.error("Please fill in subject and body");
      return;
    }

    if (audienceType === "direct" && !directRecipients.trim()) {
      toast.error("Please provide recipients");
      return;
    }

    if (audienceType === "list" && !selectedListId) {
      toast.error("Please select a contact list");
      return;
    }

    try {
      const recipients = audienceType === "direct" 
        ? directRecipients.split(",").map(email => email.trim()).filter(Boolean)
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
        audienceType,
        audienceListId: audienceType === "list" ? selectedListId : undefined,
        buttons: formData.buttons.map(({ text, url }) => ({ text, url })),
        scheduledAt: defaultScheduledAt ?? Date.now(),
      });

      // Note: A/B variant is UI-only scaffold for now (not persisted in campaign)
      if (enableAb && variantB.subject && variantB.body) {
        toast("A/B scaffold saved locally (B variant not yet scheduled server-side).");
      }

      toast.success("Campaign scheduled successfully!");
      onCreated?.();
      onClose();
    } catch (error: any) {
      toast.error(`Failed to schedule campaign: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {typeof defaultScheduledAt === "number" && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            Scheduled for {new Date(defaultScheduledAt).toLocaleString()}
          </Badge>
        </div>
      )}

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

      {preflightWarnings.length > 0 && (
        <Alert variant="destructive">
          <AlertTitle>Compliance preflight warnings</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5 space-y-1">
              {preflightWarnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

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
      </div>

      <Separator />

      <div className="space-y-4">
        <Label>Audience</Label>
        <Tabs value={audienceType} onValueChange={(value) => setAudienceType(value as "direct" | "list")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="direct" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Direct Recipients
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Contact List
            </TabsTrigger>
          </TabsList>

          <TabsContent value="direct" className="space-y-2">
            <Textarea
              value={directRecipients}
              onChange={(e) => setDirectRecipients(e.target.value)}
              placeholder="Enter email addresses separated by commas"
              rows={3}
            />
            <p className="text-sm text-muted-foreground">
              Recipients: {recipientCount}
            </p>
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            <div className="flex items-center gap-2">
              <Select value={selectedListId || ""} onValueChange={(value) => setSelectedListId(value as Id<"contactLists">)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a contact list" />
                </SelectTrigger>
                <SelectContent>
                  {contactLists?.map((list: any) => (
                    <SelectItem key={list._id} value={list._id}>
                      {list.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Dialog open={csvDialogOpen} onOpenChange={setCsvDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Import CSV
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Import Contacts from CSV</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="csvListName">List Name</Label>
                      <Input
                        id="csvListName"
                        value={csvListName}
                        onChange={(e) => setCsvListName(e.target.value)}
                        placeholder="My Contact List"
                      />
                    </div>

                    <div>
                      <Label htmlFor="csvText">CSV Data</Label>
                      <Textarea
                        id="csvText"
                        value={csvText}
                        onChange={(e) => handleCsvTextChange(e.target.value)}
                        placeholder="email,name,tags&#10;john@example.com,John Doe,newsletter;customer&#10;jane@example.com,Jane Smith,newsletter"
                        rows={8}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Expected format: email,name,tags (tags separated by semicolons)
                      </p>
                    </div>

                    {csvPreview.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Preview ({csvContacts.length} contacts total)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {csvPreview.map((contact, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <Badge variant="outline">{contact.email}</Badge>
                                {contact.name && <span>{contact.name}</span>}
                                {contact.tags && contact.tags.length > 0 && (
                                  <div className="flex gap-1">
                                    {contact.tags.map((tag, i) => (
                                      <Badge key={i} variant="secondary" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setCsvDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCsvImport} disabled={csvContacts.length === 0 || !csvListName.trim()}>
                        Import {csvContacts.length} Contacts
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {selectedList && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">{selectedList.name}</span>
                    <Badge variant="secondary">
                      {selectedList.description}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Separator />

      <div className="space-y-4">
        <Label htmlFor="body">Email Content</Label>
        <Textarea
          id="body"
          value={formData.body}
          onChange={(e) => handleInputChange("body", e.target.value)}
          placeholder="Write your email content here..."
          rows={8}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Call-to-Action Buttons (optional)</Label>
          <Button variant="outline" size="sm" onClick={addButton}>
            <Plus className="h-4 w-4 mr-1" />
            Add Button
          </Button>
        </div>

        {formData.buttons.map((button, index) => (
          <Card key={index}>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={button.text}
                  onChange={(e) => handleButtonChange(index, "text", e.target.value)}
                  placeholder="Button text"
                />
                <Input
                  value={button.url}
                  onChange={(e) => handleButtonChange(index, "url", e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="flex justify-end mt-2">
                <Button variant="ghost" size="sm" onClick={() => removeButton(index)}>
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>A/B Testing (scaffold)</Label>
          <div className="flex items-center gap-2">
            <Switch checked={enableAb} onCheckedChange={setEnableAb} />
            <span className="text-sm text-muted-foreground">{enableAb ? "Enabled" : "Disabled"}</span>
          </div>
        </div>
        {enableAb && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Variant B</CardTitle>
              <CardDescription>Lightweight fields for a second variant (UI-only)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="subjectB">Subject (B)</Label>
                <Input
                  id="subjectB"
                  value={variantB.subject}
                  onChange={(e) => setVariantB((p) => ({ ...p, subject: e.target.value }))}
                  placeholder="Your variant B subject"
                />
              </div>
              <div>
                <Label htmlFor="bodyB">Body (B)</Label>
                <Textarea
                  id="bodyB"
                  value={variantB.body}
                  onChange={(e) => setVariantB((p) => ({ ...p, body: e.target.value }))}
                  placeholder="Variant B email content..."
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Separator />

      <div className="space-y-4">
        <Label>Test & Send</Label>
        <div className="flex gap-2">
          <Input
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="test@example.com"
            className="flex-1"
          />
          <Button variant="outline" onClick={handleSendTest}>
            Send Test
          </Button>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleScheduleCampaign}>
          Schedule Campaign
        </Button>
      </div>
    </div>
  );
}

export default CampaignComposer;