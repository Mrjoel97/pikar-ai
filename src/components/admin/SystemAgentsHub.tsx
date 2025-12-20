import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Bot, Zap, CheckCircle, XCircle, Search, Plus, Edit, Eye, BookOpen } from "lucide-react";
import { AgentCreateDialog } from "./AgentCreateDialog";
import { AgentTrainingDialog } from "./AgentTrainingDialog";

export function SystemAgentsHub() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [trainingDialogOpen, setTrainingDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<{ key: string; name: string } | null>(null);

  // Fetch system agents from agentCatalog (built-in agents)
  const catalogAgents = useQuery(api.aiAgents.adminListAgents as any, {
    activeOnly: false,
    limit: 100,
  }) as Array<{
    _id: string;
    agent_key: string;
    display_name: string;
    short_desc: string;
    long_desc: string;
    capabilities: string[];
    default_model: string;
    tier_restrictions: string[];
    active: boolean;
    confidence_hint?: number;
  }> | undefined;

  const toggleAgent = useMutation(api.aiAgents.adminToggleAgent as any);

  // Filter agents based on search and tier
  const filteredAgents = (catalogAgents || []).filter((agent) => {
    const matchesSearch = searchQuery
      ? agent.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.agent_key?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.short_desc?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    const matchesTier = selectedTier
      ? agent.tier_restrictions?.includes(selectedTier) || agent.tier_restrictions?.length === 0
      : true;

    return matchesSearch && matchesTier;
  });

  const handleToggleAgent = async (agentKey: string, currentStatus: boolean) => {
    try {
      await toggleAgent({ agent_key: agentKey, active: !currentStatus });
      toast.success(`Agent ${!currentStatus ? "activated" : "deactivated"}`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to toggle agent");
    }
  };

  const handleOpenTraining = (agentKey: string, agentName: string) => {
    setSelectedAgent({ key: agentKey, name: agentName });
    setTrainingDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="h-8 w-8 text-emerald-600" />
            System Agents Hub
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and configure built-in AI agents across the platform
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Agent
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
            >
              <option value="">All Tiers</option>
              <option value="solopreneur">Solopreneur</option>
              <option value="startup">Startup</option>
              <option value="sme">SME</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                Total: {catalogAgents?.length || 0}
              </Badge>
              <Badge variant="outline">
                Active: {catalogAgents?.filter(a => a.active).length || 0}
              </Badge>
              <Badge variant="outline">
                Filtered: {filteredAgents.length}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAgents.map((agent) => (
          <Card key={agent._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-emerald-600" />
                  <CardTitle className="text-lg">{agent.display_name || agent.agent_key}</CardTitle>
                </div>
                <Badge variant={agent.active ? "default" : "secondary"}>
                  {agent.active ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <XCircle className="h-3 w-3 mr-1" />
                  )}
                  {agent.active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                {agent.agent_key}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {agent.short_desc || agent.long_desc || "No description available"}
              </p>

              <Separator />

              {/* Capabilities */}
              <div>
                <div className="text-xs font-medium mb-2">Capabilities</div>
                <div className="flex flex-wrap gap-1">
                  {(agent.capabilities || []).slice(0, 3).map((cap, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {cap}
                    </Badge>
                  ))}
                  {(agent.capabilities || []).length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{agent.capabilities.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Tier Restrictions */}
              {agent.tier_restrictions && agent.tier_restrictions.length > 0 && (
                <div>
                  <div className="text-xs font-medium mb-2">Available for</div>
                  <div className="flex flex-wrap gap-1">
                    {agent.tier_restrictions.map((tier, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tier}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Model Info */}
              <div className="text-xs text-muted-foreground">
                Model: {agent.default_model || "gpt-4o-mini"}
              </div>

              {/* Confidence */}
              {typeof agent.confidence_hint === "number" && (
                <div className="text-xs text-muted-foreground">
                  Confidence: {Math.round(agent.confidence_hint * 100)}%
                </div>
              )}

              <Separator />

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleOpenTraining(agent.agent_key, agent.display_name || agent.agent_key)}
                >
                  <BookOpen className="h-3 w-3 mr-1" />
                  Training
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => toast.info("View details coming soon")}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant={agent.active ? "destructive" : "default"}
                  onClick={() => handleToggleAgent(agent.agent_key, agent.active)}
                >
                  {agent.active ? "Disable" : "Enable"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredAgents.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No agents found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || selectedTier
                ? "Try adjusting your filters"
                : "No system agents are configured yet"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <AgentCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {selectedAgent && (
        <AgentTrainingDialog
          open={trainingDialogOpen}
          onOpenChange={setTrainingDialogOpen}
          agentKey={selectedAgent.key}
          agentName={selectedAgent.name}
        />
      )}
    </div>
  );
}