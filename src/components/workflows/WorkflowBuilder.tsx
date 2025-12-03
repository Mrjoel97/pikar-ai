import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, GitBranch, Play, Save } from "lucide-react";
import { toast } from "sonner";

interface WorkflowStep {
  id: string;
  type: string;
  config: any;
  condition?: any;
  branches?: any;
}

export default function WorkflowBuilder({ businessId, onSave }: { businessId: string; onSave?: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [executionMode, setExecutionMode] = useState<"sequential" | "parallel">("sequential");

  const createWorkflow = useMutation(api.workflows.createWorkflow);

  const addStep = () => {
    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      type: "transform",
      config: {},
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter(s => s.id !== id));
  };

  const updateStep = (id: string, updates: Partial<WorkflowStep>) => {
    setSteps(steps.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a workflow name");
      return;
    }

    try {
      await createWorkflow({
        businessId: businessId as any,
        name,
        description,
        pipeline: steps.map(s => ({
          type: s.type,
          config: s.config,
          condition: s.condition,
          branches: s.branches,
        })),
        trigger: { type: "manual" },
        approval: { required: false, threshold: 1 },
        template: false,
        tags: [],
        status: "draft",
      });

      toast.success("Workflow created successfully");
      setName("");
      setDescription("");
      setSteps([]);
      onSave?.();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Workflow Builder</CardTitle>
          <CardDescription>Design your workflow with visual steps</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Workflow Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter workflow name"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this workflow does"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Execution Mode</Label>
            <Select value={executionMode} onValueChange={(v: any) => setExecutionMode(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sequential">Sequential</SelectItem>
                <SelectItem value="parallel">Parallel</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Workflow Steps</CardTitle>
              <CardDescription>Add and configure workflow steps</CardDescription>
            </div>
            <Button onClick={addStep} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {steps.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No steps added yet. Click "Add Step" to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {steps.map((step, index) => (
                <Card key={step.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Step Type</Label>
                            <Select
                              value={step.type}
                              onValueChange={(v) => updateStep(step.id, { type: v })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="transform">Transform Data</SelectItem>
                                <SelectItem value="filter">Filter Data</SelectItem>
                                <SelectItem value="api_call">API Call</SelectItem>
                                <SelectItem value="condition">Condition</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Configuration</Label>
                            <Input
                              placeholder="JSON config"
                              value={JSON.stringify(step.config)}
                              onChange={(e) => {
                                try {
                                  const config = JSON.parse(e.target.value);
                                  updateStep(step.id, { config });
                                } catch {}
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeStep(step.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => {
          setName("");
          setDescription("");
          setSteps([]);
        }}>
          Clear
        </Button>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Workflow
        </Button>
      </div>
    </div>
  );
}
