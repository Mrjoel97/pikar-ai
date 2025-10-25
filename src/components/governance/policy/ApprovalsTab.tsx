import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface ApprovalsTabProps {
  businessId: Id<"businesses">;
  approvals: any[];
}

export function ApprovalsTab({ businessId, approvals }: ApprovalsTabProps) {
  const approvePolicy = useMutation(api.policyManagement.approvePolicy);
  const rejectPolicy = useMutation(api.policyManagement.rejectPolicy);
  const [comments, setComments] = useState<Record<string, string>>({});

  const handleApprove = async (approvalId: Id<"policyApprovals">) => {
    try {
      await approvePolicy({ approvalId, comments: comments[approvalId] });
      toast.success("Policy approved successfully");
      setComments((prev) => ({ ...prev, [approvalId]: "" }));
    } catch (error) {
      toast.error("Failed to approve policy");
    }
  };

  const handleReject = async (approvalId: Id<"policyApprovals">) => {
    if (!comments[approvalId]) {
      toast.error("Please provide rejection comments");
      return;
    }
    try {
      await rejectPolicy({ approvalId, comments: comments[approvalId] });
      toast.success("Policy rejected");
      setComments((prev) => ({ ...prev, [approvalId]: "" }));
    } catch (error) {
      toast.error("Failed to reject policy");
    }
  };

  return (
    <div className="space-y-4">
      {approvals?.map((approval: any) => (
        <Card key={approval._id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{approval.policy?.title}</CardTitle>
                <CardDescription>
                  Requested by {approval.requester?.name || approval.requester?.email}
                </CardDescription>
              </div>
              <Badge>{approval.policy?.severity}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Policy Content</Label>
              <div className="mt-2 rounded-md border p-4 text-sm">
                {approval.policy?.content}
              </div>
            </div>
            <div>
              <Label htmlFor={`comments-${approval._id}`}>Comments (Optional)</Label>
              <Textarea
                id={`comments-${approval._id}`}
                value={comments[approval._id] || ""}
                onChange={(e) =>
                  setComments((prev) => ({ ...prev, [approval._id]: e.target.value }))
                }
                placeholder="Add approval/rejection comments..."
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleApprove(approval._id)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleReject(approval._id)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      {approvals?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No pending approvals</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}