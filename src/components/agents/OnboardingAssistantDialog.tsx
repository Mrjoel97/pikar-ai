import React, { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

export default function OnboardingAssistantDialog() {
  const initExec = useMutation(api.aiAgents.initSolopreneurAgent);
  const addSlot = useMutation(api.schedule.addSlot);
  const deleteSlot = useMutation(api.schedule.deleteSlot);

  const [open, setOpen] = useState(false);
  const [businessId, setBusinessId] = useState<string>("");
  const [goals, setGoals] = useState("");
  const [tone, setTone] = useState("practical, concise, friendly");
  const [timezone, setTimezone] = useState("UTC");
  const [useEmail, setUseEmail] = useState(true);
  const [useSocial, setUseSocial] = useState(true);
  const [cadence, setCadence] = useState("weekly");
  const [saving, setSaving] = useState(false);
  const [createNow, setCreateNow] = useState<boolean>(true);

  const currentBiz = useQuery(api.businesses?.currentUserBusiness as any, undefined);
  React.useEffect(() => {
    if (currentBiz?._id) setBusinessId(currentBiz._id as unknown as string);
  }, [currentBiz?._id]);

  const suggestedSlots = useMemo(
    () => {
      const slots: Array<{ label: string; channel: string; scheduledAt: number }> = [];
      const base = Date.now();
      if (useEmail) {
        const d = new Date(base);
        const nextTue = ((2 - d.getUTCDay()) + 7) % 7 || 7;
        d.setUTCDate(d.getUTCDate() + nextTue);
        d.setUTCHours(10, 0, 0, 0);
        slots.push({ label: "Newsletter", channel: "email", scheduledAt: d.getTime() });
      }
      if (useSocial) {
        const d1 = new Date(base);
        d1.setUTCDate(d1.getUTCDate() + 2);
        d1.setUTCHours(9, 0, 0, 0);
        const d2 = new Date(base);
        d2.setUTCDate(d2.getUTCDate() + 4);
        d2.setUTCHours(14, 0, 0, 0);
        slots.push({ label: "Post A", channel: "social", scheduledAt: d1.getTime() });
        slots.push({ label: "Post B", channel: "social", scheduledAt: d2.getTime() });
      }
      return slots;
    },
    [useEmail, useSocial]
  );

  const runWeeklyMomentum = async (bizId: string) => {
    try {
      const res = await fetch(`/api/playbooks/weekly_momentum_capsule/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: bizId }),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `Failed with status ${res.status}`);
      }
      toast.success("First capsule created and queued!");
    } catch (e: any) {
      toast.error(`Could not start first capsule: ${e?.message ?? "Unknown error"}`);
    }
  };

  const handleSave = async () => {
    if (!businessId) {
      toast.error("Select or create a workspace first (businessId missing)");
      return;
    }
    setSaving(true);
    try {
      await initExec({
        businessId: businessId as any,
        businessSummary: goals || undefined,
        brandVoice: tone || undefined,
        timezone: timezone || undefined,
        automations: {
          invoicing: false,
          emailDrafts: true,
          socialPosts: true,
        },
      } as any);

      const addedSlotIds: Array<string> = [];
      for (const s of suggestedSlots) {
        try {
          const slotId = await addSlot({
            businessId: businessId as any,
            label: s.label,
            channel: s.channel,
            scheduledAt: s.scheduledAt,
          } as any);
          if (slotId) addedSlotIds.push(String(slotId));
        } catch (e: any) {
          toast.error(`Failed to add slot "${s.label}": ${e?.message ?? "Unknown error"}`);
        }
      }

      if (addedSlotIds.length > 0) {
        toast.success("Schedule prepared. Undo?", {
          action: {
            label: "Undo",
            onClick: async () => {
              try {
                for (const id of addedSlotIds) {
                  await deleteSlot({ slotId: id as any });
                }
                toast.success("Seeded slots removed.");
              } catch (e: any) {
                toast.error(`Could not undo slots: ${e?.message ?? "Unknown error"}`);
              }
            },
          },
        });
      }

      if (createNow) {
        await runWeeklyMomentum(businessId);
      }

      toast.success("Executive Assistant initialized and schedule prepared");
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to initialize Executive Assistant");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700">Set up Executive Assistant</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Executive Assistant Setup</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Workspace (Business Id)</label>
            <Input
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value)}
              placeholder="Enter your Business Id"
            />
            <div className="text-xs text-muted-foreground mt-1">
              Prefilled if you already have a workspace.
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Your Goals / Focus</label>
            <Textarea
              rows={3}
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder="Describe what you want your assistant to prioritize"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Tone / Persona</label>
              <Input value={tone} onChange={(e) => setTone(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Timezone</label>
              <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Cadence</label>
              <Select value={cadence} onValueChange={setCadence}>
                <SelectTrigger><SelectValue placeholder="Select cadence" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between border rounded-md px-3 py-2">
              <div className="text-sm">Use Email</div>
              <Switch checked={useEmail} onCheckedChange={setUseEmail} />
            </div>
            <div className="flex items-center justify-between border rounded-md px-3 py-2">
              <div className="text-sm">Use Social</div>
              <Switch checked={useSocial} onCheckedChange={setUseSocial} />
            </div>
          </div>

          {suggestedSlots.length > 0 && (
            <div className="text-xs text-muted-foreground">
              We will add {suggestedSlots.length} initial schedule slot(s) for your capsule workflow.
            </div>
          )}

          <div className="flex items-center gap-3">
            <Checkbox
              id="createNow"
              checked={createNow}
              onCheckedChange={(v: boolean) => setCreateNow(v)}
            />
            <label htmlFor="createNow" className="text-sm">
              Create my first capsule now (runs Weekly Momentum playbook)
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save & Initialize"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
