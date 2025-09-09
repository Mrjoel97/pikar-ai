import { Button } from "@/components/ui/button";
import React from "react";

type WorkflowRowProps = {
  workflow: any;
};

export function WorkflowRow({ workflow }: WorkflowRowProps) {
  const statusColor =
    workflow.status === "active"
      ? "bg-green-500"
      : workflow.status === "draft"
      ? "bg-yellow-500"
      : "bg-gray-500";

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition">
      <div className="flex items-center space-x-4">
        <div className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
        <div>
          <h3 className="font-medium truncate max-w-[240px]">{workflow.name}</h3>
          <p className="text-xs text-muted-foreground truncate max-w-[340px]">
            {workflow.description}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <p className="text-sm font-medium">{workflow.metrics?.totalRuns ?? 0} runs</p>
          <p className="text-xs text-muted-foreground">
            {workflow.metrics?.successRate ?? 0}% success
          </p>
        </div>
        <Button variant="outline" size="sm">Edit</Button>
      </div>
    </div>
  );
}