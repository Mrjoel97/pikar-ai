import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Play, Clock, Webhook, BarChart3 } from "lucide-react";
import { WorkflowCard } from "./WorkflowCard";
import { PipelineEditor } from "./PipelineEditor";
import type { Id } from "@/convex/_generated/dataModel";

function getTriggerIcon(type: string) {
  switch (type) {
    case "manual":
      return <Play className="h-4 w-4 text-muted-foreground" />;
    case "schedule":
      return <Clock className="h-4 w-4 text-muted-foreground" />;
    case "webhook":
      return <Webhook className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Play className="h-4 w-4 text-muted-foreground" />;
  }
}

interface WorkflowListViewProps {
  workflows: any;
  businesses: any[];
  searchFilter: string;
  onSearchChange: (value: string) => void;
  expanded: Record<string, boolean>;
  editedPipelines: Record<string, any[]>;
  roleFilter: string;
  onRoleFilterChange: (role: string) => void;
  onToggleExpand: (workflow: any) => void;
  onSimulate: (workflowId: Id<"workflows">) => void;
  onComplianceCheck: (workflowId: Id<"workflows">) => void;
  onEstimateRoi: (workflowId: Id<"workflows">) => void;
  onViewExecutions: (workflowId: string) => void;
  onSavePipeline: (workflow: any) => void;
  onEditPipeline: (workflowId: string, pipeline: any[]) => void;
  onLoadMore: () => void;
}

export function WorkflowListView({
  workflows,
  businesses,
  searchFilter,
  onSearchChange,
  expanded,
  editedPipelines,
  roleFilter,
  onRoleFilterChange,
  onToggleExpand,
  onSimulate,
  onComplianceCheck,
  onEstimateRoi,
  onViewExecutions,
  onSavePipeline,
  onEditPipeline,
  onLoadMore,
}: WorkflowListViewProps) {
  return (
    <div className="space-y-4">
      <div className="mb-4">
        <Input
          placeholder="Search workflows..."
          value={searchFilter}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {!workflows ? (
        <div className="grid gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-6 w-3/4 rounded bg-muted" />
                <div className="h-4 w-full rounded bg-muted" />
                <div className="flex gap-2">
                  <div className="h-8 w-20 rounded bg-muted" />
                  <div className="h-8 w-24 rounded bg-muted" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : workflows.page?.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchFilter ? "No matching workflows" : "No workflows yet"}
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {workflows.page?.map((workflow: any) => (
              <div key={workflow._id}>
                <WorkflowCard
                  workflow={workflow}
                  businesses={businesses}
                  expanded={expanded[workflow._id] || false}
                  editedPipeline={editedPipelines[workflow._id]}
                  onToggleExpand={() => onToggleExpand(workflow)}
                  onSimulate={() => onSimulate(workflow._id)}
                  onComplianceCheck={() => onComplianceCheck(workflow._id)}
                  onEstimateRoi={() => onEstimateRoi(workflow._id)}
                  onViewExecutions={() => onViewExecutions(workflow._id)}
                  onSavePipeline={() => onSavePipeline(workflow)}
                  onEditPipeline={(pipeline) => onEditPipeline(workflow._id, pipeline)}
                  roleFilter={roleFilter}
                  onRoleFilterChange={onRoleFilterChange}
                />
                
                {expanded[workflow._id] && (
                  <PipelineEditor
                    workflow={workflow}
                    pipeline={editedPipelines[workflow._id] ?? workflow.pipeline}
                    businesses={businesses}
                    onUpdatePipeline={(pipeline) => onEditPipeline(workflow._id, pipeline)}
                    onSave={() => onSavePipeline(workflow)}
                    onAddApproval={() => {}}
                    onAddDelay={() => {}}
                  />
                )}
              </div>
            ))}
          </div>
          
          {!workflows.isDone && (
            <div className="mt-6 text-center">
              <Button variant="outline" onClick={onLoadMore}>
                Load More Workflows
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
