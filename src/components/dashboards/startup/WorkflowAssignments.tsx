import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Workflow, User, Clock, CheckCircle, AlertCircle, TrendingUp, Zap } from "lucide-react";
import { useNavigate } from "react-router";

interface WorkflowAssignmentsProps {
  businessId: string;
  userId: string;
}

export function WorkflowAssignments({ businessId, userId }: WorkflowAssignmentsProps) {
  const navigate = useNavigate();
  
  const assignments = useQuery(
    api.workflowAssignments.getAssignedSteps,
    businessId && userId ? { businessId: businessId as any, userId: userId as any } : "skip"
  );

  const dueSoon = useQuery(
    api.workflowAssignments.getStepsDueSoon,
    userId ? { userId: userId as any, hoursAhead: 24 } : "skip"
  );

  const analytics = useQuery(
    api.workflowAssignments.getAssignmentAnalytics,
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

  // Calculate velocity (tasks completed per day)
  const velocity = analytics ? Math.round((analytics.completedSteps / 30) * 10) / 10 : 0;
  
  // Calculate on-time rate
  const onTimeRate = analytics && analytics.completedSteps > 0
    ? Math.round(((analytics.completedSteps - analytics.overdueTasks) / analytics.completedSteps) * 100)
    : 0;

  return (
    <Card className="neu-raised">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5" />
              Workflow Assignments
            </CardTitle>
            <CardDescription>Your workflow tasks and team workload analytics</CardDescription>
          </div>
          <Button size="sm" onClick={() => navigate("/workflows")}>
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enhanced Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Pending
            </div>
            <div className="text-xl font-bold text-amber-600">{pendingAssignments.length}</div>
            {dueSoon && dueSoon.length > 0 && (
              <p className="text-xs text-red-600 font-semibold">{dueSoon.length} due soon</p>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Workflow className="h-3 w-3" />
              In Progress
            </div>
            <div className="text-xl font-bold text-blue-600">{inProgressAssignments.length}</div>
            <p className="text-xs text-muted-foreground">Active tasks</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3" />
              Completed
            </div>
            <div className="text-xl font-bold text-green-600">{completedAssignments.length}</div>
            {analytics && (
              <p className="text-xs text-muted-foreground">
                {Math.round(analytics.completionRate)}% rate
              </p>
            )}
          </div>
        </div>

        {/* Performance Metrics */}
        {analytics && (
          <div className="rounded-lg bg-muted/50 p-3 space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              30-Day Performance
            </h4>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground">Velocity</div>
                <div className="text-lg font-bold">{velocity}</div>
                <div className="text-xs text-muted-foreground">tasks/day</div>
              </div>
              <div>
                <div className="text-muted-foreground">On-Time</div>
                <div className="text-lg font-bold text-green-600">{onTimeRate}%</div>
                <div className="text-xs text-muted-foreground">completion</div>
              </div>
              <div>
                <div className="text-muted-foreground">Overdue</div>
                <div className="text-lg font-bold text-red-600">{analytics.overdueTasks}</div>
                <div className="text-xs text-muted-foreground">tasks</div>
              </div>
            </div>
          </div>
        )}

        {/* Team Workload Summary */}
        {analytics && analytics.assigneeStats && Object.keys(analytics.assigneeStats).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Team Workload
            </h4>
            {Object.entries(analytics.assigneeStats).slice(0, 5).map(([userId, stats]: [string, any]) => (
              <div key={userId} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Team Member</span>
                  <span className="text-muted-foreground">
                    {stats.assigned} assigned ({stats.completed} done)
                  </span>
                </div>
                <Progress 
                  value={stats.assigned > 0 ? (stats.completed / stats.assigned) * 100 : 0} 
                  className="h-2"
                />
                {stats.overdue > 0 && (
                  <p className="text-xs text-red-600">{stats.overdue} overdue</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* My Active Tasks with Priority */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4" />
            My Active Tasks
          </h4>
          {[...pendingAssignments, ...inProgressAssignments].slice(0, 5).map((assignment: any) => {
            const isOverdue = assignment.dueDate && assignment.dueDate < Date.now();
            return (
              <div
                key={assignment._id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{assignment.name || "Workflow Task"}</p>
                    <Badge variant={assignment.status === "in_progress" ? "default" : "secondary"} className="text-xs">
                      {assignment.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    {assignment.dueDate && (
                      <span className={isOverdue ? "text-red-600 font-semibold" : ""}>
                        Due {new Date(assignment.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    {assignment.workflow && (
                      <span className="truncate">{assignment.workflow.name}</span>
                    )}
                  </div>
                </div>
                {isOverdue && (
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                )}
              </div>
            );
          })}
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