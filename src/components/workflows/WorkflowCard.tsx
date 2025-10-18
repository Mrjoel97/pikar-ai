import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, Webhook, BarChart3 } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface WorkflowCardProps {
  workflow: any;
  businesses?: any[];
  expanded: boolean;
  editedPipeline?: any[];
  onToggleExpand: () => void;
  onSimulate: () => void;
  onComplianceCheck: () => void;
  onEstimateRoi: () => void;
  onViewExecutions: () => void;
  onSavePipeline: () => void;
  onEditPipeline: (pipeline: any[]) => void;
  roleFilter: string;
  onRoleFilterChange: (role: string) => void;
}

function getTriggerIcon(type: string) {
  switch (type) {
    case "manual":
      return <Play className="h-4 w-4 text-muted-foreground" />;
    case "schedule":
      return <Clock className="h-4 w-4 text-muted-foreground" />;
    case "webhook":
      return <Webhook className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Play className="h-4 w-4 text-muted-foreground" />;
  }
}

function estimateRoiBadge(wf: any): { label: string; variant: "default" | "secondary" | "destructive" } {
  const steps = Array.isArray(wf?.pipeline) ? wf.pipeline.length : 0;
  const approvals = (wf?.pipeline || []).filter((s: any) => (s?.kind || s?.type) === "approval").length;
  const score = steps + approvals * 1.5;
  if (score >= 6) return { label: "Est. ROI: High", variant: "default" };
  if (score >= 3) return { label: "Est. ROI: Medium", variant: "secondary" };
  return { label: "Est. ROI: Quick Win", variant: "secondary" };
}

function extractApproverRoles(wf: any): string[] {
  const roles = new Set<string>();
  const steps: any[] = Array.isArray(wf?.pipeline) ? wf.pipeline : [];
  for (const s of steps) {
    const kind = s?.kind || s?.type;
    if (kind === "approval") {
      const role = s?.approverRole || s?.config?.approverRole;
      if (role && typeof role === "string") roles.add(role);
    }
  }
  return Array.from(roles);
}

function getHandoffIssues(wf: any) {
  const steps: any[] = Array.isArray(wf?.pipeline) ? wf.pipeline : [];
  const hasApproval = steps.some((s) => (s?.kind || s?.type) === "approval");
  const approvalsMissingRole = steps.some((s) => {
    const k = s?.kind || s?.type;
    const role = s?.approverRole || s?.config?.approverRole;
    return k === "approval" && (!role || String(role).trim().length === 0);
  });
  const hasSlaDelay = steps.some((s) => {
    const k = s?.kind || s?.type;
    const delay = s?.delayMinutes ?? s?.config?.delayMinutes ?? 0;
    return k === "delay" && delay > 0;
  });
  const hasDescription = !!(wf?.description && String(wf.description).trim().length > 0);

  const issues: string[] = [];
  if (!hasApproval) issues.push("Missing approval step");
  if (approvalsMissingRole) issues.push("Approver role missing");
  if (!hasSlaDelay) issues.push("Missing SLA delay");
  if (!hasDescription) issues.push("Description missing");
  return issues;
}

export function WorkflowCard({
  workflow,
  businesses,
  expanded,
  editedPipeline,
  onToggleExpand,
  onSimulate,
  onComplianceCheck,
  onEstimateRoi,
  onViewExecutions,
  onSavePipeline,
  onEditPipeline,
  roleFilter,
  onRoleFilterChange,
}: WorkflowCardProps) {
  const tier = (businesses?.[0]?.tier as string | undefined);
  const issues = getHandoffIssues(workflow);
  const roles = extractApproverRoles(workflow);
  const roi = estimateRoiBadge(workflow);
  const label = (tier === "sme" || tier === "enterprise") ? "Governance Health" : "Handoff Health";

  return (
    <Card className="p-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getTriggerIcon(workflow.trigger.type)}
            <CardTitle className="text-lg">{workflow.name}</CardTitle>
            {workflow.template && <Badge variant="secondary">Template</Badge>}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onSimulate}>
              Simulate
            </Button>
            <Button size="sm" variant="outline" onClick={onComplianceCheck}>
              Check Compliance
            </Button>
            <Button size="sm" variant="outline" onClick={onEstimateRoi}>
              Estimate ROI
            </Button>
            <Button size="sm" variant="outline" onClick={onViewExecutions}>
              <BarChart3 className="h-4 w-4 mr-1" />
              Executions
            </Button>
            <Button size="sm" variant="outline" onClick={onToggleExpand}>
              {expanded ? "Hide" : "Pipeline"}
            </Button>
          </div>
        </div>
        {workflow.description && (
          <CardDescription>{workflow.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Steps: {workflow.pipeline?.length ?? 0}</span>
          <span>Trigger: {workflow.trigger.type}</span>
          {workflow.trigger.cron && <span>Schedule: {workflow.trigger.cron}</span>}
          {workflow.trigger.eventKey && <span>Event: {workflow.trigger.eventKey}</span>}
          {workflow.approval.required && <span>Approval Required</span>}
        </div>
        
        <div className="mt-2">
          <Badge variant={roi.variant}>{roi.label}</Badge>
        </div>

        {issues.length === 0 ? (
          <div className="mt-2">
            <Badge variant="secondary" className="text-xs">{label}: Good</Badge>
          </div>
        ) : (
          <div className="mt-2 flex flex-wrap gap-1">
            <Badge variant="destructive" className="text-xs">{label}: Needs Attention</Badge>
            {issues.map((it, i) => (
              <Badge key={i} variant="outline" className="text-xs">{it}</Badge>
            ))}
          </div>
        )}

        {workflow.tags?.length > 0 && (
          <div className="flex gap-1 mt-2">
            {(workflow.tags ?? []).map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}

        {roles.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {roles.map((r) => (
              <Button
                key={r}
                size="sm"
                variant={roleFilter === r ? "default" : "outline"}
                className="h-7"
                onClick={() => onRoleFilterChange(r)}
              >
                {r}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
