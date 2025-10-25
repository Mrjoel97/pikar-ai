import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { OverviewTab } from "./automation/OverviewTab";
import { RulesTab } from "./automation/RulesTab";
import { ViolationsTab } from "./automation/ViolationsTab";
import { SettingsTab } from "./automation/SettingsTab";
import { AuditTab } from "./automation/AuditTab";

interface GovernanceAutomationSettingsProps {
  businessId: Id<"businesses">;
}

export function GovernanceAutomationSettings({ businessId }: GovernanceAutomationSettingsProps) {
  const settings = useQuery(api.governanceAutomation.getAutomationSettings, { businessId });
  const rules = useQuery(api.governanceRules.getRules, { businessId });
  const violations = useQuery(api.governanceRules.getRuleViolations, { businessId, limit: 50 });
  const scoreTrend = useQuery(api.governanceAutomation.getGovernanceScoreTrend, { businessId, days: 30 });
  const escalations = useQuery(api.governanceAutomation.getEscalations, { businessId, status: "pending" });
  
  const updateSettings = useMutation(api.governanceAutomation.updateAutomationSettings);
  const defineRule = useMutation(api.governanceRules.defineRule);
  const updateRule = useMutation(api.governanceRules.updateRule);
  const deleteRule = useMutation(api.governanceRules.deleteRule);
  const dismissViolation = useMutation(api.governanceRules.dismissViolation);

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

  const handleCreateRule = async (newRule: any) => {
    try {
      await defineRule({
        businessId,
        ...newRule,
        conditions: {},
        actions: [],
      });
      toast.success("Rule created successfully");
    } catch (error) {
      toast.error("Failed to create rule");
    }
  };

  const handleToggleRule = async (ruleId: Id<"governanceRules">, enabled: boolean) => {
    try {
      await updateRule({ ruleId, enabled });
      toast.success(enabled ? "Rule enabled" : "Rule disabled");
    } catch (error) {
      toast.error("Failed to update rule");
    }
  };

  const handleDeleteRule = async (ruleId: Id<"governanceRules">) => {
    try {
      await deleteRule({ ruleId });
      toast.success("Rule deleted");
    } catch (error) {
      toast.error("Failed to delete rule");
    }
  };

  const handleDismissViolation = async (violationId: Id<"governanceViolations">) => {
    const reason = prompt("Enter dismissal reason:");
    if (!reason) return;
    
    try {
      await dismissViolation({ violationId, reason });
      toast.success("Violation dismissed");
    } catch (error) {
      toast.error("Failed to dismiss violation");
    }
  };

  const handleAutoRemediateChange = (key: string, value: boolean) => {
    setAutoRemediate({ ...autoRemediate, [key]: value });
  };

  if (!settings || !rules || !violations || !scoreTrend) {
    return <div>Loading...</div>;
  }

  const openViolations = violations.filter((v: any) => v.status === "open");
  const criticalViolations = openViolations.filter((v: any) => v.severity === "critical");

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="rules">Rules</TabsTrigger>
        <TabsTrigger value="violations">Violations</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
        <TabsTrigger value="audit">Audit Trail</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <OverviewTab
          scoreTrend={scoreTrend}
          openViolations={openViolations}
          criticalViolations={criticalViolations}
          rules={rules}
          escalations={escalations}
        />
      </TabsContent>

      <TabsContent value="rules">
        <RulesTab
          rules={rules}
          onToggleRule={handleToggleRule}
          onDeleteRule={handleDeleteRule}
          onCreateRule={handleCreateRule}
        />
      </TabsContent>

      <TabsContent value="violations">
        <ViolationsTab
          openViolations={openViolations}
          onDismissViolation={handleDismissViolation}
        />
      </TabsContent>

      <TabsContent value="settings">
        <SettingsTab
          autoRemediate={autoRemediate}
          escalationThreshold={escalationThreshold}
          escalateTo={escalateTo}
          onAutoRemediateChange={handleAutoRemediateChange}
          onEscalationThresholdChange={setEscalationThreshold}
          onEscalateToChange={setEscalateTo}
          onSave={handleSave}
        />
      </TabsContent>

      <TabsContent value="audit">
        <AuditTab violations={violations} />
      </TabsContent>
    </Tabs>
  );
}