import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Network } from "lucide-react";
import { ParallelOrchestrationBuilder } from "./orchestration/ParallelOrchestrationBuilder";
import { ChainOrchestrationBuilder } from "./orchestration/ChainOrchestrationBuilder";
import { ConsensusOrchestrationBuilder } from "./orchestration/ConsensusOrchestrationBuilder";

export function AgentOrchestrationPanel() {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="w-5 h-5" />
          Agent Orchestration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="parallel">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="parallel">Parallel</TabsTrigger>
            <TabsTrigger value="chain">Chain</TabsTrigger>
            <TabsTrigger value="consensus">Consensus</TabsTrigger>
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