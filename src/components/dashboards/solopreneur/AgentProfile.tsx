import React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Brain, Zap, LineChart } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AgentProfileProps {
  businessId: Id<"businesses">;
}

export function AgentProfile({ businessId }: AgentProfileProps) {
  const agentProfile = useQuery(api.agentProfile.getMyAgentProfile, { businessId });
  const upsertAgent = useMutation(api.agentProfile.upsertMyAgentProfile);
  const performance = useQuery(api.agentProfile.trackPerformanceMetrics, { businessId });
  const learning = useQuery(api.agentProfile.getLearningRecommendations, { businessId });
  const insights = useQuery(api.agentProfile.getBehavioralInsights, { businessId });

  const [tone, setTone] = React.useState<"concise" | "friendly" | "premium">("friendly");
  const [persona, setPersona] = React.useState<"maker" | "coach" | "executive">("maker");
  const [cadence, setCadence] = React.useState<"light" | "standard" | "aggressive">("standard");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (agentProfile) {
      setTone(agentProfile.tone || "friendly");
      setPersona(agentProfile.persona || "maker");
      setCadence(agentProfile.cadence || "standard");
    }
  }, [agentProfile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertAgent({ businessId, tone, persona, cadence });
      toast.success("Agent profile updated");
    } catch (error) {
      toast.error("Failed to update agent profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Agent Profile v2</CardTitle>
          <CardDescription>Customize your AI assistant's tone, persona, and cadence</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Tone</Label>
            <RadioGroup value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="concise" id="tone-concise" />
                <Label htmlFor="tone-concise">Concise - Brief and to the point</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="friendly" id="tone-friendly" />
                <Label htmlFor="tone-friendly">Friendly - Warm and conversational</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="premium" id="tone-premium" />
                <Label htmlFor="tone-premium">Premium - Polished and professional</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label>Persona</Label>
            <RadioGroup value={persona} onValueChange={(v) => setPersona(v as typeof persona)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="maker" id="persona-maker" />
                <Label htmlFor="persona-maker">Maker - Action-oriented builder</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="coach" id="persona-coach" />
                <Label htmlFor="persona-coach">Coach - Supportive and encouraging</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="executive" id="persona-executive" />
                <Label htmlFor="persona-executive">Executive - ROI-focused strategist</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label>Cadence</Label>
            <RadioGroup value={cadence} onValueChange={(v) => setCadence(v as typeof cadence)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="cadence-light" />
                <Label htmlFor="cadence-light">Light - Relaxed, weekly check-ins</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="standard" id="cadence-standard" />
                <Label htmlFor="cadence-standard">Standard - Steady, consistent</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="aggressive" id="cadence-aggressive" />
                <Label htmlFor="cadence-aggressive">Aggressive - High-tempo engagement</Label>
              </div>
            </RadioGroup>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Profile
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Agent Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {performance ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Efficiency Score</span>
                    <span className="font-bold">{performance.efficiencyScore}%</span>
                  </div>
                  <Progress value={performance.efficiencyScore} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Learning Progress</span>
                    <span className="font-bold">{performance.learningProgress}%</span>
                  </div>
                  <Progress value={performance.learningProgress} className="bg-blue-100" />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <div className="text-2xl font-bold">{performance.tasksCompleted}</div>
                    <div className="text-xs text-muted-foreground">Tasks Completed</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <div className="text-2xl font-bold">{performance.satisfactionScore}</div>
                    <div className="text-xs text-muted-foreground">Satisfaction (0-5)</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Loading metrics...</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Behavioral Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights ? (
              <>
                <div className="p-4 border rounded-lg bg-purple-50/50">
                  <h4 className="font-medium text-sm mb-1">Adaptability Score: {insights.agentAdaptability.score}/100</h4>
                  <p className="text-sm text-muted-foreground">{insights.agentAdaptability.notes}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-2">Interaction Patterns</h4>
                  <div className="flex flex-wrap gap-2">
                    {insights.interactionPatterns.peakHours.map((hour: string) => (
                      <span key={hour} className="px-2 py-1 bg-muted rounded text-xs">Peak: {hour}</span>
                    ))}
                    {insights.interactionPatterns.preferredChannels.map((channel: string) => (
                      <span key={channel} className="px-2 py-1 bg-muted rounded text-xs capitalize">{channel}</span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Analyzing behavior...</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Learning Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {learning && learning.length > 0 ? (
              learning.map((item: any, i: number) => (
                <div key={i} className="flex items-start justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium text-sm">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      item.priority === 'high' ? 'bg-red-100 text-red-700' : 
                      item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-green-100 text-green-700'
                    }`}>
                      {item.priority}
                    </span>
                    <div className="text-xs text-muted-foreground mt-1">{item.estimatedTime}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No current recommendations.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}