import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Map, Plus, CheckCircle2, Circle, AlertCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

interface InitiativeJourneyProps {
  businessId: Id<"businesses">;
  initiativeId: Id<"initiatives">;
}

export function InitiativeJourney({ businessId, initiativeId }: InitiativeJourneyProps) {
  const milestones = useQuery(api.initiativeJourney.getMilestones, { initiativeId });
  const progress = useQuery(api.initiativeJourney.getJourneyProgress, { initiativeId });
  
  const createMilestone = useMutation(api.initiativeJourney.createMilestone);
  const updateStatus = useMutation(api.initiativeJourney.updateMilestoneStatus);
  const deleteMilestone = useMutation(api.initiativeJourney.deleteMilestone);

  const [showDialog, setShowDialog] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    title: "",
    description: "",
    targetDate: "",
  });

  const handleCreateMilestone = async () => {
    if (!newMilestone.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    try {
      await createMilestone({
        businessId,
        initiativeId,
        title: newMilestone.title,
        description: newMilestone.description,
        targetDate: newMilestone.targetDate ? new Date(newMilestone.targetDate).getTime() : undefined,
      });
      toast.success("Milestone created");
      setShowDialog(false);
      setNewMilestone({ title: "", description: "", targetDate: "" });
    } catch (error) {
      toast.error("Failed to create milestone");
    }
  };

  const handleUpdateStatus = async (milestoneId: Id<"journeyMilestones">, status: any) => {
    try {
      await updateStatus({ milestoneId, status });
      toast.success("Status updated");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (milestoneId: Id<"journeyMilestones">) => {
    try {
      await deleteMilestone({ milestoneId });
      toast.success("Milestone deleted");
    } catch (error) {
      toast.error("Failed to delete milestone");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "in_progress":
        return <Circle className="h-5 w-5 text-blue-600 fill-blue-600" />;
      case "blocked":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Initiative Journey
          </CardTitle>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Milestone
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Milestone</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={newMilestone.title}
                    onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                    placeholder="e.g., Launch MVP"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newMilestone.description}
                    onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                    placeholder="Details about this milestone..."
                  />
                </div>
                <div>
                  <Label>Target Date</Label>
                  <Input
                    type="date"
                    value={newMilestone.targetDate}
                    onChange={(e) => setNewMilestone({ ...newMilestone, targetDate: e.target.value })}
                  />
                </div>
                <Button onClick={handleCreateMilestone} className="w-full">
                  Create Milestone
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Summary */}
        {progress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Overall Progress</span>
              <span className="text-muted-foreground">{progress.completionPercentage}%</span>
            </div>
            <Progress value={progress.completionPercentage} className="h-2" />
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>✅ {progress.completed} completed</span>
              <span>🔵 {progress.inProgress} in progress</span>
              <span>🔴 {progress.blocked} blocked</span>
              <span>⚪ {progress.notStarted} not started</span>
            </div>
          </div>
        )}

        {/* Milestones Timeline */}
        <div className="space-y-3">
          {milestones && milestones.length > 0 ? (
            milestones.map((milestone, idx) => (
              <div key={milestone._id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  {getStatusIcon(milestone.status)}
                  {idx < milestones.length - 1 && (
                    <div className="w-0.5 h-full bg-border mt-2" />
                  )}
                </div>
                <Card className="flex-1">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{milestone.title}</h4>
                          <Badge className={getStatusColor(milestone.status)}>
                            {milestone.status.replace("_", " ")}
                          </Badge>
                        </div>
                        {milestone.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {milestone.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {milestone.targetDate && (
                            <span>🎯 {new Date(milestone.targetDate).toLocaleDateString()}</span>
                          )}
                          {milestone.completedAt && (
                            <span>✅ {new Date(milestone.completedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Select
                            value={milestone.status}
                            onValueChange={(v) => handleUpdateStatus(milestone._id, v)}
                          >
                            <SelectTrigger className="h-8 w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="not_started">Not Started</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="blocked">Blocked</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(milestone._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No milestones yet. Add your first milestone to track progress!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
