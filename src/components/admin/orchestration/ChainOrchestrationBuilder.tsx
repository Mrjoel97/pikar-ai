import React, { useState } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { GitBranch, Plus, Trash2, Save, Edit2, ArrowDown, Play, Loader2, GripVertical, ArrowUp, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ChainStep = {
  agentKey: string;
  mode: string;
  inputTransform?: string;
};

type ChainOrchestration = {
  _id: string;
  name: string;
  description: string;
  chain: ChainStep[];
  initialInput: string;
  isActive: boolean;
};

export function ChainOrchestrationBuilder() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [initialInput, setInitialInput] = useState("");
  const [chain, setChain] = useState<ChainStep[]>([]);
  const [newAgentKey, setNewAgentKey] = useState("");
  const [newAgentMode, setNewAgentMode] = useState("proposeNextAction");
  const [newTransform, setNewTransform] = useState("");
  const [customMode, setCustomMode] = useState("");
  const [showCustomMode, setShowCustomMode] = useState(false);
  const [executing, setExecuting] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const orchestrations = useQuery(api.agentOrchestrationData.listChainOrchestrations as any) as ChainOrchestration[] | undefined;
  const createOrchestration = useMutation(api.agentOrchestrationData.createChainOrchestration as any);
  const updateOrchestration = useMutation(api.agentOrchestrationData.updateChainOrchestration as any);
  const deleteOrchestration = useMutation(api.agentOrchestrationData.deleteChainOrchestration as any);
  const toggleOrchestration = useMutation(api.agentOrchestrationData.toggleChainOrchestration as any);
  const chainAgents = useAction(api.agentOrchestration.chainAgents);

  const systemAgents = useQuery(api.aiAgents.adminListAgents as any, { activeOnly: true, limit: 50 }) as Array<{ agent_key: string; display_name: string }> | undefined;
  const businesses = useQuery(api.businesses.getUserBusinesses);

  const handleAddStep = () => {
    if (!newAgentKey) {
      toast.error("Please select an agent");
      return;
    }
    if (chain.length >= 10) {
      toast.error("Maximum 10 steps allowed per chain");
      return;
    }
    if (newTransform && newTransform.length > 200) {
      toast.error("Transform instruction must be 200 characters or less");
      return;
    }
    
    const modeToUse = showCustomMode && customMode.trim() ? customMode.trim() : newAgentMode;
    
    setChain([...chain, { agentKey: newAgentKey, mode: modeToUse, inputTransform: newTransform || undefined }]);
    setNewAgentKey("");
    setNewAgentMode("proposeNextAction");
    setNewTransform("");
    setCustomMode("");
    setShowCustomMode(false);
  };

  const handleRemoveStep = (index: number) => {
    setChain(chain.filter((_, i) => i !== index));
  };

  const handleMoveStep = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === chain.length - 1) return;
    
    const newChain = [...chain];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newChain[index], newChain[targetIndex]] = [newChain[targetIndex], newChain[index]];
    setChain(newChain);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a name");
      return;
    }
    if (name.length > 100) {
      toast.error("Name must be 100 characters or less");
      return;
    }
    if (description.length > 500) {
      toast.error("Description must be 500 characters or less");
      return;
    }
    if (chain.length === 0) {
      toast.error("Please add at least one step");
      return;
    }
    if (chain.length > 10) {
      toast.error("Maximum 10 steps allowed");
      return;
    }
    if (initialInput.length > 1000) {
      toast.error("Initial input must be 1000 characters or less");
      return;
    }

    try {
      if (editingId) {
        await updateOrchestration({ orchestrationId: editingId, name, description, chain, initialInput });
        toast.success("Chain updated");
      } else {
        await createOrchestration({ name, description, chain, initialInput });
        toast.success("Chain created");
      }
      handleReset();
    } catch (e: any) {
      const errorMsg = e?.message || "Failed to save chain";
      setErrorDetails(errorMsg);
      toast.error(errorMsg);
      console.error("Chain save error:", e);
    }
  };

  const handleEdit = (orch: ChainOrchestration) => {
    setEditingId(orch._id);
    setName(orch.name);
    setDescription(orch.description);
    setInitialInput(orch.initialInput);
    setChain(orch.chain);
  };

  const handleReset = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setInitialInput("");
    setChain([]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this chain?")) return;
    try {
      await deleteOrchestration({ orchestrationId: id });
      toast.success("Chain deleted");
    } catch (e: any) {
      const errorMsg = e?.message || "Failed to delete";
      setErrorDetails(errorMsg);
      toast.error(errorMsg);
      console.error("Chain delete error:", e);
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      await toggleOrchestration({ orchestrationId: id, isActive: !currentStatus });
      toast.success(`Chain ${!currentStatus ? "activated" : "deactivated"}`);
    } catch (e: any) {
      const errorMsg = e?.message || "Failed to toggle";
      setErrorDetails(errorMsg);
      toast.error(errorMsg);
      console.error("Chain toggle error:", e);
    }
  };

  const handleExecute = async (orch: ChainOrchestration) => {
    setExecuting(orch._id);
    try {
      const businessId = businesses?.[0]?._id;
      
      if (!businessId) {
        toast.error("No business context found");
        setExecuting(null);
        return;
      }

      const result = await chainAgents({
        chain: orch.chain,
        initialInput: orch.initialInput,
        businessId: businessId,
      });
      
      if (result.success) {
        toast.success(`Chain executed successfully in ${result.totalDuration}ms`);
      } else {
        toast.error(`Chain failed at step ${result.failedAt + 1}`);
      }
    } catch (e: any) {
      const errorMsg = e?.message || "Execution failed";
      setErrorDetails(errorMsg);
      toast.error(errorMsg);
      console.error("Chain execution error:", e);
    } finally {
      setExecuting(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            {editingId ? "Edit" : "Create"} Chain Orchestration
          </CardTitle>
          <CardDescription>
            Chain agents sequentially, passing output from one to the next
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="e.g., Content Review Pipeline"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Brief description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Initial Input</Label>
            <Input
              placeholder="Starting prompt for the chain"
              value={initialInput}
              onChange={(e) => setInitialInput(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Chain Steps ({chain.length})</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Select value={newAgentKey} onValueChange={setNewAgentKey}>
                <SelectTrigger>
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
                  {(systemAgents || []).map((agent) => (
                    <SelectItem key={agent.agent_key} value={agent.agent_key}>
                      {agent.display_name || agent.agent_key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <Select value={showCustomMode ? "custom" : newAgentMode} onValueChange={(val) => {
                        if (val === "custom") {
                          setShowCustomMode(true);
                        } else {
                          setShowCustomMode(false);
                          setNewAgentMode(val);
                        }
                      }}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="proposeNextAction">Propose Action</SelectItem>
                          <SelectItem value="summarizeIdeas">Summarize Ideas</SelectItem>
                          <SelectItem value="planWeek">Plan Week</SelectItem>
                          <SelectItem value="analyzeData">Analyze Data</SelectItem>
                          <SelectItem value="generateContent">Generate Content</SelectItem>
                          <SelectItem value="reviewContent">Review Content</SelectItem>
                          <SelectItem value="optimizeStrategy">Optimize Strategy</SelectItem>
                          <SelectItem value="researchTopic">Research Topic</SelectItem>
                          <SelectItem value="createReport">Create Report</SelectItem>
                          <SelectItem value="validateData">Validate Data</SelectItem>
                          <SelectItem value="custom">Custom Mode...</SelectItem>
                        </SelectContent>
                      </Select>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <div className="space-y-1 text-xs">
                      <p><strong>Propose Action:</strong> Suggest next steps</p>
                      <p><strong>Summarize Ideas:</strong> Condense information</p>
                      <p><strong>Plan Week:</strong> Create schedules</p>
                      <p><strong>Analyze Data:</strong> Extract insights</p>
                      <p><strong>Generate Content:</strong> Create new material</p>
                      <p><strong>Review Content:</strong> Evaluate quality</p>
                      <p><strong>Optimize Strategy:</strong> Improve approaches</p>
                      <p><strong>Research Topic:</strong> Gather information</p>
                      <p><strong>Create Report:</strong> Compile findings</p>
                      <p><strong>Validate Data:</strong> Check accuracy</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="flex gap-2">
                <Input
                  placeholder="Transform (optional)"
                  value={newTransform}
                  onChange={(e) => setNewTransform(e.target.value)}
                />
                <Button onClick={handleAddStep} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {showCustomMode && (
              <Input
                placeholder="Enter custom mode name"
                value={customMode}
                onChange={(e) => setCustomMode(e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          {chain.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground mb-2">
                Sequential Execution Flow:
              </div>
              {chain.map((step, idx) => (
                  <div key={idx}>
                  <div className="flex items-center gap-2 p-3 border rounded bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 hover:bg-primary/10"
                        onClick={() => handleMoveStep(idx, "up")}
                        disabled={idx === 0}
                        title="Move step up"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 hover:bg-primary/10"
                        onClick={() => handleMoveStep(idx, "down")}
                        disabled={idx === chain.length - 1}
                        title="Move step down"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">Step {idx + 1}</Badge>
                        <span className="font-medium text-sm">{step.agentKey}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-xs">{step.mode}</Badge>
                        {step.inputTransform && (
                          <Badge variant="secondary" className="text-xs">
                            Transform: {step.inputTransform}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveStep(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {idx < chain.length - 1 && (
                    <div className="flex justify-center py-1">
                      <ArrowDown className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {errorDetails && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
              <strong>Error:</strong> {errorDetails}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setErrorDetails(null)}
                className="ml-2 h-6 px-2"
              >
                Dismiss
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={!name || chain.length === 0}>
              <Save className="h-4 w-4 mr-2" />
              {editingId ? "Update" : "Create"}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={handleReset}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Saved Chains</h3>
        {(orchestrations || []).map((orch) => (
          <Card key={orch._id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{orch.name}</h4>
                    <Badge variant={orch.isActive ? "default" : "secondary"}>
                      {orch.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{orch.description}</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Initial: {orch.initialInput || "N/A"}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {orch.chain.map((step, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {idx + 1}. {step.agentKey}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleExecute(orch)}
                    disabled={!orch.isActive || executing === orch._id}
                  >
                    {executing === orch._id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(orch)}>
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant={orch.isActive ? "secondary" : "default"}
                    onClick={() => handleToggle(orch._id, orch.isActive)}
                  >
                    {orch.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(orch._id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}