import { Button } from "@/components/ui/button";
import React from "react";

type AgentRowProps = {
  agent: any;
};

export function AgentRow({ agent }: AgentRowProps) {
  const statusColor =
    agent.status === "active"
      ? "bg-green-500"
      : agent.status === "training"
      ? "bg-yellow-500"
      : "bg-gray-500";

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center space-x-4">
        <div className={`w-3 h-3 rounded-full ${statusColor}`} />
        <div>
          <h3 className="font-medium truncate max-w-[220px]">{agent.name}</h3>
          <p className="text-sm text-muted-foreground capitalize">
            {String(agent.type || "").replace("_", " ")}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <p className="text-sm font-medium">{agent.metrics?.totalRuns ?? 0} runs</p>
          <p className="text-xs text-muted-foreground">
            {agent.metrics?.successRate ?? 0}% success
          </p>
        </div>
        <Button variant="outline" size="sm">
          Configure
        </Button>
      </div>
    </div>
  );
}
