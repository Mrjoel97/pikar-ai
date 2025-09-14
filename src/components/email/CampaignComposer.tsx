import { useState, useMemo } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Props = {
  businessId: any; // Id<"businesses">
  onClose: () => void;
  onCreated?: (campaignId: any) => void;
};

type Block =
  | { type: "text"; content: string }
  | { type: "button"; label: string; url: string }
  | { type: "footer"; includeUnsubscribe?: boolean };

export default function CampaignComposer({ businessId, onClose, onCreated }: Props) {
  const [from, setFrom] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [previewText, setPreviewText] = useState<string>("");
  const [body, setBody] = useState<string>("");
  const [btnLabel, setBtnLabel] = useState<string>("");
  const [btnUrl, setBtnUrl] = useState<string>("");
  const [recipientsText, setRecipientsText] = useState<string>("");
  const [testTo, setTestTo] = useState<string>("");

  const sendTestEmail = useAction(api.emailsActions.sendTestEmail);
  const createCampaign = useMutation(api.emails.createCampaign);

  const blocks: Block[] = useMemo(() => {
    const arr: Block[] = [];
    if (body.trim()) {
      arr.push({ type: "text", content: body.trim() });
    }
    if (btnLabel.trim() && btnUrl.trim()) {
      arr.push({ type: "button", label: btnLabel.trim(), url: btnUrl.trim() });
    }
    // Always include unsubscribe in footer
    arr.push({ type: "footer", includeUnsubscribe: true });
    return arr;
  }, [body, btnLabel, btnUrl]);

  const parsedRecipients: string[] = useMemo(() => {
    const raw = recipientsText
      .split(/[\n,;]+/g)
      .map((s) => s.trim())
      .filter(Boolean);
    const uniq = Array.from(new Set(raw.map((e) => e.toLowerCase())));
    return uniq;
  }, [recipientsText]);

  const disabled = !businessId || !from || !subject || blocks.length === 0;

  async function onSendTest() {
    if (!businessId) {
      toast.error("Missing business context");
      return;
    }
    if (!from || !from.includes("@")) {
      toast.error("Please enter a valid From address");
      return;
    }
    if (!testTo || !testTo.includes("@")) {
      toast.error("Please enter a valid Test To email");
      return;
    }
    if (!subject) {
      toast.error("Please enter a subject");
      return;
    }
    try {
      const res = await sendTestEmail({
        from,
        to: testTo,
        subject,
        previewText: previewText || undefined,
        businessId,
        blocks: blocks as any,
      });
      if ((res as any)?.id) {
        toast.success("Test email sent");
      } else {
        toast.success("Test triggered");
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to send test");
    }
  }

  async function onScheduleNow() {
    if (!businessId) {
      toast.error("Missing business context");
      return;
    }
    if (!from || !from.includes("@")) {
      toast.error("Please enter a valid From address");
      return;
    }
    if (!subject) {
      toast.error("Please enter a subject");
      return;
    }
    if (parsedRecipients.length === 0) {
      toast.error("Add at least one recipient");
      return;
    }
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const scheduledAt = Date.now() + 1000; // send ~immediately
      const campaignId = await createCampaign({
        businessId,
        createdBy: (null as any), // server will infer/ignore if unused; keep API aligned if required
        subject,
        from,
        previewText: previewText || undefined,
        blocks: blocks as any,
        recipients: parsedRecipients,
        timezone,
        scheduledAt,
        audienceType: "direct",
        audienceListId: undefined,
      } as any);
      toast.success("Campaign scheduled");
      if (onCreated) onCreated(campaignId);
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Failed to schedule campaign");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm">From</Label>
        <Input placeholder="Acme <onboarding@yourdomain.com>" value={from} onChange={(e) => setFrom(e.target.value)} />
        <p className="text-xs text-muted-foreground mt-1">Use a verified domain sender for better deliverability.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm">Subject</Label>
          <Input placeholder="Announcing our fall launch" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div>
          <Label className="text-sm">Preview text</Label>
          <Input placeholder="A quick peek at what's new..." value={previewText} onChange={(e) => setPreviewText(e.target.value)} />
        </div>
      </div>

      <div>
        <Label className="text-sm">Body</Label>
        <Textarea
          rows={6}
          placeholder="Write your message. Basic formatting supported via HTML in final email."
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm">Button label (optional)</Label>
          <Input placeholder="Get Started" value={btnLabel} onChange={(e) => setBtnLabel(e.target.value)} />
        </div>
        <div>
          <Label className="text-sm">Button URL (optional)</Label>
          <Input placeholder="https://example.com" value={btnUrl} onChange={(e) => setBtnUrl(e.target.value)} />
        </div>
      </div>

      <div>
        <Label className="text-sm">Recipients (one per line, or comma/semicolon separated)</Label>
        <Textarea
          rows={4}
          placeholder="user1@example.com
user2@example.com"
          value={recipientsText}
          onChange={(e) => setRecipientsText(e.target.value)}
        />
        <p className="text-xs text-muted-foreground mt-1">{parsedRecipients.length} recipient(s) parsed</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-sm">Send test</Label>
          <div className="flex gap-2">
            <Input placeholder="test@example.com" value={testTo} onChange={(e) => setTestTo(e.target.value)} />
            <Button variant="outline" onClick={onSendTest}>Send Test</Button>
          </div>
          <p className="text-xs text-muted-foreground">Sends a test to this address only.</p>
        </div>
        <div className="flex items-end justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onScheduleNow} disabled={disabled}>Schedule Now</Button>
        </div>
      </div>
    </div>
  );
}
