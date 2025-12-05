import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Target, TrendingUp, X } from "lucide-react";
import { toast } from "sonner";

interface OkrBuilderProps {
  businessId: Id<"businesses">;
  userId: Id<"users">;
  onComplete?: () => void;
}

export function OkrBuilder({ businessId, userId, onComplete }: OkrBuilderProps) {
  const [step, setStep] = useState<"objective" | "keyResults">("objective");
  const [objectiveData, setObjectiveData] = useState({
    title: "",
    description: "",
    category: "team" as "company" | "department" | "team" | "individual",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    parentObjectiveId: undefined as Id<"objectives"> | undefined,
  });

  const [keyResults, setKeyResults] = useState<Array<{
    title: string;
    targetValue: number;
    unit: string;
    measurementType: "number" | "percentage" | "currency" | "boolean";
  }>>([]);

  const createObjective = useMutation(api.teamGoals.okrs.createObjective);
  const createKeyResult = useMutation(api.teamGoals.okrs.createKeyResult);
  const objectives = useQuery(api.teamGoals.okrs.listObjectives, { businessId });

  const addKeyResult = () => {
    setKeyResults([
      ...keyResults,
      { title: "", targetValue: 100, unit: "", measurementType: "number" },
    ]);
  };

  const removeKeyResult = (index: number) => {
    setKeyResults(keyResults.filter((_, i) => i !== index));
  };

  const updateKeyResult = (index: number, field: string, value: any) => {
    const updated = [...keyResults];
    updated[index] = { ...updated[index], [field]: value };
    setKeyResults(updated);
  };

  const handleCreateObjective = async () => {
    if (!objectiveData.title.trim()) {
      toast.error("Please enter an objective title");
      return;
    }

    if (keyResults.length === 0) {
      toast.error("Please add at least one key result");
      return;
    }

    try {
      const objectiveId = await createObjective({
        businessId,
        title: objectiveData.title,
        description: objectiveData.description || undefined,
        ownerId: userId,
        parentObjectiveId: objectiveData.parentObjectiveId,
        timeframe: {
          startDate: new Date(objectiveData.startDate).getTime(),
          endDate: new Date(objectiveData.endDate).getTime(),
        },
        category: objectiveData.category,
      });

      // Create all key results
      await Promise.all(
        keyResults.map((kr) =>
          createKeyResult({
            objectiveId,
            title: kr.title,
            targetValue: kr.targetValue,
            currentValue: 0,
            unit: kr.unit,
            ownerId: userId,
            measurementType: kr.measurementType,
          })
        )
      );

      toast.success("OKR created successfully!");
      
      // Reset form
      setObjectiveData({
        title: "",
        description: "",
        category: "team",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        parentObjectiveId: undefined,
      });
      setKeyResults([]);
      setStep("objective");
      
      onComplete?.();
    } catch (error) {
      toast.error("Failed to create OKR");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      {step === "objective" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Create Objective
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Objective Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Increase customer satisfaction"
                value={objectiveData.title}
                onChange={(e) =>
                  setObjectiveData({ ...objectiveData, title: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What do you want to achieve?"
                value={objectiveData.description}
                onChange={(e) =>
                  setObjectiveData({ ...objectiveData, description: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={objectiveData.category}
                  onValueChange={(value: any) =>
                    setObjectiveData({ ...objectiveData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="parent">Parent Objective (Optional)</Label>
                <Select
                  value={objectiveData.parentObjectiveId || "none"}
                  onValueChange={(value) =>
                    setObjectiveData({
                      ...objectiveData,
                      parentObjectiveId: value === "none" ? undefined : (value as Id<"objectives">),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {objectives?.map((obj: any) => (
                      <SelectItem key={obj._id} value={obj._id}>
                        {obj.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={objectiveData.startDate}
                  onChange={(e) =>
                    setObjectiveData({ ...objectiveData, startDate: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={objectiveData.endDate}
                  onChange={(e) =>
                    setObjectiveData({ ...objectiveData, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            <Button onClick={() => setStep("keyResults")} className="w-full">
              Next: Add Key Results
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "keyResults" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Key Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {keyResults.map((kr, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Key Result {index + 1}</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeKeyResult(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <Input
                  placeholder="e.g., Achieve NPS score of 50+"
                  value={kr.title}
                  onChange={(e) => updateKeyResult(index, "title", e.target.value)}
                />

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Target Value</Label>
                    <Input
                      type="number"
                      value={kr.targetValue}
                      onChange={(e) =>
                        updateKeyResult(index, "targetValue", parseFloat(e.target.value))
                      }
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Unit</Label>
                    <Input
                      placeholder="e.g., points"
                      value={kr.unit}
                      onChange={(e) => updateKeyResult(index, "unit", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Type</Label>
                    <Select
                      value={kr.measurementType}
                      onValueChange={(value: any) =>
                        updateKeyResult(index, "measurementType", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="currency">Currency</SelectItem>
                        <SelectItem value="boolean">Yes/No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              onClick={addKeyResult}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Key Result
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("objective")}
                className="flex-1"
              >
                Back
              </Button>
              <Button onClick={handleCreateObjective} className="flex-1">
                Create OKR
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}