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
import { Map, Plus, CheckCircle2, Circle, AlertCircle, Trash2, Calendar, ArrowRight, TrendingUp } from "lucide-react";
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
  const prediction = useQuery(api.initiativeJourney.predictCompletion, { initiativeId });
  
  const createMilestone = useMutation(api.initiativeJourney.createMilestone);
  const updateStatus = useMutation(api.initiativeJourney.updateMilestoneStatus);
  const deleteMilestone = useMutation(api.initiativeJourney.deleteMilestone);
  const trackDependencies = useMutation(api.initiativeJourney.trackDependencies);

  const [showDialog, setShowDialog] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    title: "",
    description: "",
    targetDate: "",
    dependsOn: [] as Id<"journeyMilestones">[],
  });

  const handleCreateMilestone = async () => {
    if (!newMilestone.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    try {
      const milestoneId = await createMilestone({
        businessId,
        initiativeId,
        title: newMilestone.title,
        description: newMilestone.description,
        targetDate: newMilestone.targetDate ? new Date(newMilestone.targetDate).getTime() : undefined,
      });

      if (newMilestone.dependsOn.length > 0) {
        await trackDependencies({
          milestoneId,
          dependsOn: newMilestone.dependsOn,
        });
      }

      toast.success("Milestone created");
      setShowDialog(false);
      setNewMilestone({ title: "", description: "", targetDate: "", dependsOn: [] });
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
                
                {milestones && milestones.length > 0 && (
                  <div>
                    <Label>Dependencies (Optional)</Label>
                    <Select
                      onValueChange={(val) => {
                        if (val && !newMilestone.dependsOn.includes(val as any)) {
                          setNewMilestone({
                            ...newMilestone,
                            dependsOn: [...newMilestone.dependsOn, val as any]
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select dependencies..." />
                      </SelectTrigger>
                      <SelectContent>
                        {milestones.map((m) => (
                          <SelectItem key={m._id} value={m._id}>
                            {m.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {newMilestone.dependsOn.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {newMilestone.dependsOn.map((depId) => {
                          const dep = milestones.find(m => m._id === depId);
                          return dep ? (
                            <Badge key={depId} variant="secondary" className="text-xs">
                              {dep.title}
                              <button 
                                className="ml-1 hover:text-destructive"
                                onClick={() => setNewMilestone({
                                  ...newMilestone,
                                  dependsOn: newMilestone.dependsOn.filter(id => id !== depId)
                                })}
                              >
                                ×
                              </button>
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                )}

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
          <div className="space-y-4">
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

            {/* AI Prediction */}
            {prediction && prediction.estimatedDaysRemaining > 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-blue-900">AI Timeline Prediction</div>
                  <div className="text-xs text-blue-700 mt-1">
                    Based on current velocity, you're on track to finish in <strong>{prediction.estimatedDaysRemaining} days</strong>.
                    Estimated completion: {new Date(prediction.estimatedCompletionDate).toLocaleDateString()}
                  </div>
                  <div className={`text-xs font-medium mt-1 ${prediction.onTrack ? 'text-green-600' : 'text-amber-600'}`}>
                    {prediction.onTrack ? "✅ On Track" : "⚠️ At Risk - Consider adjusting timeline"}
                  </div>
                </div>
              </div>
            )}
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
                        
                        {/* Dependencies */}
                        {milestone.dependencies && milestone.dependencies.length > 0 && (
                          <div className="flex items-center gap-1 mb-2 text-xs text-muted-foreground">
                            <ArrowRight className="h-3 w-3" />
                            <span>Depends on:</span>
                            {milestone.dependencies.map((depId: any) => {
                              const dep = milestones.find(m => m._id === depId);
                              return dep ? (
                                <Badge key={depId} variant="outline" className="text-[10px] px-1 py-0 h-4">
                                  {dep.title}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        )}

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {milestone.targetDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(milestone.targetDate).toLocaleDateString()}
                            </span>
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
