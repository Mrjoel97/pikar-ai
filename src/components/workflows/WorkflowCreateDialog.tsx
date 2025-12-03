import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type FormDataState = {
  name: string;
  description: string;
  triggerType: "manual" | "schedule" | "webhook";
  cron: string;
  eventKey: string;
  approvalRequired: boolean;
  approvalThreshold: number;
  pipeline: string;
  tags: string;
  saveAsTemplate: boolean;
};

interface WorkflowCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  tier?: string;
  onSubmit: (data: any) => Promise<void>;
}

export default function WorkflowCreateDialog({
  open,
  onOpenChange,
  businessId,
  tier,
  onSubmit,
}: WorkflowCreateDialogProps) {
  const [formData, setFormData] = useState<FormDataState>({
    name: "",
    description: "",
    triggerType: "manual",
    cron: "",
    eventKey: "",
    approvalRequired: false,
    approvalThreshold: 1,
    pipeline: "[]",
    tags: "",
    saveAsTemplate: false,
  });

  useEffect(() => {
    if (!open) return;

    if (tier === "solopreneur") {
      const defaultPipeline = [
        { kind: "collect", title: "Collect recent wins", source: "notes" },
        { kind: "agent", title: "Draft LinkedIn + email blurb", agentPrompt: "Draft a LinkedIn post and an email blurb based on collected wins." },
        { kind: "approval", approverRole: "Owner", title: "Quick review" },
        { kind: "delay", delayMinutes: 15, title: "Schedule buffer (optional)" },
      ];
      setFormData(prev => ({
        ...prev,
        name: prev.name || "Brand Booster",
        description: prev.description || "Quick weekly post + email draft with a short review.",
        pipeline: JSON.stringify(defaultPipeline, null, 2),
        tags: prev.tags || "brand-booster, quick-win"
      }));
    } else if (tier === "startup") {
      const defaultPipeline = [
        { kind: "agent", title: "Draft deliverable", agentPrompt: "Create the initial draft for team review." },
        { kind: "approval", approverRole: "Manager", title: "Team approval" },
        { kind: "delay", delayMinutes: 60, title: "SLA buffer" },
        { kind: "notify", channel: "email", title: "Handoff to next role" },
      ];
      setFormData(prev => ({
        ...prev,
        name: prev.name || "Standard Handoff",
        description: prev.description || "Approval + SLA buffer for consistent handoff.",
        pipeline: JSON.stringify(defaultPipeline, null, 2),
        tags: prev.tags || "standardize, handoff, alignment"
      }));
    }
  }, [open, tier]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      let pipeline;
      try {
        pipeline = JSON.parse(formData.pipeline);
      } catch {
        toast.error("Invalid pipeline JSON");
        return;
      }

      await onSubmit({
        businessId,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        trigger: {
          type: formData.triggerType,
          cron: formData.triggerType === "schedule" ? formData.cron : undefined,
          eventKey: formData.triggerType === "webhook" ? formData.eventKey : undefined
        },
        approval: {
          required: formData.approvalRequired,
          threshold: formData.approvalThreshold
        },
        pipeline,
        template: formData.saveAsTemplate,
        tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean)
      });

      toast.success("Workflow created successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to create workflow");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Workflow</DialogTitle>
          <DialogDescription>Define your workflow configuration</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Workflow name"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Workflow description"
            />
          </div>

          <div>
            <Label htmlFor="triggerType">Trigger Type</Label>
            <Select
              value={formData.triggerType}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, triggerType: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="schedule">Schedule</SelectItem>
                <SelectItem value="webhook">Webhook</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="pipeline">Pipeline (JSON)</Label>
            <Textarea
              id="pipeline"
              value={formData.pipeline}
              onChange={(e) => setFormData(prev => ({ ...prev, pipeline: e.target.value }))}
              placeholder="Pipeline configuration"
              className="font-mono text-sm"
              rows={10}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="approvalRequired"
              checked={formData.approvalRequired}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, approvalRequired: checked }))}
            />
            <Label htmlFor="approvalRequired">Require Approval</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Create Workflow</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
