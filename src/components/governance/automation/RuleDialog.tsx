import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateRule: (rule: any) => void;
}

export function RuleDialog({ open, onOpenChange, onCreateRule }: RuleDialogProps) {
  const [newRule, setNewRule] = useState({
    name: "",
    description: "",
    ruleType: "approval_required" as const,
    severity: "medium" as const,
    enabled: true,
    autoRemediate: false,
  });

  const handleCreate = () => {
    onCreateRule(newRule);
    setNewRule({
      name: "",
      description: "",
      ruleType: "approval_required",
      severity: "medium",
      enabled: true,
      autoRemediate: false,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Governance Rule</DialogTitle>
          <DialogDescription>
            Define a new automated governance policy
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Rule Name</Label>
            <Input
              value={newRule.name}
              onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
              placeholder="e.g., Require Dual Approval"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={newRule.description}
              onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
              placeholder="Describe what this rule enforces..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Rule Type</Label>
              <Select
                value={newRule.ruleType}
                onValueChange={(value: any) => setNewRule({ ...newRule, ruleType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approval_required">Approval Required</SelectItem>
                  <SelectItem value="sla_enforcement">SLA Enforcement</SelectItem>
                  <SelectItem value="role_separation">Role Separation</SelectItem>
                  <SelectItem value="data_retention">Data Retention</SelectItem>
                  <SelectItem value="access_control">Access Control</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select
                value={newRule.severity}
                onValueChange={(value: any) => setNewRule({ ...newRule, severity: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label>Auto-Remediate</Label>
            <Switch
              checked={newRule.autoRemediate}
              onCheckedChange={(checked) => setNewRule({ ...newRule, autoRemediate: checked })}
            />
          </div>
          <Button onClick={handleCreate} className="w-full">
            Create Rule
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
