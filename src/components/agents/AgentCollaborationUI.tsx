import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, MessageSquare, CheckCircle } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

export function AgentCollaborationUI({ businessId }: { businessId: Id<"businesses"> }) {
  const [taskDescription, setTaskDescription] = useState("");
  const [selectedAgents, setSelectedAgents] = useState<Id<"aiAgents">[]>([]);

  const agents = useQuery(api.aiAgents.listAgents, { businessId });
  const collaborations = useQuery(api.agentMemory.getActiveCollaborations, { businessId });
  const createCollab = useMutation(api.agentMemory.createCollaboration);

  const handleCreateCollaboration = async () => {
    if (selectedAgents.length < 2) return;

    await createCollab({
      businessId,
      agentIds: selectedAgents,
      taskDescription,
      coordinatorAgentId: selectedAgents[0],
    });

    setTaskDescription("");
    setSelectedAgents([]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create Agent Collaboration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Task Description</label>
            <Input
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Describe the collaborative task..."
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Select Agents (min 2)</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {agents?.map((agent: any) => (
                <Button
                  key={agent._id}
                  variant={selectedAgents.includes(agent._id) ? "default" : "outline"}
                  onClick={() => {
                    setSelectedAgents(prev =>
                      prev.includes(agent._id)
                        ? prev.filter(id => id !== agent._id)
                        : [...prev, agent._id]
                    );
                  }}
                  className="justify-start"
                >
                  {agent.name}
                </Button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleCreateCollaboration}
            disabled={selectedAgents.length < 2 || !taskDescription}
            className="w-full"
          >
            Start Collaboration
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Active Collaborations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {collaborations?.map((collab: any) => (
              <div key={collab._id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{collab.taskDescription}</h4>
                    <p className="text-sm text-muted-foreground">
                      {collab.agentIds.length} agents collaborating
                    </p>
                  </div>
                  <Badge variant={collab.status === "active" ? "default" : "secondary"}>
                    {collab.status}
                  </Badge>
                </div>

                <div className="space-y-2 mt-4">
                  {collab.messages.slice(-3).map((msg: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <div>
                        <Badge variant="outline" className="text-xs">
                          {msg.messageType}
                        </Badge>
                        <p className="mt-1">{msg.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {!collaborations?.length && (
              <p className="text-center text-muted-foreground py-8">
                No active collaborations
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}