import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Save, Play } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

interface AgentBuilderFormProps {
  businessId: Id<"businesses">;
  userId: Id<"users">;
  templateId?: Id<"aiAgents">;
  onSuccess?: () => void;
}

export function AgentBuilderForm({ businessId, userId, templateId, onSuccess }: AgentBuilderFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [personality, setPersonality] = useState("");
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createAgent = useMutation(api.aiAgents.create);
  const testAgent = useMutation(api.aiAgents.testAgent);
  const template = useQuery(
    api.aiAgents.getById,
    templateId ? { agentId: templateId } : "skip"
  );

  const availableCapabilities = [
    { id: "content_generation", label: "Content Generation", icon: "✍️" },
    { id: "scheduling", label: "Smart Scheduling", icon: "📅" },
    { id: "analytics", label: "Analytics Insights", icon: "📊" },
    { id: "customer_support", label: "Customer Support", icon: "💬" },
    { id: "email_campaigns", label: "Email Campaigns", icon: "📧" },
    { id: "social_media", label: "Social Media Management", icon: "📱" },
    { id: "workflow_automation", label: "Workflow Automation", icon: "⚙️" },
    { id: "data_analysis", label: "Data Analysis", icon: "🔍" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter an agent name");
      return;
    }

    setIsSubmitting(true);
    try {
      const agentId = await createAgent({
        businessId,
        name: name.trim(),
        description: description.trim(),
        personality: personality.trim(),
        capabilities,
        templateId,
        config: {
          model: "gpt-4o-mini",
          temperature: 0.7,
          maxTokens: 2000,
        },
      });

      toast.success("Agent created successfully!");
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to create agent");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTest = async () => {
    if (!name.trim()) {
      toast.error("Please enter an agent name first");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await testAgent({
        businessId,
        agentConfig: {
          name: name.trim(),
          description: description.trim(),
          personality: personality.trim(),
          capabilities,
        },
        testPrompt: "Introduce yourself and explain what you can help with.",
      });

      toast.success("Test completed! Check console for response.");
      console.log("Agent test response:", result);
    } catch (error: any) {
      toast.error(error.message || "Failed to test agent");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCapability = (capabilityId: string) => {
    setCapabilities((prev) =>
      prev.includes(capabilityId)
        ? prev.filter((c) => c !== capabilityId)
        : [...prev, capabilityId]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            Agent Configuration
          </CardTitle>
          <CardDescription>
            {templateId ? "Customize this template to create your agent" : "Build a custom AI agent from scratch"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Agent Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Marketing Assistant"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this agent does..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="personality">Personality & Tone</Label>
            <Input
              id="personality"
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              placeholder="Professional, friendly, helpful"
            />
          </div>

          <div>
            <Label>Capabilities</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {availableCapabilities.map((cap) => (
                <button
                  key={cap.id}
                  type="button"
                  onClick={() => toggleCapability(cap.id)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    capabilities.includes(cap.id)
                      ? "border-emerald-600 bg-emerald-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{cap.icon}</span>
                    <span className="text-sm font-medium">{cap.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={handleTest} disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          Test Agent
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Create Agent
        </Button>
      </div>
    </form>
  );
}
