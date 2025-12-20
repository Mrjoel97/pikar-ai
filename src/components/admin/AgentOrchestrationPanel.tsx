import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Network, Database, Loader2, Info, BookOpen, History } from "lucide-react";
import { ParallelOrchestrationBuilder } from "./orchestration/ParallelOrchestrationBuilder";
import { ChainOrchestrationBuilder } from "./orchestration/ChainOrchestrationBuilder";
import { ConsensusOrchestrationBuilder } from "./orchestration/ConsensusOrchestrationBuilder";
import { OrchestrationRunsViewer } from "./orchestration/OrchestrationRunsViewer";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AgentOrchestrationPanel() {
  const [showGuide, setShowGuide] = useState(false);

  // Query counts to show orchestrations
  const parallelOrchestrations = useQuery(api.agentOrchestrationData.listParallelOrchestrations as any);
  const chainOrchestrations = useQuery(api.agentOrchestrationData.listChainOrchestrations as any);
  const consensusOrchestrations = useQuery(api.agentOrchestrationData.listConsensusOrchestrations as any);

  const totalCount = (parallelOrchestrations?.length || 0) + 
                     (chainOrchestrations?.length || 0) + 
                     (consensusOrchestrations?.length || 0);

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Network className="w-5 h-5" />
              Agent Orchestration
            </CardTitle>
            <CardDescription className="mt-1">
              Create and manage AI agent orchestrations for parallel execution, sequential chains, and consensus-based decisions
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={showGuide} onOpenChange={setShowGuide}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Quick Guide
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Agent Orchestration Quick Guide</DialogTitle>
                  <DialogDescription>
                    Learn how to create and manage orchestrations
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Badge variant="outline">Parallel</Badge>
                      Execute Multiple Agents Simultaneously
                    </h3>
                    <p className="text-muted-foreground mb-2">
                      Run multiple agents at the same time for faster processing. Perfect for independent tasks that don't depend on each other.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Add 2+ agents with their execution modes</li>
                      <li>Each agent runs independently</li>
                      <li>Results are collected when all complete</li>
                      <li>Use case: Generate content for multiple platforms at once</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Badge variant="outline">Chain</Badge>
                      Sequential Agent Pipeline
                    </h3>
                    <p className="text-muted-foreground mb-2">
                      Chain agents together where each agent's output becomes the next agent's input. Perfect for multi-step workflows.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Define initial input for the first agent</li>
                      <li>Add agents in sequence (order matters)</li>
                      <li>Optional: Add input transforms between steps</li>
                      <li>Use case: Research → Draft → Edit → Optimize content</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Badge variant="outline">Consensus</Badge>
                      Multi-Agent Decision Making
                    </h3>
                    <p className="text-muted-foreground mb-2">
                      Get multiple agent opinions and reach consensus on decisions. Perfect for strategic choices requiring diverse perspectives.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Add 2+ agents to provide opinions</li>
                      <li>Set a question for agents to answer</li>
                      <li>Define consensus threshold (50-100%)</li>
                      <li>Use case: Strategic decisions, content approval, risk assessment</li>
                    </ul>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Best Practices</h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Start with descriptive names and clear descriptions</li>
                      <li>Test orchestrations before activating them</li>
                      <li>Use appropriate execution modes for each agent</li>
                      <li>Monitor execution logs to optimize performance</li>
                      <li>Deactivate unused orchestrations to reduce clutter</li>
                    </ul>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Badge variant="outline">
              Total: {totalCount}
            </Badge>
            <Badge variant="secondary">
              Parallel: {parallelOrchestrations?.length || 0}
            </Badge>
            <Badge variant="secondary">
              Chain: {chainOrchestrations?.length || 0}
            </Badge>
            <Badge variant="secondary">
              Consensus: {consensusOrchestrations?.length || 0}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {totalCount === 0 && (
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Getting Started</AlertTitle>
            <AlertDescription>
              No orchestrations created yet. Use the tabs below to create your first parallel, chain, or consensus orchestration.
              Click "Quick Guide" above for detailed instructions.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="parallel">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="parallel">
              Parallel ({parallelOrchestrations?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="chain">
              Chain ({chainOrchestrations?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="consensus">
              Consensus ({consensusOrchestrations?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="w-4 h-4 mr-2" />
              Run History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="parallel" className="space-y-4 mt-4">
            <ParallelOrchestrationBuilder />
          </TabsContent>

          <TabsContent value="chain" className="space-y-4 mt-4">
            <ChainOrchestrationBuilder />
          </TabsContent>

          <TabsContent value="consensus" className="space-y-4 mt-4">
            <ConsensusOrchestrationBuilder />
          </TabsContent>

          <TabsContent value="history" className="space-y-4 mt-4">
            <OrchestrationRunsViewer />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}