import { Badge } from "@/components/ui/badge";

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

interface StartupHealthCheckProps {
  workflows: any[];
}

export function StartupHealthCheck({ workflows }: StartupHealthCheckProps) {
  const list = Array.isArray(workflows) ? workflows : [];
  
  const hasApproval = list.some((wf: any) => {
    const steps = wf?.pipeline || [];
    return steps.some((s: any) => (s?.kind || s?.type) === "approval");
  });
  
  const rolesDefined = list.some((wf: any) => {
    const steps = wf?.pipeline || [];
    return steps.some((s: any) => {
      const k = s?.kind || s?.type;
      const role = s?.approverRole || s?.config?.approverRole;
      return k === "approval" && !!role;
    });
  });
  
  const hasSlaDelay = list.some((wf: any) => {
    const steps = wf?.pipeline || [];
    return steps.some((s: any) => (s?.kind || s?.type) === "delay" && ((s?.delayMinutes ?? s?.config?.delayMinutes ?? 0) > 0));
  });
  
  const hasDescriptions = list.every((wf: any) => !!(wf?.description && String(wf.description).trim().length > 0));

  const items = [
    { label: "At least one approval step", pass: hasApproval },
    { label: "Approver roles filled", pass: rolesDefined },
    { label: "SLA buffer (delay) present", pass: hasSlaDelay },
    { label: "Workflow descriptions added", pass: hasDescriptions },
  ];

  return (
    <div className="border rounded-md p-3 bg-muted/20">
      <div className="text-sm font-medium mb-2">Consistency & Alignment</div>
      <div className="grid gap-1">
        {items.map((it, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span>{it.label}</span>
            <Badge variant={it.pass ? "default" : "destructive"} className="text-[10px]">
              {it.pass ? "OK" : "Missing"}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

interface GovernanceHealthCheckProps {
  workflows: any[];
  tier: string;
}

export function GovernanceHealthCheck({ workflows, tier }: GovernanceHealthCheckProps) {
  const list: any[] = Array.isArray(workflows) ? workflows : [];

  const allHaveApproval = list.length > 0 && list.every((wf) => {
    const steps = wf?.pipeline || [];
    return steps.some((s: any) => (s?.kind || s?.type) === "approval");
  });

  const allRolesDefined = list.length > 0 && list.every((wf) => {
    const steps = wf?.pipeline || [];
    return steps.every((s: any) => {
      const k = s?.kind || s?.type;
      if (k !== "approval") return true;
      const role = s?.approverRole || s?.config?.approverRole;
      return !!role;
    });
  });

  const minDelay = tier === "enterprise" ? 60 : 30;
  const allHaveSla = list.length > 0 && list.every((wf) => {
    const steps = wf?.pipeline || [];
    return steps.some((s: any) => {
      const k = s?.kind || s?.type;
      const delay = s?.delayMinutes ?? s?.config?.delayMinutes ?? 0;
      return k === "delay" && delay >= minDelay;
    });
  });

  const allDescribed = list.length > 0 && list.every((wf) => !!(wf?.description && String(wf.description).trim().length > 0));

  const enterpriseApprovalsOk = tier !== "enterprise" || (list.length > 0 && list.every((wf) => {
    const threshold = wf?.approval?.threshold ?? 0;
    const approvals = (wf?.pipeline || []).filter((s: any) => (s?.kind || s?.type) === "approval").length;
    return threshold >= 2 || approvals >= 2;
  }));

  const items = [
    { label: "Approval steps present", pass: allHaveApproval },
    { label: "Approver roles filled", pass: allRolesDefined },
    { label: `SLA delay present (≥ ${minDelay}m)`, pass: allHaveSla },
    { label: "Descriptions added", pass: allDescribed },
    ...(tier === "enterprise" ? [{ label: "Multi-approver (≥ 2)", pass: enterpriseApprovalsOk }] : []),
  ];

  return (
    <div className="border rounded-md p-3 bg-muted/20">
      <div className="text-sm font-medium mb-2">Governance Policy</div>
      <div className="grid gap-1">
        {items.map((it, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span>{it.label}</span>
            <Badge variant={it.pass ? "default" : "destructive"} className="text-[10px]">
              {it.pass ? "OK" : "Missing"}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
