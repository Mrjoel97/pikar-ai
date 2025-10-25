import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, AlertCircle } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

export function AgentTrainingInterface({ agentId }: { agentId: Id<"aiAgents"> }) {
  const [trainingContext, setTrainingContext] = useState("");
  const [trainingOutcome, setTrainingOutcome] = useState("");
  const [learningPoints, setLearningPoints] = useState("");

  const recordLearning = useMutation(api.agentMemory.recordLearningEvent);
  const learningInsights = useQuery(api.agentMemory.getAgentLearningInsights, { agentId });

  const handleSubmitTraining = async (eventType: "success" | "failure" | "feedback") => {
    await recordLearning({
      agentId,
      businessId: "" as Id<"businesses">, // Will be set from context
      eventType,
      context: trainingContext,
      outcome: trainingOutcome,
      learningPoints: learningPoints.split("\n").filter(p => p.trim()),
    });

    setTrainingContext("");
    setTrainingOutcome("");
    setLearningPoints("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Agent Training
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Training Context</label>
            <Textarea
              value={trainingContext}
              onChange={(e) => setTrainingContext(e.target.value)}
              placeholder="Describe the situation or task..."
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Outcome</label>
            <Textarea
              value={trainingOutcome}
              onChange={(e) => setTrainingOutcome(e.target.value)}
              placeholder="What happened? What was the result?"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Learning Points (one per line)</label>
            <Textarea
              value={learningPoints}
              onChange={(e) => setLearningPoints(e.target.value)}
              placeholder="Key takeaways and lessons learned..."
              className="mt-1"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={() => handleSubmitTraining("success")} variant="default">
              Record Success
            </Button>
            <Button onClick={() => handleSubmitTraining("failure")} variant="destructive">
              Record Failure
            </Button>
            <Button onClick={() => handleSubmitTraining("feedback")} variant="outline">
              Add Feedback
            </Button>
          </div>
        </CardContent>
      </Card>

      {learningInsights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Learning Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">
                  {(learningInsights.successRate * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{learningInsights.totalLearningEvents}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Common Issues</p>
                <p className="text-2xl font-bold">{learningInsights.commonIssues.length}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Recent Learning Events</h4>
              <div className="space-y-2">
                {learningInsights.events.slice(0, 5).map((event, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 border rounded">
                    {event.eventType === "success" ? (
                      <TrendingUp className="h-4 w-4 text-green-500 mt-1" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500 mt-1" />
                    )}
                    <div className="flex-1">
                      <Badge variant={event.eventType === "success" ? "default" : "destructive"}>
                        {event.eventType}
                      </Badge>
                      <p className="text-sm mt-1">{event.context}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
