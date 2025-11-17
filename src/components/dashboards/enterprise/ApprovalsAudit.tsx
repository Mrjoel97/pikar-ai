import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ApprovalsAuditProps {
  isGuest: boolean;
  approvals: any[] | undefined;
  auditLatest: any[] | undefined;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function ApprovalsAudit({
  isGuest,
  approvals,
  auditLatest,
  onApprove,
  onReject,
}: ApprovalsAuditProps) {
  if (isGuest) {
    return (
      <div className="text-sm text-muted-foreground">
        Sign in to view approvals and audit trail
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-2">Pending Approvals</h4>
        {!approvals || approvals.length === 0 ? (
          <div className="text-sm text-muted-foreground">No pending approvals</div>
        ) : (
          <div className="space-y-2">
            {approvals.slice(0, 3).map((approval: any) => (
              <div key={approval._id?.toString() || `approval-${Math.random()}`} className="flex items-center justify-between text-sm">
                <span className="truncate">{approval.workflowName || "Workflow"}</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => onApprove(approval._id)}>
                    Approve
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onReject(approval._id)}>
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <h4 className="text-sm font-medium mb-2">Recent Audit Events</h4>
        {!auditLatest || auditLatest.length === 0 ? (
          <div className="text-sm text-muted-foreground">No recent events</div>
        ) : (
          <div className="space-y-1">
            {auditLatest.map((event: any) => (
              <div key={event._id?.toString() || `event-${Math.random()}`} className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className="text-xs">
                  {event.action}
                </Badge>
                <span className="text-muted-foreground truncate">{event.details}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}