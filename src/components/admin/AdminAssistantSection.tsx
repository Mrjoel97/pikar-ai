import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AssistantChat } from "./assistant/AssistantChat";
import { DocumentationManager } from "./assistant/DocumentationManager";
import { EvaluationsPanel } from "./assistant/EvaluationsPanel";
import { SandboxPanel } from "./assistant/SandboxPanel";
import { AgentToolHealth } from "./assistant/AgentToolHealth";

type Props = {
  adminSessionValid: boolean;
  adminToken: string | null;
};

export function AdminAssistantSection({ adminSessionValid, adminToken }: Props) {
  const evalSummary = useQuery((api as any).evals.latestSummary as any);

  return (
    <Card>
      <CardHeader>
        <CardTitle id="section-admin-assistant">Admin Assistant</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="assistant" className="w-full">
          <TabsList className="mb-2">
            <TabsTrigger value="assistant">Assistant</TabsTrigger>
            <TabsTrigger value="docs">Assistant Docs</TabsTrigger>
            <TabsTrigger value="evals">Evaluations & Sandbox</TabsTrigger>
          </TabsList>

          <TabsContent value="assistant" className="space-y-4">
            <AssistantChat adminSessionValid={adminSessionValid} adminToken={adminToken} />
          </TabsContent>

          <TabsContent value="docs" className="space-y-4">
            <DocumentationManager evalSummary={evalSummary} />
          </TabsContent>

          <TabsContent value="evals" className="space-y-6">
            <EvaluationsPanel />
            <AgentToolHealth />
            <SandboxPanel adminSessionValid={adminSessionValid} adminToken={adminToken} />
          </TabsContent>
        </Tabs>

        <div className="text-xs text-muted-foreground">
          MVP is read-only. Mutating actions (repairs, sends, flag changes) are gated by role and mode.
        </div>
      </CardContent>
    </Card>
  );
}