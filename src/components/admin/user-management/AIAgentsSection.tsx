import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, CheckCircle, XCircle } from "lucide-react";
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
  return (
    <div>
      <h3 className="font-semibold mb-2 flex items-center gap-2">
        <Bot className="h-4 w-4" />
        AI Agents ({agents.length})
      </h3>
      <div className="space-y-2">
        {agents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No AI agents configured</p>
        ) : (
          agents.map((agent) => (
            <div
              key={agent._id}
              className="flex items-center justify-between p-3 border rounded-lg"
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
