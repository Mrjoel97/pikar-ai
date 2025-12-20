import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Network, Database, Loader2 } from "lucide-react";
import { ParallelOrchestrationBuilder } from "./orchestration/ParallelOrchestrationBuilder";
import { ChainOrchestrationBuilder } from "./orchestration/ChainOrchestrationBuilder";
import { ConsensusOrchestrationBuilder } from "./orchestration/ConsensusOrchestrationBuilder";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

export function AgentOrchestrationPanel() {
  const [isSeeding, setIsSeeding] = useState(false);
  const seedOrchestrations = useMutation(api.aiAgents.seedOrchestrations);
  
  // Query counts to show seeded orchestrations
  const parallelOrchestrations = useQuery(api.agentOrchestrationData.listParallelOrchestrations as any);
  const chainOrchestrations = useQuery(api.agentOrchestrationData.listChainOrchestrations as any);
  const consensusOrchestrations = useQuery(api.agentOrchestrationData.listConsensusOrchestrations as any);

  const totalCount = (parallelOrchestrations?.length || 0) + 
                     (chainOrchestrations?.length || 0) + 
                     (consensusOrchestrations?.length || 0);

  const handleSeedOrchestrations = async () => {
    setIsSeeding(true);
    try {
      const result = await seedOrchestrations({});
      toast.success(`Successfully seeded ${(result as any).total || 120} orchestrations!`);
    } catch (error: any) {
      if (error.message?.includes("already seeded")) {
        toast.info("Orchestrations are already seeded");
      } else {
        toast.error(error.message || "Failed to seed orchestrations");
      }
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5" />
            Agent Orchestration
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
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
            <Button
              size="sm"
              variant="outline"
              onClick={handleSeedOrchestrations}
              disabled={isSeeding || totalCount >= 120}
            >
              {isSeeding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Seeding...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  {totalCount === 0 ? "Seed 120 Orchestrations" : "Re-seed"}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {totalCount === 0 && (
          <div className="mb-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              No orchestrations found. Click "Seed 120 Orchestrations" to load 40 Parallel, 40 Chain, and 40 Consensus orchestrations (10 of each per tier: Solopreneur, Startup, SME, Enterprise).
            </p>
          </div>
        )}
        
        <Tabs defaultValue="parallel">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="parallel">
              Parallel ({parallelOrchestrations?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="chain">
              Chain ({chainOrchestrations?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="consensus">
              Consensus ({consensusOrchestrations?.length || 0})
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
        </Tabs>
      </CardContent>
    </Card>
  );
}