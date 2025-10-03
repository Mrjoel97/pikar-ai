import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Props = {
  isGuest: boolean;
  approvals: any[] | undefined;
  auditLatest: any[] | undefined;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
};

export function ApprovalsAudit({ isGuest, approvals, auditLatest, onApprove, onReject }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Pending Approvals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isGuest ? (
            <div className="text-sm text-muted-foreground">Demo: 4 pending enterprise approvals.</div>
          ) : approvals === undefined ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : approvals.length === 0 ? (
            <div className="text-sm text-muted-foreground">None pending.</div>
          ) : (
            approvals.slice(0, 3).map((a: any) => (
              <div key={a._id} className="flex items-center justify-between border rounded-md p-2">
                <span className="text-sm">WF {String(a.workflowId).slice(-6)}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{a.priority}</Badge>
                  {!isGuest && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => onApprove(a._id)}>Approve</Button>
                      <Button size="sm" variant="destructive" onClick={() => onReject(a._id)}>Reject</Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Recent Audit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isGuest ? (
            <div className="text-sm text-muted-foreground">Demo: Policy update, Role change, Integration key rotated.</div>
          ) : auditLatest === undefined ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : auditLatest.length === 0 ? (
            <div className="text-sm text-muted-foreground">No recent events.</div>
          ) : (
            auditLatest.slice(0, 3).map((e: any) => (
              <div key={e._id} className="text-xs text-muted-foreground">
                {new Date(e.createdAt).toLocaleDateString()} — {e.entityType}: {e.action}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
