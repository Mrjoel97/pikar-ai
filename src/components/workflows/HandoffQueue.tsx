import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, ArrowRight } from "lucide-react";
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

  if (!pendingHandoffs || pendingHandoffs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Handoffs</CardTitle>
          <CardDescription>
            {department
              ? `No pending handoffs for ${department}`
              : "No pending handoffs across all departments"}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
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
        {pendingHandoffs.map((handoff: any) => {
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
        })}
      </CardContent>
    </Card>
  );
}