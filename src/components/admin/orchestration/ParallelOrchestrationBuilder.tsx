import React, { useState } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Zap, Plus, Trash2, Play, Save, Edit2, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type AgentConfig = {
  agentKey: string;
  mode: string;
  input?: string;
};

type ParallelOrchestration = {
  _id: string;
  name: string;
  description: string;
  agents: AgentConfig[];
  isActive: boolean;
};

export function ParallelOrchestrationBuilder() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [newAgentKey, setNewAgentKey] = useState("");
  const [newAgentMode, setNewAgentMode] = useState("proposeNextAction");
  const [executing, setExecuting] = useState<string | null>(null);

  const orchestrations = useQuery(api.agentOrchestrationData.listParallelOrchestrations as any) as ParallelOrchestration[] | undefined;
  const createOrchestration = useMutation(api.agentOrchestrationData.createParallelOrchestration as any);
  const updateOrchestration = useMutation(api.agentOrchestrationData.updateParallelOrchestration as any);
  const deleteOrchestration = useMutation(api.agentOrchestrationData.deleteParallelOrchestration as any);
  const toggleOrchestration = useMutation(api.agentOrchestrationData.toggleParallelOrchestration as any);
  const executeParallel = useAction(api.agentOrchestration.executeParallel);

  const systemAgents = useQuery(api.aiAgents.adminListAgents as any, { activeOnly: true, limit: 50 }) as Array<{ agent_key: string; display_name: string }> | undefined;

  const handleAddAgent = () => {
    if (!newAgentKey) {
      toast.error("Please select an agent");
      return;
    }
    setAgents([...agents, { agentKey: newAgentKey, mode: newAgentMode }]);
    setNewAgentKey("");
    setNewAgentMode("proposeNextAction");
  };

  const handleRemoveAgent = (index: number) => {
    setAgents(agents.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a name");
      return;
    }
    if (agents.length === 0) {
      toast.error("Please add at least one agent");
      return;
    }

    try {
      if (editingId) {
        await updateOrchestration({ orchestrationId: editingId, name, description, agents });
        toast.success("Orchestration updated");
      } else {
        await createOrchestration({ name, description, agents });
        toast.success("Orchestration created");
      }
      handleReset();
    } catch (e: any) {
      toast.error(e?.message || "Failed to save orchestration");
    }
  };

  const handleEdit = (orch: ParallelOrchestration) => {
    setEditingId(orch._id);
    setName(orch.name);
    setDescription(orch.description);
    setAgents(orch.agents);
  };

  const handleReset = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setAgents([]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this orchestration?")) return;
    try {
      await deleteOrchestration({ orchestrationId: id });
      toast.success("Orchestration deleted");
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete");
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      await toggleOrchestration({ orchestrationId: id, isActive: !currentStatus });
      toast.success(`Orchestration ${!currentStatus ? "activated" : "deactivated"}`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to toggle");
    }
  };

  const handleExecute = async (orch: ParallelOrchestration) => {
    setExecuting(orch._id);
    try {
      // Get a business ID (in real app, this would come from context)
      const result = await executeParallel({
        agents: orch.agents,
        businessId: "placeholder" as any, // TODO: Get from context
        orchestrationId: orch._id,
      });
      
      toast.success(`Executed successfully! Success rate: ${Math.round(result.successRate * 100)}%`);
    } catch (e: any) {
      toast.error(e?.message || "Execution failed");
    } finally {
      setExecuting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Builder Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            {editingId ? "Edit" : "Create"} Parallel Orchestration
          </CardTitle>
          <CardDescription>
            Execute multiple agents concurrently for faster processing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="e.g., Content Generation Pipeline"
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
            <Label>Agents ({agents.length})</Label>
            <div className="flex gap-2">
              <Select value={newAgentKey} onValueChange={setNewAgentKey}>
                <SelectTrigger className="flex-1">
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
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proposeNextAction">Propose Action</SelectItem>
                  <SelectItem value="summarizeIdeas">Summarize</SelectItem>
                  <SelectItem value="planWeek">Plan Week</SelectItem>
                  <SelectItem value="analyzeData">Analyze Data</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddAgent} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {agents.length > 0 && (
            <div className="space-y-2">
              {agents.map((agent, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 border rounded">
                  <Badge variant="outline">{agent.agentKey}</Badge>
                  <Badge variant="secondary">{agent.mode}</Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRemoveAgent(idx)}
                    className="ml-auto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={!name || agents.length === 0}>
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

      {/* Orchestrations List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Saved Orchestrations</h3>
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
                  <div className="flex flex-wrap gap-1">
                    {orch.agents.map((agent, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {agent.agentKey}
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