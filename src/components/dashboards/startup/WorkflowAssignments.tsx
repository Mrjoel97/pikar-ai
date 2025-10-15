import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle2, Clock, AlertCircle, User } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface WorkflowAssignmentsProps {
  businessId: Id<"businesses">;
  userId: Id<"users">;
}

export function WorkflowAssignments({ businessId, userId }: WorkflowAssignmentsProps) {
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<Id<"workflowSteps"> | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<Id<"users"> | null>(null);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);

  // Queries
  const assignedSteps = useQuery(
    api.workflowAssignments.getAssignedSteps,
    { userId, businessId, status: "pending" }
  );

  const analytics = useQuery(
    api.workflowAssignments.getAssignmentAnalytics,
    { businessId }
  );

  const teamMembers = useQuery(
    api.activityFeed.getTeamMembers,
    { businessId }
  );

  // Mutations
  const assignStep = useMutation(api.workflowAssignments.assignStep);
  const updateStatus = useMutation(api.workflowAssignments.updateStepStatus);

  const handleAssign = async () => {
    if (!selectedStepId || !selectedAssignee) {
      toast.error("Please select a step and assignee");
      return;
    }

    try {
      await assignStep({
        stepId: selectedStepId,
        assigneeId: selectedAssignee,
        dueDate: dueDate ? dueDate.getTime() : undefined,
      });
      toast.success("Task assigned successfully");
      setShowAssignDialog(false);
      setSelectedStepId(null);
      setSelectedAssignee(null);
      setDueDate(undefined);
    } catch (error: any) {
      toast.error(error?.message || "Failed to assign task");
    }
  };

  const handleStatusUpdate = async (stepId: Id<"workflowSteps">, status: "in_progress" | "completed") => {
    try {
      await updateStatus({ stepId, status });
      toast.success(`Task marked as ${status.replace("_", " ")}`);
    } catch (error: any) {
      toast.error(error?.message || "Failed to update status");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "blocked":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "blocked":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Workload Balancing View */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Team Workload Balance
            </CardTitle>
            <CardDescription>
              Overview of task distribution across team members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <div className="text-sm text-muted-foreground">Total Tasks</div>
                <div className="text-2xl font-bold">{analytics.totalSteps}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Assigned</div>
                <div className="text-2xl font-bold">{analytics.assignedSteps}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Completed</div>
                <div className="text-2xl font-bold text-green-600">{analytics.completedSteps}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Overdue</div>
                <div className="text-2xl font-bold text-red-600">{analytics.overdueTasks}</div>
              </div>
            </div>

            {/* Team Member Workload */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Team Member Workload</h4>
              {(Object.entries(
                analytics.assigneeStats as Record<
                  string,
                  { assigned: number; completed: number; overdue: number }
                >
              ) as Array<[string, { assigned: number; completed: number; overdue: number }]>).map(
                ([assigneeId, stats]) => {
                  const member = Array.isArray(teamMembers)
                    ? (teamMembers as any[]).find(
                        (m: any) => (m._id ?? m.id) === assigneeId
                      )
                    : undefined;
                  const completionRate =
                    stats.assigned > 0
                      ? Math.round((stats.completed / stats.assigned) * 100)
                      : 0;

                  return (
                    <div key={assigneeId} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{member?.name || "Unknown"}</div>
                        <div className="text-xs text-muted-foreground">{member?.email}</div>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Assigned:</span>{" "}
                          <span className="font-medium">{stats.assigned}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Completed:</span>{" "}
                          <span className="font-medium text-green-600">{stats.completed}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Overdue:</span>{" "}
                          <span className="font-medium text-red-600">{stats.overdue}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{completionRate}%</div>
                        <div className="text-xs text-muted-foreground">completion</div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Assigned Tasks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Assigned Tasks</CardTitle>
              <CardDescription>
                Tasks assigned to you across all workflows
              </CardDescription>
            </div>
            <Badge variant="outline">
              {assignedSteps?.length || 0} pending
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {!assignedSteps || assignedSteps.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tasks assigned to you
            </div>
          ) : (
            <div className="space-y-3">
              {assignedSteps.map((step: any) => {
                const isOverdue = step.dueDate && step.dueDate < Date.now();
                
                return (
                  <div
                    key={step._id}
                    className={`p-4 border rounded-lg ${isOverdue ? "border-red-300 bg-red-50" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(step.status)}
                          <h4 className="font-medium">{step.name}</h4>
                          <Badge className={getStatusColor(step.status)}>
                            {step.status.replace("_", " ")}
                          </Badge>
                        </div>
                        {step.workflow && (
                          <div className="text-sm text-muted-foreground mb-2">
                            Workflow: {step.workflow.name}
                          </div>
                        )}
                        {step.dueDate && (
                          <div className={`text-xs flex items-center gap-1 ${isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                            <CalendarIcon className="h-3 w-3" />
                            Due: {format(new Date(step.dueDate), "PPP")}
                            {isOverdue && " (Overdue)"}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {step.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(step._id, "in_progress")}
                          >
                            Start
                          </Button>
                        )}
                        {step.status === "in_progress" && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(step._id, "completed")}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Assignee</Label>
              <Select
                value={selectedAssignee || undefined}
                onValueChange={(value) => setSelectedAssignee(value as Id<"users">)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers?.map((member: any) => (
                    <SelectItem key={member._id} value={member._id}>
                      {member.name || member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Due Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssign}>
                Assign Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}