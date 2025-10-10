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

interface AgentProfileProps {
  businessId: Id<"businesses">;
}

export function AgentProfile({ businessId }: AgentProfileProps) {
  const agentProfile = useQuery(api.agentProfile.getMyAgentProfile, { businessId });
  const upsertAgent = useMutation(api.agentProfile.upsertMyAgentProfile);

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
  );
}
