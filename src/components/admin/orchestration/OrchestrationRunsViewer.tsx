import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Clock, CheckCircle, XCircle, Eye, Trash2, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";

type OrchestrationRun = {
  _id: string;
  businessId: string;
  type: string;
  agentCount: number;
  status: string;
  duration?: number;
  successCount?: number;
  failureCount?: number;
  error?: string;
  createdAt: number;
  updatedAt?: number;
};

type AgentExecution = {
  _id: string;
  orchestrationId: string;
  agentKey: string;
  status: string;
  duration: number;
  result?: any;
  error?: string;
  createdAt: number;
  metadata?: {
    inputTokens?: number;
    outputTokens?: number;
    model?: string;
    retries?: number;
  };
};

export function OrchestrationRunsViewer() {
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | "parallel" | "chain" | "consensus">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "failed" | "running">("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");

  const allRuns = useQuery(api.agentOrchestrationData.getRecentOrchestrationRuns, {
    type: typeFilter === "all" ? undefined : typeFilter,
    limit: 100,
  }) as OrchestrationRun[] | undefined;

  const allExecutions = useQuery(
    api.agentOrchestrationData.getOrchestrationExecutions,
    { limit: 500 }
  ) as AgentExecution[] | undefined;

  // Extract unique agent keys for filter
  const uniqueAgents = React.useMemo(() => {
    if (!allExecutions) return [];
    const agents = new Set(allExecutions.map(e => e.agentKey));
    return Array.from(agents).sort();
  }, [allExecutions]);

  // Apply filters
  const runs = React.useMemo(() => {
    if (!allRuns) return [];
    
    let filtered = allRuns;
    
    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(run => run.status === statusFilter);
    }
    
    // Agent filter (check if any execution in this run matches the agent)
    if (agentFilter !== "all" && allExecutions) {
      const runIdsWithAgent = new Set(
        allExecutions
          .filter(e => e.agentKey === agentFilter)
          .map(e => e.orchestrationId)
      );
      filtered = filtered.filter(run => runIdsWithAgent.has(run._id));
    }
    
    return filtered;
  }, [allRuns, statusFilter, agentFilter, allExecutions]);

  const executions = useQuery(
    api.agentOrchestrationData.getOrchestrationExecutions,
    selectedRun ? { orchestrationId: selectedRun as any, limit: 100 } : "skip"
  ) as AgentExecution[] | undefined;

  const deleteRun = useMutation(api.agentOrchestrationData.deleteOrchestrationRun);

  const handleDelete = async (runId: string) => {
    if (!confirm("Delete this orchestration run and all its execution logs?")) return;
    try {
      await deleteRun({ orchestrationId: runId as any });
      toast.success("Run deleted");
      if (selectedRun === runId) setSelectedRun(null);
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete run");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "running":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return "N/A";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Orchestration Runs</CardTitle>
          <CardDescription>View and manage orchestration execution history</CardDescription>
          <div className="space-y-3 mt-4">
            <div className="flex flex-wrap gap-2">
              <div className="text-xs font-medium text-muted-foreground mr-2 flex items-center">Type:</div>
              {["all", "parallel", "chain", "consensus"].map((type) => (
                <Button
                  key={type}
                  size="sm"
                  variant={typeFilter === type ? "default" : "outline"}
                  onClick={() => setTypeFilter(type as any)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-2">
              <div className="text-xs font-medium text-muted-foreground mr-2 flex items-center">Status:</div>
              {["all", "completed", "failed", "running"].map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={statusFilter === status ? "default" : "outline"}
                  onClick={() => setStatusFilter(status as any)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-2 items-center">
              <div className="text-xs font-medium text-muted-foreground mr-2">Agent:</div>
              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  {uniqueAgents.map((agent) => (
                    <SelectItem key={agent} value={agent}>
                      {agent}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(typeFilter !== "all" || statusFilter !== "all" || agentFilter !== "all") && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setTypeFilter("all");
                    setStatusFilter("all");
                    setAgentFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
            
            <div className="text-xs text-muted-foreground">
              Showing {runs?.length || 0} run{runs?.length !== 1 ? 's' : ''}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {(runs || []).map((run) => (
                <Card key={run._id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(run.status)}
                        <Badge variant="outline">{run.type}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(run.createdAt, { addSuffix: true })}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Agents:</span> {run.agentCount}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Duration:</span> {formatDuration(run.duration)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Success:</span> {run.successCount || 0}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Failed:</span> {run.failureCount || 0}
                        </div>
                      </div>
                      {run.error && (
                        <div className="mt-2 text-sm text-red-500">
                          Error: {run.error}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedRun(run._id)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>Execution Details</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="h-[60vh]">
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="font-semibold">Type:</span> {run.type}
                                </div>
                                <div>
                                  <span className="font-semibold">Status:</span> {run.status}
                                </div>
                                <div>
                                  <span className="font-semibold">Duration:</span> {formatDuration(run.duration)}
                                </div>
                                <div>
                                  <span className="font-semibold">Agents:</span> {run.agentCount}
                                </div>
                              </div>
                              
                              <div className="border-t pt-4">
                                <h4 className="font-semibold mb-2">Agent Executions</h4>
                                {(executions || []).map((exec) => (
                                  <Card key={exec._id} className="p-3 mb-2">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          {getStatusIcon(exec.status)}
                                          <span className="font-medium">{exec.agentKey}</span>
                                          <Badge variant={exec.status === "success" ? "default" : "destructive"}>
                                            {exec.status}
                                          </Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          Duration: {formatDuration(exec.duration)}
                                        </div>
                                        {exec.metadata && (
                                          <div className="text-xs text-muted-foreground mt-1">
                                            {exec.metadata.inputTokens && (
                                              <span>In: {exec.metadata.inputTokens} tokens | </span>
                                            )}
                                            {exec.metadata.outputTokens && (
                                              <span>Out: {exec.metadata.outputTokens} tokens | </span>
                                            )}
                                            {exec.metadata.model && (
                                              <span>Model: {exec.metadata.model}</span>
                                            )}
                                          </div>
                                        )}
                                        {exec.error && (
                                          <div className="text-sm text-red-500 mt-1">
                                            {exec.error}
                                          </div>
                                        )}
                                        {exec.result && (
                                          <details className="mt-2">
                                            <summary className="text-sm cursor-pointer text-blue-500">
                                              View Result
                                            </summary>
                                            <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                                              {JSON.stringify(exec.result, null, 2)}
                                            </pre>
                                          </details>
                                        )}
                                      </div>
                                    </div>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(run._id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
