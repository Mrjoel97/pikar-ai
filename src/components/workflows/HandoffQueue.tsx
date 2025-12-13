import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, ArrowRight, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

interface HandoffQueueProps {
  businessId?: Id<"businesses">;
  department?: string;
}

export function HandoffQueue({ businessId, department }: HandoffQueueProps) {
  const pendingHandoffs = useQuery(
    api.workflowHandoffs.getPendingHandoffs,
    businessId ? { businessId, department } : "skip"
  );
  const slaCompliance = useQuery(
    api.workflowHandoffs.checkSlaCompliance,
    businessId ? { businessId } : "skip"
  );
  const bottlenecks = useQuery(
    api.workflowHandoffs.detectBottlenecks,
    businessId ? { businessId } : "skip"
  );
  const acceptHandoff = useMutation(api.workflowHandoffs.acceptHandoff);
  const rejectHandoff = useMutation(api.workflowHandoffs.rejectHandoff);

  const handleAccept = async (handoffId: Id<"workflowHandoffs">) => {
    try {
      await acceptHandoff({ handoffId });
      toast.success("Handoff accepted successfully");
    } catch (error) {
      toast.error("Failed to accept handoff");
      console.error(error);
    }
  };

  const handleReject = async (handoffId: Id<"workflowHandoffs">) => {
    try {
      await rejectHandoff({ handoffId });
      toast.error("Handoff rejected");
    } catch (error) {
      toast.error("Failed to reject handoff");
      console.error(error);
    }
  };

  if (!pendingHandoffs) {
    return <div>Loading handoffs...</div>;
  }

  return (
    <div className="space-y-6">
      {/* SLA Compliance Metrics */}
      {slaCompliance && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{slaCompliance.complianceRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {slaCompliance.violations} violations of {slaCompliance.total}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Handoffs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingHandoffs.length}</div>
              <p className="text-xs text-muted-foreground">Awaiting action</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Bottlenecks Detected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {bottlenecks?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottleneck Alerts */}
      {bottlenecks && bottlenecks.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-5 h-5" />
              Bottlenecks Detected
            </CardTitle>
            <CardDescription>Departments with high pending workload</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bottlenecks.map((bottleneck: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-semibold">{bottleneck.department}</p>
                    <p className="text-sm text-muted-foreground">
                      {bottleneck.pendingCount} pending, avg {Math.round(bottleneck.avgDuration / (1000 * 60 * 60))}h
                    </p>
                  </div>
                  <Badge
                    variant={
                      bottleneck.severity === "high"
                        ? "destructive"
                        : bottleneck.severity === "medium"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {bottleneck.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Handoffs Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Handoffs ({pendingHandoffs.length})</CardTitle>
          <CardDescription>
            {department
              ? `Workflows waiting for ${department} to accept`
              : "All pending cross-department handoffs"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingHandoffs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No pending handoffs</p>
          ) : (
            pendingHandoffs.map((handoff: any) => {
              const waitTime = Math.round((Date.now() - handoff.handoffAt) / (1000 * 60 * 60));
              return (
                <div
                  key={handoff._id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{handoff.workflowName}</h4>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {waitTime}h ago
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-medium">{handoff.fromDept}</span>
                      <ArrowRight className="w-4 h-4" />
                      <span className="font-medium text-foreground">{handoff.toDept}</span>
                    </div>
                    {handoff.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{handoff.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleAccept(handoff._id)}
                      className="gap-1"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(handoff._id)}
                      className="gap-1"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}