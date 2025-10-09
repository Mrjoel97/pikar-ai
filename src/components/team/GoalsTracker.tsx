import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Target, 
  Plus, 
  TrendingUp,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  History
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GoalsTrackerProps {
  businessId: Id<"businesses">;
}

export function GoalsTracker({ businessId }: GoalsTrackerProps) {
  const [activeTab, setActiveTab] = useState<"active" | "completed" | "all">("active");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<Id<"teamGoals"> | null>(null);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("tasks");
  const [deadline, setDeadline] = useState("");
  const [category, setCategory] = useState("general");
  const [progressValue, setProgressValue] = useState("");
  const [progressNote, setProgressNote] = useState("");

  // Queries
  const goals = useQuery(
    api.teamGoals.listGoals,
    activeTab === "all" 
      ? { businessId }
      : { businessId, status: activeTab }
  );
  const summary = useQuery(api.teamGoals.getGoalsSummary, { businessId });
  const selectedGoalHistory = useQuery(
    api.teamGoals.getGoalHistory,
    selectedGoalId ? { goalId: selectedGoalId } : "skip"
  );

  // Mutations
  const createGoal = useMutation(api.teamGoals.createGoal);
  const updateProgress = useMutation(api.teamGoals.updateProgress);
  const updateGoal = useMutation(api.teamGoals.updateGoal);
  const deleteGoal = useMutation(api.teamGoals.deleteGoal);

  const handleCreateGoal = async () => {
    if (!title.trim() || !targetValue) {
      toast.error("Title and target value are required");
      return;
    }

    try {
      await createGoal({
        businessId,
        title,
        description: description || undefined,
        targetValue: parseFloat(targetValue),
        unit,
        deadline: deadline ? new Date(deadline).getTime() : undefined,
        category,
      });
      toast.success("Goal created!");
      setTitle("");
      setDescription("");
      setTargetValue("");
      setDeadline("");
      setCreateDialogOpen(false);
    } catch (error: any) {
      toast.error(`Failed to create goal: ${error.message}`);
    }
  };

  const handleUpdateProgress = async () => {
    if (!selectedGoalId || !progressValue) {
      toast.error("Progress value is required");
      return;
    }

    try {
      const result = await updateProgress({
        goalId: selectedGoalId,
        currentValue: parseFloat(progressValue),
        note: progressNote || undefined,
      });
      
      if (result.isCompleted) {
        toast.success("🎉 Goal completed!");
      } else {
        toast.success("Progress updated!");
      }
      
      setProgressValue("");
      setProgressNote("");
      setProgressDialogOpen(false);
      setSelectedGoalId(null);
    } catch (error: any) {
      toast.error(`Failed to update progress: ${error.message}`);
    }
  };

  const handleDeleteGoal = async (goalId: Id<"teamGoals">) => {
    try {
      await deleteGoal({ goalId });
      toast.success("Goal deleted");
    } catch (error: any) {
      toast.error(`Failed to delete: ${error.message}`);
    }
  };

  const formatDeadline = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      revenue: "bg-green-500",
      customers: "bg-blue-500",
      tasks: "bg-purple-500",
      general: "bg-gray-500",
    };
    return colors[cat] || "bg-gray-500";
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summary?.active || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary?.completed || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.averageProgress || 0}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Team Goals
              </CardTitle>
              <CardDescription>Track and manage shared team objectives</CardDescription>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Goal
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Goal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Reach 1000 customers"
                    />
                  </div>
                  <div>
                    <Label>Description (optional)</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Goal details..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Target Value</Label>
                      <Input
                        type="number"
                        value={targetValue}
                        onChange={(e) => setTargetValue(e.target.value)}
                        placeholder="1000"
                      />
                    </div>
                    <div>
                      <Label>Unit</Label>
                      <Select value={unit} onValueChange={setUnit}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tasks">Tasks</SelectItem>
                          <SelectItem value="customers">Customers</SelectItem>
                          <SelectItem value="revenue">Revenue ($)</SelectItem>
                          <SelectItem value="percent">Percent (%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Category</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="revenue">Revenue</SelectItem>
                          <SelectItem value="customers">Customers</SelectItem>
                          <SelectItem value="tasks">Tasks</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Deadline (optional)</Label>
                      <Input
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button onClick={handleCreateGoal} className="w-full">
                    Create Goal
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <div className="space-y-4">
                {goals?.map((goal: any) => (
                  <Card key={goal._id} className="relative">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{goal.title}</h3>
                            <Badge className={getCategoryColor(goal.category)}>
                              {goal.category}
                            </Badge>
                            {goal.status === "completed" && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            )}
                            {goal.isOverdue && (
                              <Badge variant="destructive">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Overdue
                              </Badge>
                            )}
                          </div>
                          {goal.description && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {goal.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4" />
                              {goal.currentValue} / {goal.targetValue} {goal.unit}
                            </span>
                            {goal.deadline && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDeadline(goal.deadline)}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {goal.creatorName}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedGoalId(goal._id);
                              setProgressDialogOpen(true);
                            }}
                            disabled={goal.status === "completed"}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteGoal(goal._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-semibold">{goal.progress}%</span>
                        </div>
                        <Progress value={goal.progress} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {goals?.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No goals found. Create your first goal to get started!</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Update Progress Dialog */}
      <Dialog open={progressDialogOpen} onOpenChange={setProgressDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Progress</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Current Value</Label>
              <Input
                type="number"
                value={progressValue}
                onChange={(e) => setProgressValue(e.target.value)}
                placeholder="Enter current value"
              />
            </div>
            <div>
              <Label>Note (optional)</Label>
              <Textarea
                value={progressNote}
                onChange={(e) => setProgressNote(e.target.value)}
                placeholder="Add a note about this update..."
                rows={3}
              />
            </div>
            <Button onClick={handleUpdateProgress} className="w-full">
              Update Progress
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default GoalsTracker;
