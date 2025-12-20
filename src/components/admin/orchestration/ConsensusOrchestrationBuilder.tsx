import React, { useState } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Users, Plus, Trash2, Save, Edit2, Play, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ConsensusOrchestration = {
  _id: string;
  name: string;
  description: string;
  agents: string[];
  question: string;
  consensusThreshold: number;
  isActive: boolean;
};

export function ConsensusOrchestrationBuilder() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [question, setQuestion] = useState("");
  const [agents, setAgents] = useState<string[]>([]);
  const [threshold, setThreshold] = useState(0.6);
  const [newAgentKey, setNewAgentKey] = useState("");
  const [executing, setExecuting] = useState<string | null>(null);

  const orchestrations = useQuery(api.agentOrchestrationData.listConsensusOrchestrations as any) as ConsensusOrchestration[] | undefined;
  const createOrchestration = useMutation(api.agentOrchestrationData.createConsensusOrchestration as any);
  const updateOrchestration = useMutation(api.agentOrchestrationData.updateConsensusOrchestration as any);
  const deleteOrchestration = useMutation(api.agentOrchestrationData.deleteConsensusOrchestration as any);
  const toggleOrchestration = useMutation(api.agentOrchestrationData.toggleConsensusOrchestration as any);
  const resolveWithConsensus = useAction(api.agentOrchestration.resolveWithConsensus);

  const systemAgents = useQuery(api.aiAgents.adminListAgents as any, { activeOnly: true, limit: 50 }) as Array<{ agent_key: string; display_name: string }> | undefined;
  const businesses = useQuery(api.businesses.getUserBusinesses);

  const handleAddAgent = () => {
    if (!newAgentKey) {
      toast.error("Please select an agent");
      return;
    }
    if (agents.includes(newAgentKey)) {
      toast.error("Agent already added");
      return;
    }
    setAgents([...agents, newAgentKey]);
    setNewAgentKey("");
  };

  const handleRemoveAgent = (agentKey: string) => {
    setAgents(agents.filter((a) => a !== agentKey));
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
    if (agents.length < 2) {
      toast.error("Please add at least 2 agents for consensus");
      return;
    }
    if (agents.length > 10) {
      toast.error("Maximum 10 agents allowed");
      return;
    }
    if (!question.trim()) {
      toast.error("Please enter a question");
      return;
    }
    if (question.length > 500) {
      toast.error("Question must be 500 characters or less");
      return;
    }
    if (threshold < 0.5 || threshold > 1.0) {
      toast.error("Consensus threshold must be between 50% and 100%");
      return;
    }

    try {
      if (editingId) {
        await updateOrchestration({ orchestrationId: editingId, name, description, agents, question, consensusThreshold: threshold });
        toast.success("Consensus updated");
      } else {
        await createOrchestration({ name, description, agents, question, consensusThreshold: threshold });
        toast.success("Consensus created");
      }
      handleReset();
    } catch (e: any) {
      toast.error(e?.message || "Failed to save consensus");
    }
  };

  const handleEdit = (orch: ConsensusOrchestration) => {
    setEditingId(orch._id);
    setName(orch.name);
    setDescription(orch.description);
    setQuestion(orch.question);
    setAgents(orch.agents);
    setThreshold(orch.consensusThreshold);
  };

  const handleReset = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setQuestion("");
    setAgents([]);
    setThreshold(0.6);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this consensus orchestration?")) return;
    try {
      await deleteOrchestration({ orchestrationId: id });
      toast.success("Consensus deleted");
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete");
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      await toggleOrchestration({ orchestrationId: id, isActive: !currentStatus });
      toast.success(`Consensus ${!currentStatus ? "activated" : "deactivated"}`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to toggle");
    }
  };

  const handleExecute = async (orch: ConsensusOrchestration) => {
    setExecuting(orch._id);
    try {
      const businessId = businesses?.[0]?._id;
      
      if (!businessId) {
        toast.error("No business context found");
        setExecuting(null);
        return;
      }

      const result = await resolveWithConsensus({
        agents: orch.agents,
        question: orch.question,
        businessId: businessId,
        consensusThreshold: orch.consensusThreshold,
      });
      
      if (result.hasConsensus) {
        toast.success(`Consensus reached! Score: ${Math.round(result.consensusScore * 100)}%`);
      } else {
        toast.warning(`No consensus reached. Score: ${Math.round(result.consensusScore * 100)}%`);
      }
    } catch (e: any) {
      toast.error(e?.message || "Execution failed");
    } finally {
      setExecuting(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {editingId ? "Edit" : "Create"} Consensus Orchestration
          </CardTitle>
          <CardDescription>
            Get multiple agent opinions and resolve conflicts through consensus
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="e.g., Strategic Decision Consensus"
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
            <Label>Question</Label>
            <Input
              placeholder="What question should the agents answer?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Consensus Threshold: {Math.round(threshold * 100)}%</Label>
            <Slider
              value={[threshold]}
              onValueChange={(vals) => setThreshold(vals[0])}
              min={0.5}
              max={1.0}
              step={0.05}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Minimum agreement level required to reach consensus
            </p>
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
              <Button onClick={handleAddAgent} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {agents.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {agents.map((agentKey) => (
                <Badge key={agentKey} variant="outline" className="flex items-center gap-1">
                  {agentKey}
                  <button
                    onClick={() => handleRemoveAgent(agentKey)}
                    className="ml-1 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={!name || agents.length < 2 || !question}>
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
        <h3 className="text-lg font-semibold">Saved Consensus Orchestrations</h3>
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
                    <Badge variant="outline">{Math.round(orch.consensusThreshold * 100)}% threshold</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{orch.description}</p>
                  <p className="text-sm font-medium mb-2">Q: {orch.question}</p>
                  <div className="flex flex-wrap gap-1">
                    {orch.agents.map((agentKey) => (
                      <Badge key={agentKey} variant="outline" className="text-xs">
                        {agentKey}
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