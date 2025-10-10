import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GovernanceScoreCard } from "@/components/governance/GovernanceScoreCard";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

interface GovernancePanelProps {
  businessId: Id<"businesses"> | undefined;
  isGuest: boolean;
  governanceAutomationEnabled: boolean;
  hasTier: (tier: string) => boolean;
  LockedRibbon: ({ label }: { label?: string }) => React.ReactElement;
}

export function GovernancePanel({ 
  businessId, 
  isGuest, 
  governanceAutomationEnabled,
  hasTier,
  LockedRibbon 
}: GovernancePanelProps) {
  const pendingApprovals = useQuery(
    api.approvals.getApprovalQueue,
    isGuest || !businessId
      ? undefined
      : { businessId, status: "pending" as const }
  );

  const auditHighlights = useQuery(
    api.audit.listForBusiness,
    isGuest || !businessId
      ? undefined
      : { businessId, limit: 5 }
  );

  const auditLatest = !isGuest && businessId ? useQuery(api.audit.listForBusiness, { businessId, limit: 10 }) : undefined;

  const pendingEscalations = useQuery(
    api.governanceAutomation.getEscalations,
    !isGuest && businessId ? { businessId, status: "pending" as const } : undefined
  );

  const approveSelf = useMutation(api.approvals.approveSelf);
  const rejectSelf = useMutation(api.approvals.rejectSelf);

  return (
    <>
      {/* Governance Score Card - gated by feature flag */}
      {businessId && governanceAutomationEnabled && (
        <div className="grid gap-6 md:grid-cols-2">
          <GovernanceScoreCard businessId={businessId} days={30} />
          
          {/* Escalations Alert */}
          {pendingEscalations && pendingEscalations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  Governance Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-yellow-600">
                    {pendingEscalations.length}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Escalation{pendingEscalations.length !== 1 ? "s" : ""} pending review
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const governanceSection = document.getElementById("governance-panel");
                      governanceSection?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Show locked ribbon if governance automation is not enabled */}
      {businessId && !governanceAutomationEnabled && !isGuest && (
        <Card className="border-dashed border-2 border-amber-300">
          <CardContent className="p-4">
            <LockedRibbon label="Governance Automation requires SME tier or higher" />
          </CardContent>
        </Card>
      )}

      {/* Governance Panel */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Governance Panel</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle>Checklist Progress</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {isGuest ? (
                <div>MMR enforced, SLA ≥ 24h, Approver roles configured. 4/5 checks passed.</div>
              ) : (
                <div>Key policies enforced. SLA floors and approvals configured. Review workflows for issues.</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle>Audit Highlights</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {isGuest ? (
                <>
                  <div className="text-xs text-muted-foreground">Policy update recorded</div>
                  <div className="text-xs text-muted-foreground">Approval overdue warning sent</div>
                </>
              ) : !auditLatest ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : auditLatest.length === 0 ? (
                <div className="text-sm text-muted-foreground">No recent events.</div>
              ) : (
                auditLatest.slice(0, 6).map((e: any) => (
                  <div key={e._id} className="text-xs text-muted-foreground">
                    {new Date(e.createdAt).toLocaleDateString()} — {e.entityType}: {e.action}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Governance & Audit data hooks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Governance Panel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isGuest ? (
              <div className="text-sm text-muted-foreground">
                Demo: 3 pending approvals across departments.
              </div>
            ) : !pendingApprovals ? (
              <div className="text-sm text-muted-foreground">Loading approvals…</div>
            ) : pendingApprovals.length === 0 ? (
              <div className="text-sm text-muted-foreground">No pending approvals.</div>
            ) : (
              pendingApprovals.slice(0, 6).map((a: any) => (
                <div key={a._id} className="flex items-center justify-between border rounded-md p-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Workflow {String(a.workflowId).slice(-6)}</span>
                    <span className="text-xs text-muted-foreground">
                      Step {String(a.stepId).slice(-6)} • Requested {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        a.priority === "urgent" ? "border-red-300 text-red-700" :
                        a.priority === "high" ? "border-amber-300 text-amber-700" :
                        "border-slate-300 text-slate-700"
                      }
                    >
                      {a.priority}
                    </Badge>
                    {!isGuest && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              await approveSelf({ id: a._id });
                              toast.success("Approved");
                            } catch (e: any) {
                              toast.error(e?.message || "Failed to approve");
                            }
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            try {
                              await rejectSelf({ id: a._id });
                              toast.success("Rejected");
                            } catch (e: any) {
                              toast.error(e?.message || "Failed to reject");
                            }
                          }}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
            {/* Add: gating ribbon if governance approval actions are Enterprise+ */}
            {!isGuest && !hasTier("enterprise") && (
              <div className="pt-2 border-t mt-2">
                <LockedRibbon label="Advanced governance automation is Enterprise+" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audit Trail Highlights */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Audit Trail Highlights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isGuest ? (
              <div className="text-sm text-muted-foreground">
                Demo: 5 latest policy and permission changes.
              </div>
            ) : !auditHighlights ? (
              <div className="text-sm text-muted-foreground">Loading audit logs…</div>
            ) : auditHighlights.length === 0 ? (
              <div className="text-sm text-muted-foreground">No recent audit events.</div>
            ) : (
              auditHighlights.map((e: any) => (
                <div key={e._id} className="flex items-start gap-3">
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {new Date(e.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{e.entityType}</div>
                    <div className="text-xs text-muted-foreground">{e.action}</div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
