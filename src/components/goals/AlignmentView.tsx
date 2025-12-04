import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GitBranch, Target, TrendingUp, AlertTriangle, Link2, Unlink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AlignmentViewProps {
  businessId: Id<"businesses">;
}

export function AlignmentView({ businessId }: AlignmentViewProps) {
  const alignmentMap = useQuery(api.teamGoals.alignment.getBusinessAlignmentMap, {
    businessId,
  });
  const conflicts = useQuery(api.teamGoals.alignment.getAlignmentConflicts, {
    businessId,
  });
  const alignObjectives = useMutation(api.teamGoals.alignment.alignObjectives);
  const removeAlignment = useMutation(api.teamGoals.alignment.removeAlignment);

  const [selectedObjective, setSelectedObjective] = useState<Id<"objectives"> | null>(null);
  const [selectedParent, setSelectedParent] = useState<Id<"objectives"> | null>(null);

  if (!alignmentMap || !conflicts) {
    return <div>Loading...</div>;
  }

  const handleAlign = async () => {
    if (!selectedObjective || !selectedParent) {
      toast.error("Please select both objectives");
      return;
    }

    try {
      await alignObjectives({
        childObjectiveId: selectedObjective,
        parentObjectiveId: selectedParent,
      });
      toast.success("Objectives aligned!");
      setSelectedObjective(null);
      setSelectedParent(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to align objectives");
    }
  };

  const handleRemoveAlignment = async (objectiveId: Id<"objectives">) => {
    try {
      await removeAlignment({ objectiveId });
      toast.success("Alignment removed!");
    } catch (error) {
      toast.error("Failed to remove alignment");
    }
  };

  const renderObjectiveTree = (objective: any, level = 0) => {
    const indent = level * 24;

    return (
      <div key={objective._id} style={{ marginLeft: `${indent}px` }}>
        <Card className="mb-3">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-medium">{objective.title}</h4>
                  <Badge variant="outline" className="text-xs">
                    {objective.category}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Owner: {objective.owner?.name || "Unassigned"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {objective.keyResultsCount} Key Results
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{objective.progress}%</div>
                {objective.parentObjectiveId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAlignment(objective._id)}
                  >
                    <Unlink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <Progress value={objective.progress} />
          </CardContent>
        </Card>

        {objective.children?.map((child: any) => renderObjectiveTree(child, level + 1))}
      </div>
    );
  };

  const allObjectives = alignmentMap.alignmentMap.flatMap((obj: any) => {
    const flatten = (o: any): any[] => [o, ...(o.children?.flatMap(flatten) || [])];
    return flatten(obj);
  });

  return (
    <div className="space-y-6">
      {/* Alignment Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Alignment Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {alignmentMap.metrics.totalObjectives}
              </div>
              <div className="text-sm text-blue-700">Total Objectives</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {alignmentMap.metrics.alignmentPercentage}%
              </div>
              <div className="text-sm text-green-700">Aligned</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">
                {alignmentMap.metrics.byCategory.company}
              </div>
              <div className="text-sm text-purple-700">Company Level</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">
                {conflicts.length}
              </div>
              <div className="text-sm text-orange-700">Conflicts</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alignment Conflicts */}
      {conflicts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Alignment Conflicts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {conflicts.map((conflict: any) => (
              <div
                key={conflict.objective._id}
                className="p-4 border rounded-lg bg-orange-50"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{conflict.objective.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {conflict.objective.progress}% complete
                    </p>
                  </div>
                  <Badge
                    variant={conflict.severity === "high" ? "destructive" : "default"}
                  >
                    {conflict.severity}
                  </Badge>
                </div>
                <div className="text-sm">
                  <p className="text-muted-foreground">
                    Parent: {conflict.parent.title} ({conflict.parent.progress}%)
                  </p>
                  <p className="text-orange-700 font-medium mt-1">
                    Gap: {conflict.progressGap}% behind parent
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Create Alignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Create Alignment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Child Objective</label>
            <Select
              value={selectedObjective || ""}
              onValueChange={(value) => setSelectedObjective(value as Id<"objectives">)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select objective" />
              </SelectTrigger>
              <SelectContent>
                {allObjectives.map((obj: any) => (
                  <SelectItem key={obj._id} value={obj._id}>
                    {obj.title} ({obj.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Parent Objective</label>
            <Select
              value={selectedParent || ""}
              onValueChange={(value) => setSelectedParent(value as Id<"objectives">)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select parent" />
              </SelectTrigger>
              <SelectContent>
                {allObjectives
                  .filter((obj: any) => obj._id !== selectedObjective)
                  .map((obj: any) => (
                    <SelectItem key={obj._id} value={obj._id}>
                      {obj.title} ({obj.category})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleAlign} className="w-full">
            <Link2 className="h-4 w-4 mr-2" />
            Align Objectives
          </Button>
        </CardContent>
      </Card>

      {/* Alignment Tree */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Alignment Hierarchy</h3>
        {alignmentMap.alignmentMap.map((objective: any) =>
          renderObjectiveTree(objective)
        )}
      </div>
    </div>
  );
}
