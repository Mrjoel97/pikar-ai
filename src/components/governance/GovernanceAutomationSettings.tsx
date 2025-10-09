import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Settings, Save } from "lucide-react";

interface GovernanceAutomationSettingsProps {
  businessId: Id<"businesses">;
}

export function GovernanceAutomationSettings({ businessId }: GovernanceAutomationSettingsProps) {
  const settings = useQuery(api.governanceAutomation.getAutomationSettings, { businessId });
  const updateSettings = useMutation(api.governanceAutomation.updateAutomationSettings);

  const [autoRemediate, setAutoRemediate] = useState({
    missing_approval: false,
    insufficient_sla: false,
    insufficient_approvals: false,
    role_diversity: false,
  });

  const [escalationThreshold, setEscalationThreshold] = useState(3);
  const [escalateTo, setEscalateTo] = useState("senior_admin");

  // Update local state when settings load
  useEffect(() => {
    if (settings) {
      setAutoRemediate(settings.autoRemediate);
      setEscalationThreshold(settings.escalationRules.threshold);
      setEscalateTo(settings.escalationRules.escalateTo);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings({
        businessId,
        autoRemediate,
        escalationRules: {
          threshold: escalationThreshold,
          escalateTo,
        },
      });
      toast.success("Automation settings saved");
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

  if (!settings) {
    return <div>Loading...</div>;
  }

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
              onCheckedChange={(checked) =>
                setAutoRemediate({ ...autoRemediate, missing_approval: checked })
              }
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
              onCheckedChange={(checked) =>
                setAutoRemediate({ ...autoRemediate, insufficient_sla: checked })
              }
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
              onCheckedChange={(checked) =>
                setAutoRemediate({ ...autoRemediate, insufficient_approvals: checked })
              }
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
              onCheckedChange={(checked) =>
                setAutoRemediate({ ...autoRemediate, role_diversity: checked })
              }
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
              onChange={(e) => setEscalationThreshold(parseInt(e.target.value) || 1)}
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
              onChange={(e) => setEscalateTo(e.target.value)}
              placeholder="Role or user ID"
            />
            <p className="text-xs text-muted-foreground">
              Role or user to notify when violations are escalated
            </p>
          </div>
        </div>

        <Button onClick={handleSave} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
}