import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { X, Plus } from "lucide-react";

interface AgentCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgentCreateDialog({ open, onOpenChange }: AgentCreateDialogProps) {
  const [agentKey, setAgentKey] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [longDesc, setLongDesc] = useState("");
  const [defaultModel, setDefaultModel] = useState("gpt-4o-mini");
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [capabilityInput, setCapabilityInput] = useState("");
  const [tierRestrictions, setTierRestrictions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createAgent = useMutation(api.aiAgents.adminCreateAgent as any);

  const handleAddCapability = () => {
    if (capabilityInput.trim() && !capabilities.includes(capabilityInput.trim())) {
      setCapabilities([...capabilities, capabilityInput.trim()]);
      setCapabilityInput("");
    }
  };

  const handleRemoveCapability = (cap: string) => {
    setCapabilities(capabilities.filter(c => c !== cap));
  };

  const toggleTier = (tier: string) => {
    if (tierRestrictions.includes(tier)) {
      setTierRestrictions(tierRestrictions.filter(t => t !== tier));
    } else {
      setTierRestrictions([...tierRestrictions, tier]);
    }
  };

  const handleSubmit = async () => {
    if (!agentKey || !displayName || !shortDesc) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await createAgent({
        agent_key: agentKey,
        display_name: displayName,
        short_desc: shortDesc,
        long_desc: longDesc,
        capabilities,
        default_model: defaultModel,
        tier_restrictions: tierRestrictions,
        active: false,
      });

      toast.success("Agent created successfully");
      onOpenChange(false);
      
      // Reset form
      setAgentKey("");
      setDisplayName("");
      setShortDesc("");
      setLongDesc("");
      setCapabilities([]);
      setTierRestrictions([]);
      setDefaultModel("gpt-4o-mini");
    } catch (error: any) {
      toast.error(error?.message || "Failed to create agent");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Agent</DialogTitle>
          <DialogDescription>
            Define a new AI agent with its capabilities and configuration
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="agentKey">Agent Key (unique identifier) *</Label>
            <Input
              id="agentKey"
              placeholder="e.g., content_creator"
              value={agentKey}
              onChange={(e) => setAgentKey(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name *</Label>
            <Input
              id="displayName"
              placeholder="e.g., Content Creator"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortDesc">Short Description *</Label>
            <Input
              id="shortDesc"
              placeholder="Brief description of the agent's purpose"
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="longDesc">Long Description</Label>
            <Textarea
              id="longDesc"
              placeholder="Detailed description of the agent's capabilities and use cases"
              value={longDesc}
              onChange={(e) => setLongDesc(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultModel">Default Model</Label>
            <select
              id="defaultModel"
              className="w-full h-10 rounded-md border bg-background px-3 text-sm"
              value={defaultModel}
              onChange={(e) => setDefaultModel(e.target.value)}
            >
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="claude-3-sonnet">Claude 3 Sonnet</option>
              <option value="claude-3-opus">Claude 3 Opus</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Capabilities</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add capability (e.g., content_generation)"
                value={capabilityInput}
                onChange={(e) => setCapabilityInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCapability()}
              />
              <Button type="button" size="sm" onClick={handleAddCapability}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {capabilities.map((cap) => (
                <Badge key={cap} variant="secondary" className="gap-1">
                  {cap}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleRemoveCapability(cap)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tier Restrictions (leave empty for all tiers)</Label>
            <div className="flex flex-wrap gap-2">
              {["solopreneur", "startup", "sme", "enterprise"].map((tier) => (
                <Badge
                  key={tier}
                  variant={tierRestrictions.includes(tier) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleTier(tier)}
                >
                  {tier}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Agent"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
