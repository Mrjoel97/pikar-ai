import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { GitBranch, Plus, Trash2, Save, Edit2, ArrowDown } from "lucide-react";
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

  const orchestrations = useQuery(api.agentOrchestrationData.listChainOrchestrations as any) as ChainOrchestration[] | undefined;
  const createOrchestration = useMutation(api.agentOrchestrationData.createChainOrchestration as any);
  const updateOrchestration = useMutation(api.agentOrchestrationData.updateChainOrchestration as any);
  const deleteOrchestration = useMutation(api.agentOrchestrationData.deleteChainOrchestration as any);
  const toggleOrchestration = useMutation(api.agentOrchestrationData.toggleChainOrchestration as any);

  const systemAgents = useQuery(api.aiAgents.adminListAgents as any, { activeOnly: true, limit: 50 }) as Array<{ agent_key: string; display_name: string }> | undefined;

  const handleAddStep = () => {
    if (!newAgentKey) {
      toast.error("Please select an agent");
      return;
    }
    setChain([...chain, { agentKey: newAgentKey, mode: newAgentMode, inputTransform: newTransform || undefined }]);
    setNewAgentKey("");
    setNewAgentMode("proposeNextAction");
    setNewTransform("");
  };

  const handleRemoveStep = (index: number) => {
    setChain(chain.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a name");
      return;
    }
    if (chain.length === 0) {
      toast.error("Please add at least one step");
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
      toast.error(e?.message || "Failed to save chain");
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
      toast.error(e?.message || "Failed to delete");
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      await toggleOrchestration({ orchestrationId: id, isActive: !currentStatus });
      toast.success(`Chain ${!currentStatus ? "activated" : "deactivated"}`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to toggle");
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
              <Select value={newAgentMode} onValueChange={setNewAgentMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proposeNextAction">Propose Action</SelectItem>
                  <SelectItem value="summarizeIdeas">Summarize</SelectItem>
                  <SelectItem value="planWeek">Plan Week</SelectItem>
                  <SelectItem value="analyzeData">Analyze Data</SelectItem>
                </SelectContent>
              </Select>
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
          </div>

          {chain.length > 0 && (
            <div className="space-y-2">
              {chain.map((step, idx) => (
                <div key={idx}>
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <Badge variant="outline">Step {idx + 1}</Badge>
                    <Badge variant="outline">{step.agentKey}</Badge>
                    <Badge variant="secondary">{step.mode}</Badge>
                    {step.inputTransform && (
                      <Badge variant="secondary" className="text-xs">
                        Transform: {step.inputTransform}
                      </Badge>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveStep(idx)}
                      className="ml-auto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {idx < chain.length - 1 && (
                    <div className="flex justify-center py-1">
                      <ArrowDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
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
