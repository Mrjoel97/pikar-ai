import React, { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Network,
  Zap,
  GitBranch,
  Users,
  BarChart3,
  Play,
  Loader2,
} from "lucide-react";

export function AgentOrchestrationPanel() {
  const [activeTest, setActiveTest] = useState<string | null>(null);
  
  const executeParallel = useAction(api.agentOrchestration.executeParallel as any);
  const chainAgents = useAction(api.agentOrchestration.chainAgents as any);
  const resolveConsensus = useAction(api.agentOrchestration.resolveWithConsensus as any);

  const handleTestParallel = async () => {
    setActiveTest("parallel");
    try {
      const result = await executeParallel({
        agents: [
          { agentKey: "exec_assistant", mode: "summarizeIdeas" },
          { agentKey: "content_creator", mode: "proposeNextAction" },
          { agentKey: "analytics_agent", mode: "planWeek" },
        ],
        businessId: "test" as any, // Replace with actual businessId
      });
      toast.success(`Parallel execution completed: ${result.successRate * 100}% success rate`);
    } catch (error: any) {
      toast.error(`Parallel execution failed: ${error.message}`);
    } finally {
      setActiveTest(null);
    }
  };

  const handleTestChain = async () => {
    setActiveTest("chain");
    try {
      const result = await chainAgents({
        chain: [
          { agentKey: "exec_assistant", mode: "summarizeIdeas" },
          { agentKey: "content_creator", mode: "proposeNextAction", inputTransform: "summary" },
          { agentKey: "scheduler", mode: "planWeek", inputTransform: "action" },
        ],
        initialInput: "Analyze recent business performance and create action plan",
        businessId: "test" as any,
      });
      toast.success(`Chain execution completed in ${result.totalDuration}ms`);
    } catch (error: any) {
      toast.error(`Chain execution failed: ${error.message}`);
    } finally {
      setActiveTest(null);
    }
  };

  const handleTestConsensus = async () => {
    setActiveTest("consensus");
    try {
      const result = await resolveConsensus({
        agents: ["exec_assistant", "strategy_agent", "analytics_agent"],
        question: "What should be our top priority for next quarter?",
        businessId: "test" as any,
        consensusThreshold: 0.6,
      });
      toast.success(
        `Consensus: ${result.hasConsensus ? "Reached" : "Not reached"} (${(result.consensusScore * 100).toFixed(0)}%)`
      );
    } catch (error: any) {
      toast.error(`Consensus failed: ${error.message}`);
    } finally {
      setActiveTest(null);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="w-5 h-5" />
          Agent Orchestration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="parallel">Parallel</TabsTrigger>
            <TabsTrigger value="chain">Chain</TabsTrigger>
            <TabsTrigger value="consensus">Consensus</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Zap className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-600">Parallel Execution</p>
                      <p className="text-2xl font-bold">Active</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <GitBranch className="w-8 h-8 text-purple-500" />
                    <div>
                      <p className="text-sm text-gray-600">Agent Chaining</p>
                      <p className="text-2xl font-bold">Active</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600">Consensus</p>
                      <p className="text-2xl font-bold">Active</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Capabilities</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Agent-to-Agent Messaging</Badge>
                <Badge variant="outline">Parallel Execution</Badge>
                <Badge variant="outline">Dynamic Chaining</Badge>
                <Badge variant="outline">Conflict Resolution</Badge>
                <Badge variant="outline">Performance Analytics</Badge>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="parallel" className="space-y-4">
            <p className="text-sm text-gray-600">
              Execute multiple agents concurrently for faster processing
            </p>
            <Button
              onClick={handleTestParallel}
              disabled={activeTest === "parallel"}
              className="w-full"
            >
              {activeTest === "parallel" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running Parallel Test...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Test Parallel Execution
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="chain" className="space-y-4">
            <p className="text-sm text-gray-600">
              Chain agents sequentially, passing output from one to the next
            </p>
            <Button
              onClick={handleTestChain}
              disabled={activeTest === "chain"}
              className="w-full"
            >
              {activeTest === "chain" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running Chain Test...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Test Agent Chain
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="consensus" className="space-y-4">
            <p className="text-sm text-gray-600">
              Get multiple agent opinions and resolve conflicts through consensus
            </p>
            <Button
              onClick={handleTestConsensus}
              disabled={activeTest === "consensus"}
              className="w-full"
            >
              {activeTest === "consensus" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running Consensus Test...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Test Consensus Resolution
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
