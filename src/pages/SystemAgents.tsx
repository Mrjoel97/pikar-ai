import { SystemAgentsHub } from "@/components/admin/SystemAgentsHub";
import { AgentOrchestrationPanel } from "@/components/admin/AgentOrchestrationPanel";
import { OrchestrationRunsViewer } from "@/components/admin/orchestration/OrchestrationRunsViewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SystemAgentsPage() {
  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8 space-y-6">
      <Tabs defaultValue="agents" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="agents">System Agents Hub</TabsTrigger>
          <TabsTrigger value="orchestration">Agent Orchestration</TabsTrigger>
          <TabsTrigger value="runs">Execution History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="agents" className="space-y-6">
          <SystemAgentsHub />
        </TabsContent>
        
        <TabsContent value="orchestration" className="space-y-6">
          <AgentOrchestrationPanel />
        </TabsContent>
        
        <TabsContent value="runs" className="space-y-6">
          <OrchestrationRunsViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
}