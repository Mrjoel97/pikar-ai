import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TrendingUp, CheckCircle2, AlertCircle, Clock, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ProgressTrackerProps {
  objectiveId: Id<"objectives">;
}

export function ProgressTracker({ objectiveId }: ProgressTrackerProps) {
  const analytics = useQuery(api.teamGoals.progress.getObjectiveProgressAnalytics, {
    objectiveId,
  });
  const updateProgress = useMutation(api.teamGoals.okrs.updateKeyResultProgress);
  const createMilestone = useMutation(api.teamGoals.progress.createMilestone);

  const [selectedKR, setSelectedKR] = useState<Id<"keyResults"> | null>(null);
  const [updateValue, setUpdateValue] = useState("");
  const [updateNote, setUpdateNote] = useState("");

  const [milestoneData, setMilestoneData] = useState({
    title: "",
    targetDate: new Date().toISOString().split("T")[0],
    targetValue: 0,
  });

  if (!analytics) {
    return <div>Loading...</div>;
  }

  const handleUpdateProgress = async () => {
    if (!selectedKR || !updateValue) return;

    try {
      await updateProgress({
        keyResultId: selectedKR,
        currentValue: parseFloat(updateValue),
        note: updateNote || undefined,
      });

      toast.success("Progress updated!");
      setUpdateValue("");
      setUpdateNote("");
      setSelectedKR(null);
    } catch (error) {
      toast.error("Failed to update progress");
    }
  };

  const handleCreateMilestone = async (keyResultId: Id<"keyResults">) => {
    if (!milestoneData.title) {
      toast.error("Please enter a milestone title");
      return;
    }

    try {
      await createMilestone({
        keyResultId,
        title: milestoneData.title,
        targetDate: new Date(milestoneData.targetDate).getTime(),
        targetValue: milestoneData.targetValue,
      });

      toast.success("Milestone created!");
      setMilestoneData({
        title: "",
        targetDate: new Date().toISOString().split("T")[0],
        targetValue: 0,
      });
    } catch (error) {
      toast.error("Failed to create milestone");
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case "on-track":
        return "text-green-600 bg-green-50";
      case "at-risk":
        return "text-yellow-600 bg-yellow-50";
      case "off-track":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{analytics.objective.title}</span>
            <Badge className={getHealthColor(analytics.health)}>
              {analytics.health.replace("-", " ").toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Overall Progress</span>
              <span className="font-semibold">{analytics.objective.progress}%</span>
            </div>
            <Progress value={analytics.objective.progress} />
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {analytics.keyResultBreakdown.onTrack}
              </div>
              <div className="text-xs text-green-700">On Track</div>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {analytics.keyResultBreakdown.atRisk}
              </div>
              <div className="text-xs text-yellow-700">At Risk</div>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {analytics.keyResultBreakdown.offTrack}
              </div>
              <div className="text-xs text-red-700">Off Track</div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">Weekly Progress</span>
            </div>
            <span className="text-lg font-bold text-blue-600">
              +{analytics.weeklyProgress.toFixed(1)}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium">Milestones</span>
            </div>
            <span className="text-lg font-bold text-purple-600">
              {analytics.milestones.completed} / {analytics.milestones.total}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Key Results */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Key Results</h3>
        {analytics.keyResults.map((kr: any) => (
          <Card key={kr._id}>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium">{kr.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {kr.currentValue} / {kr.targetValue} {kr.unit}
                  </p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedKR(kr._id)}
                    >
                      Update
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Update Progress</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>New Value</Label>
                        <Input
                          type="number"
                          value={updateValue}
                          onChange={(e) => setUpdateValue(e.target.value)}
                          placeholder={`Current: ${kr.currentValue}`}
                        />
                      </div>
                      <div>
                        <Label>Note (Optional)</Label>
                        <Textarea
                          value={updateNote}
                          onChange={(e) => setUpdateNote(e.target.value)}
                          placeholder="What changed?"
                        />
                      </div>
                      <Button onClick={handleUpdateProgress} className="w-full">
                        Save Update
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Progress value={kr.progress} />

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {kr.progress >= 70 ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : kr.progress >= 40 ? (
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                ) : (
                  <Clock className="h-4 w-4 text-red-600" />
                )}
                <span>{kr.progress}% complete</span>
              </div>

              {/* Add Milestone */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Milestone
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Milestone</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={milestoneData.title}
                        onChange={(e) =>
                          setMilestoneData({ ...milestoneData, title: e.target.value })
                        }
                        placeholder="e.g., Reach 50 points"
                      />
                    </div>
                    <div>
                      <Label>Target Date</Label>
                      <Input
                        type="date"
                        value={milestoneData.targetDate}
                        onChange={(e) =>
                          setMilestoneData({ ...milestoneData, targetDate: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Target Value</Label>
                      <Input
                        type="number"
                        value={milestoneData.targetValue}
                        onChange={(e) =>
                          setMilestoneData({
                            ...milestoneData,
                            targetValue: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                    <Button
                      onClick={() => handleCreateMilestone(kr._id)}
                      className="w-full"
                    >
                      Create Milestone
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
