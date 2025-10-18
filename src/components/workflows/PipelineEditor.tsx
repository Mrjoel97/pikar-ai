import { useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface PipelineEditorProps {
  workflow: any;
  pipeline: any[];
  businesses?: any[];
  onUpdatePipeline: (pipeline: any[]) => void;
  onSave: () => void;
  onAddApproval: () => void;
  onAddSecondApproval?: () => void;
  onAddDelay: (minutes: number) => void;
}

function getStepKind(s: any) {
  return s?.kind || s?.type;
}

function getDefaultApproverForTier(tier?: string) {
  switch (tier) {
    case "solopreneur": return "Owner";
    case "startup": return "Manager";
    case "sme": return "Team Lead";
    case "enterprise": return "Compliance Lead";
    default: return "Manager";
  }
}

export function PipelineEditor({
  workflow,
  pipeline,
  businesses,
  onUpdatePipeline,
  onSave,
  onAddApproval,
  onAddSecondApproval,
  onAddDelay,
}: PipelineEditorProps) {
  const tier = (businesses?.[0]?.tier as string | undefined);

  const setStepField = (index: number, patch: Record<string, any>) => {
    const updated = [...pipeline];
    updated[index] = { ...updated[index], ...patch };
    onUpdatePipeline(updated);
  };

  const toggleMMR = (index: number, value: boolean) => {
    const updated = [...pipeline];
    const step = { ...updated[index] };
    step.mmrRequired = value;
    const next = updated[index + 1];
    const nextKind = next?.kind || next?.type;

    if (value) {
      if (nextKind !== "approval") {
        updated.splice(index + 1, 0, { 
          kind: "approval", 
          approverRole: getDefaultApproverForTier(tier), 
          autoInserted: true 
        });
      }
    } else {
      if (nextKind === "approval" && next?.autoInserted) {
        updated.splice(index + 1, 1);
      }
    }

    updated[index] = step;
    onUpdatePipeline(updated);
  };

  const addStep = (index: number, kind: "agent" | "approval" | "delay" | "branch") => {
    const defaultApproval = getDefaultApproverForTier(tier);
    const updated = [...pipeline];
    const base: any = kind === "agent" ? { kind: "agent", title: "New Agent Step", agentPrompt: "" }
      : kind === "approval" ? { kind: "approval", approverRole: defaultApproval }
      : kind === "delay" ? { kind: "delay", delayMinutes: 60 }
      : { kind: "branch", condition: { metric: "metric", op: ">", value: 0 }, onTrueNext: (index + 2), onFalseNext: (index + 3) };
    updated.splice(index + 1, 0, base);
    onUpdatePipeline(updated);
  };

  const removeStep = (index: number) => {
    if (pipeline.length <= 1) return;
    const updated = [...pipeline];
    updated.splice(index, 1);
    onUpdatePipeline(updated);
  };

  const moveStep = (index: number, delta: number) => {
    const newIndex = index + delta;
    if (newIndex < 0 || newIndex >= pipeline.length) return;
    const updated = [...pipeline];
    const [item] = updated.splice(index, 1);
    updated.splice(newIndex, 0, item);
    onUpdatePipeline(updated);
  };

  return (
    <div className="border-t pt-3 space-y-2">
      {pipeline.map((step: any, idx: number) => (
        <div key={idx} className="flex items-center justify-between p-2 border rounded">
          <div className="text-sm">
            <div className="font-medium capitalize">{getStepKind(step)}</div>
            {getStepKind(step) === "branch" && (
              <div className="text-xs text-muted-foreground">
                IF {step?.condition?.metric} {step?.condition?.op} {String(step?.condition?.value)} THEN → {step?.onTrueNext} ELSE → {step?.onFalseNext}
              </div>
            )}
            {getStepKind(step) === "approval" && (
              <div className="text-xs text-muted-foreground">Approver: {step?.approverRole || step?.config?.approverRole || "manager"}</div>
            )}
            {getStepKind(step) === "delay" && (
              <div className="text-xs text-muted-foreground">Delay: {step?.delayMinutes || step?.config?.delayMinutes || 0} min</div>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Input
              className="h-8 w-64"
              placeholder="Step title (optional)"
              value={step?.title || ""}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setStepField(idx, { title: e.target.value })}
            />
            {getStepKind(step) === "approval" && (
              <Input
                className="h-8 w-56"
                placeholder="Approver role"
                value={step?.approverRole || step?.config?.approverRole || ""}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setStepField(idx, { approverRole: e.target.value })}
              />
            )}
            {getStepKind(step) === "delay" && (
              <Input
                type="number"
                className="h-8 w-40"
                placeholder="Delay minutes"
                value={String(step?.delayMinutes ?? step?.config?.delayMinutes ?? 0)}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setStepField(idx, { delayMinutes: parseInt(e.target.value) || 0 })}
              />
            )}
          </div>
          {getStepKind(step) === "agent" && (
            <div className="flex items-center gap-2">
              <Switch checked={!!step?.mmrRequired} onCheckedChange={(v: boolean) => toggleMMR(idx, !!v)} id={`mmr-${workflow._id}-${idx}`} />
              <Label htmlFor={`mmr-${workflow._id}-${idx}`}>Require human review</Label>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" onClick={() => addStep(idx, "agent")}>+Agent</Button>
            <Button size="sm" variant="outline" onClick={() => addStep(idx, "approval")}>+Approval</Button>
            <Button size="sm" variant="outline" onClick={() => addStep(idx, "delay")}>+Delay</Button>
            <Button size="sm" variant="outline" onClick={() => addStep(idx, "branch")}>+Branch</Button>
            <Button size="sm" variant="outline" onClick={() => moveStep(idx, -1)}>Up</Button>
            <Button size="sm" variant="outline" onClick={() => moveStep(idx, 1)}>Down</Button>
            <Button size="sm" variant="destructive" onClick={() => removeStep(idx)}>Remove</Button>
          </div>
        </div>
      ))}
      
      <div className="flex flex-wrap gap-2 pt-1">
        <Button size="sm" variant="outline" onClick={onAddApproval}>Add Approval</Button>
        {tier === "enterprise" && onAddSecondApproval && (
          <Button size="sm" variant="outline" onClick={onAddSecondApproval}>
            Add Second Approval
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={() => {
          const minDelay = tier === "enterprise" ? 60 : 30;
          onAddDelay(minDelay);
        }}>
          Add SLA Delay
        </Button>
        <Button size="sm" onClick={onSave}>Save pipeline</Button>
      </div>
    </div>
  );
}
