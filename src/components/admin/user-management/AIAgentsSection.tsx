import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, CheckCircle, XCircle, Search } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface AIAgentsSectionProps {
  agents: Array<{
    _id: Id<"aiAgents">;
    name: string;
    type: string;
    isActive: boolean;
  }>;
  onToggleAgent: (agentId: Id<"aiAgents">, isActive: boolean) => void;
}

export function AIAgentsSection({ agents, onToggleAgent }: AIAgentsSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"name" | "type">("name");

  // Filter and sort agents
  const filteredAgents = agents
    .filter((agent) => {
      // Search filter
      const matchesSearch = 
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.type.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = 
        filterStatus === "all" ||
        (filterStatus === "active" && agent.isActive) ||
        (filterStatus === "inactive" && !agent.isActive);
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else {
        return a.type.localeCompare(b.type);
      }
    });

  return (
    <div>
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Bot className="h-4 w-4" />
        AI Agents ({filteredAgents.length} of {agents.length})
      </h3>

      {/* Search and Filter Controls */}
      <div className="flex flex-wrap gap-2 mb-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Sort by Name</SelectItem>
            <SelectItem value="type">Sort by Type</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Agent List */}
      <div className="space-y-2">
        {filteredAgents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {agents.length === 0 ? "No AI agents configured" : "No agents match your filters"}
          </p>
        ) : (
          filteredAgents.map((agent) => (
            <div
              key={agent._id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Bot className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{agent.name}</p>
                  <p className="text-xs text-muted-foreground">{agent.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {agent.isActive ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    Inactive
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onToggleAgent(agent._id, agent.isActive)}
                >
                  {agent.isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}