import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
      case "completed": return "bg-green-500";
      case "in_progress": return "bg-blue-500";
      case "blocked": return "bg-red-500";
      default: return "bg-gray-300";
    }
  };

  const calculateProgress = (milestones: any[]) => {
    if (!milestones?.length) return 0;
    const completed = milestones.filter((m: any) => m.status === "completed").length;
    return Math.round((completed / milestones.length) * 100);
  };

  const getNextMilestone = (milestones: any[]) => {
    return milestones?.find((m: any) => m.status !== "completed") || milestones?.[milestones.length - 1];
  };

  if (!initiative) return null;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Initiative Journey</CardTitle>
        <CardDescription>Track your progress towards {initiative.title}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{calculateProgress(milestones)}%</span>
            </div>
            <Progress value={calculateProgress(milestones)} />
          </div>

          <div className="relative pl-4 border-l-2 border-muted space-y-8">
            {milestones?.map((milestone: any, idx: number) => (
              <div key={milestone._id} className="relative">
                <div className={`absolute -left-[21px] top-1 h-4 w-4 rounded-full border-2 border-background ${getStatusColor(milestone.status)}`} />
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium leading-none">{milestone.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {milestone.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {milestone.description}
                  </p>
                  {milestone.targetDate && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="mr-1 h-3 w-3" />
                      {new Date(milestone.targetDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}