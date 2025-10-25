import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings, Save } from "lucide-react";

interface SettingsTabProps {
  autoRemediate: {
    missing_approval: boolean;
    insufficient_sla: boolean;
    insufficient_approvals: boolean;
    role_diversity: boolean;
  };
  escalationThreshold: number;
  escalateTo: string;
  onAutoRemediateChange: (key: string, value: boolean) => void;
  onEscalationThresholdChange: (value: number) => void;
  onEscalateToChange: (value: string) => void;
  onSave: () => void;
}

export function SettingsTab({
  autoRemediate,
  escalationThreshold,
  escalateTo,
  onAutoRemediateChange,
  onEscalationThresholdChange,
  onEscalateToChange,
  onSave,
}: SettingsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Governance Automation Settings
        </CardTitle>
        <CardDescription>
          Configure automatic remediation and escalation rules for governance violations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Auto-Remediation Toggles */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Auto-Remediate Violations</h3>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="missing_approval" className="flex-1">
              Missing Approval Steps
              <p className="text-xs text-muted-foreground">Automatically add required approval steps</p>
            </Label>
            <Switch
              id="missing_approval"
              checked={autoRemediate.missing_approval}
              onCheckedChange={(checked) => onAutoRemediateChange("missing_approval", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="insufficient_sla" className="flex-1">
              Insufficient SLA
              <p className="text-xs text-muted-foreground">Update SLA hours to meet tier requirements</p>
            </Label>
            <Switch
              id="insufficient_sla"
              checked={autoRemediate.insufficient_sla}
              onCheckedChange={(checked) => onAutoRemediateChange("insufficient_sla", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="insufficient_approvals" className="flex-1">
              Insufficient Approvals (Enterprise)
              <p className="text-xs text-muted-foreground">Add second approval for enterprise workflows</p>
            </Label>
            <Switch
              id="insufficient_approvals"
              checked={autoRemediate.insufficient_approvals}
              onCheckedChange={(checked) => onAutoRemediateChange("insufficient_approvals", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="role_diversity" className="flex-1">
              Role Diversity
              <p className="text-xs text-muted-foreground">Ensure different roles for approval steps</p>
            </Label>
            <Switch
              id="role_diversity"
              checked={autoRemediate.role_diversity}
              onCheckedChange={(checked) => onAutoRemediateChange("role_diversity", checked)}
            />
          </div>
        </div>

        {/* Escalation Rules */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Escalation Rules</h3>
          
          <div className="space-y-2">
            <Label htmlFor="threshold">Violation Threshold</Label>
            <Input
              id="threshold"
              type="number"
              min={1}
              value={escalationThreshold}
              onChange={(e) => onEscalationThresholdChange(parseInt(e.target.value) || 1)}
              placeholder="Number of violations before escalation"
            />
            <p className="text-xs text-muted-foreground">
              Escalate after this many violations of the same type
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="escalateTo">Escalate To</Label>
            <Input
              id="escalateTo"
              value={escalateTo}
              onChange={(e) => onEscalateToChange(e.target.value)}
              placeholder="Role or user ID"
            />
            <p className="text-xs text-muted-foreground">
              Role or user to notify when violations are escalated
            </p>
          </div>
        </div>

        {/* SLA Information */}
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <h4 className="text-sm font-semibold">Escalation SLA</h4>
          <p className="text-xs text-muted-foreground">
            Escalations must be resolved within <strong>48 hours</strong> of creation.
            Overdue escalations will be highlighted in the queue.
          </p>
        </div>

        <Button onClick={onSave} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
}
