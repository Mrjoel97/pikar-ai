import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";
import { RuleDialog } from "./RuleDialog";

interface RulesTabProps {
  rules: any[];
  onToggleRule: (ruleId: Id<"governanceRules">, enabled: boolean) => void;
  onDeleteRule: (ruleId: Id<"governanceRules">) => void;
  onCreateRule: (rule: any) => void;
}

export function RulesTab({ rules, onToggleRule, onDeleteRule, onCreateRule }: RulesTabProps) {
  const [showRuleDialog, setShowRuleDialog] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Governance Rules</h3>
          <p className="text-sm text-muted-foreground">
            Define and manage automated governance policies
          </p>
        </div>
        <Button onClick={() => setShowRuleDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Rule
        </Button>
      </div>

      <div className="space-y-3">
        {rules.map((rule) => (
          <Card key={rule._id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold">{rule.name}</h4>
                    <Badge variant={rule.severity === "critical" ? "destructive" : "secondary"}>
                      {rule.severity}
                    </Badge>
                    <Badge variant="outline">{rule.ruleType.replace(/_/g, " ")}</Badge>
                    {rule.autoRemediate && (
                      <Badge variant="default" className="bg-blue-500">
                        Auto-Remediate
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{rule.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Violations: {rule.violationCount}</span>
                    <span>Last evaluated: {new Date(rule.lastEvaluated).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={(checked) => onToggleRule(rule._id, checked)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteRule(rule._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <RuleDialog
        open={showRuleDialog}
        onOpenChange={setShowRuleDialog}
        onCreateRule={onCreateRule}
      />
    </div>
  );
}
