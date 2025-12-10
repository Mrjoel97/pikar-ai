import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Workflow, User, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router";

interface WorkflowAssignmentsProps {
  businessId: string;
  userId: string;
}

export function WorkflowAssignments({ businessId, userId }: WorkflowAssignmentsProps) {
  const navigate = useNavigate();
  
  const assignments = useQuery(
    api.workflowAssignments.getMyAssignments,
    businessId && userId ? { businessId: businessId as any, userId: userId as any } : "skip"
  );

  const workloadSummary = useQuery(
    api.workflowAssignments.getWorkloadSummary,
    businessId ? { businessId: businessId as any } : "skip"
  );

  if (!assignments) {
    return (
      <Card className="neu-raised">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Workflow Assignments
          </CardTitle>
          <CardDescription>Loading assignments...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const pendingAssignments = assignments.filter((a: any) => a.status === "pending");
  const inProgressAssignments = assignments.filter((a: any) => a.status === "in_progress");
  const completedAssignments = assignments.filter((a: any) => a.status === "completed");

  return (
    <Card className="neu-raised">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5" />
              Workflow Assignments
            </CardTitle>
            <CardDescription>Your workflow tasks and team workload</CardDescription>
          </div>
          <Button size="sm" onClick={() => navigate("/workflows")}>
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Pending
            </div>
            <div className="text-xl font-bold text-amber-600">{pendingAssignments.length}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Workflow className="h-3 w-3" />
              In Progress
            </div>
            <div className="text-xl font-bold text-blue-600">{inProgressAssignments.length}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3" />
              Completed
            </div>
            <div className="text-xl font-bold text-green-600">{completedAssignments.length}</div>
          </div>
        </div>

        {/* Team Workload Summary */}
        {workloadSummary && workloadSummary.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Team Workload
            </h4>
            {workloadSummary.slice(0, 5).map((member: any) => (
              <div key={member.userId} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{member.userName}</span>
                  <span className="text-muted-foreground">
                    {member.activeAssignments} active
                  </span>
                </div>
                <Progress 
                  value={Math.min(100, (member.activeAssignments / 10) * 100)} 
                  className="h-2"
                />
              </div>
            ))}
          </div>
        )}

        {/* My Assignments */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">My Active Tasks</h4>
          {[...pendingAssignments, ...inProgressAssignments].slice(0, 5).map((assignment: any) => (
            <div
              key={assignment._id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{assignment.workflowName || "Workflow Task"}</p>
                  <Badge variant={assignment.status === "in_progress" ? "default" : "secondary"} className="text-xs">
                    {assignment.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  {assignment.dueDate && (
                    <span className={assignment.dueDate < Date.now() ? "text-red-600" : ""}>
                      Due {new Date(assignment.dueDate).toLocaleDateString()}
                    </span>
                  )}
                  {assignment.priority && (
                    <Badge variant="outline" className="text-xs">
                      {assignment.priority}
                    </Badge>
                  )}
                </div>
              </div>
              {assignment.dueDate && assignment.dueDate < Date.now() && assignment.status !== "completed" && (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
          ))}
        </div>

        {assignments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Workflow className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No workflow assignments yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}