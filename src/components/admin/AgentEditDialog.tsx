import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
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
import { Loader2, X, Plus, History } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AgentVersionsDrawer } from "./AgentVersionsDrawer";

type AgentEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentKey: string;
};

export function AgentEditDialog({ open, onOpenChange, agentKey }: AgentEditDialogProps) {
  const [displayName, setDisplayName] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [longDesc, setLongDesc] = useState("");
  const [defaultModel, setDefaultModel] = useState("gpt-4o-mini");
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [newCapability, setNewCapability] = useState("");
  const [tierRestrictions, setTierRestrictions] = useState<string[]>([]);
  const [confidenceHint, setConfidenceHint] = useState(0.8);
  const [isActive, setIsActive] = useState(true);
  const [versionsDrawerOpen, setVersionsDrawerOpen] = useState(false);

  const agent = useQuery(api.aiAgents.adminGetAgent, { agent_key: agentKey });
  const updateAgent = useMutation(api.aiAgents.adminUpsertAgent);
  const versions = useQuery(api.aiAgents.adminListAgentVersions, { agent_key: agentKey, limit: 20 });
  const rollbackToVersion = useMutation(api.aiAgents.adminRollbackAgentToVersion);

  useEffect(() => {
    if (agent) {
      setDisplayName(agent.display_name || "");
      setShortDesc(agent.short_desc || "");
      setLongDesc(agent.long_desc || "");
      setDefaultModel(agent.default_model || "gpt-4o-mini");
      setCapabilities(agent.capabilities || []);
      setTierRestrictions(agent.tier_restrictions || []);
      setConfidenceHint(agent.confidence_hint || 0.8);
      setIsActive(agent.active);
    }
  }, [agent]);

  const handleAddCapability = () => {
    if (newCapability.trim() && !capabilities.includes(newCapability.trim())) {
      setCapabilities([...capabilities, newCapability.trim()]);
      setNewCapability("");
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

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error("Display name is required");
      return;
    }

    try {
      await updateAgent({
        agent_key: agentKey,
        display_name: displayName,
        short_desc: shortDesc,
        long_desc: longDesc,
        capabilities,
        default_model: defaultModel,
        model_routing: "default",
        prompt_template_version: "v1",
        prompt_templates: "{}",
        input_schema: "{}",
        output_schema: "{}",
        tier_restrictions: tierRestrictions,
        confidence_hint: confidenceHint,
        active: isActive,
      });
      toast.success("Agent updated successfully. Version saved.");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to update agent");
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    try {
      await rollbackToVersion({ agent_key: agentKey, versionId: versionId as any });
      toast.success("Agent restored to selected version");
      setVersionsDrawerOpen(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to restore version");
    }
  };

  if (!agent) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Edit Agent: {agentKey}</DialogTitle>
                <DialogDescription>
                  Update agent configuration. Agent key cannot be changed.
                </DialogDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVersionsDrawerOpen(true)}
              >
                <History className="h-4 w-4 mr-2" />
                Versions ({versions?.length || 0})
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Display Name *</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g., Content Creator Agent"
              />
            </div>

            <div className="space-y-2">
              <Label>Short Description</Label>
              <Input
                value={shortDesc}
                onChange={(e) => setShortDesc(e.target.value)}
                placeholder="Brief one-line description"
              />
            </div>

            <div className="space-y-2">
              <Label>Long Description</Label>
              <Textarea
                value={longDesc}
                onChange={(e) => setLongDesc(e.target.value)}
                placeholder="Detailed description of agent capabilities"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Default Model</Label>
              <Select value={defaultModel} onValueChange={setDefaultModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                  <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                  <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Capabilities</Label>
              <div className="flex gap-2">
                <Input
                  value={newCapability}
                  onChange={(e) => setNewCapability(e.target.value)}
                  placeholder="Add capability"
                  onKeyPress={(e) => e.key === "Enter" && handleAddCapability()}
                />
                <Button onClick={handleAddCapability} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {capabilities.map((cap, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1">
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
              <Label>Tier Restrictions (empty = all tiers)</Label>
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

            <div className="space-y-2">
              <Label>Confidence Hint: {Math.round(confidenceHint * 100)}%</Label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={confidenceHint}
                onChange={(e) => setConfidenceHint(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AgentVersionsDrawer
        open={versionsDrawerOpen}
        onOpenChange={setVersionsDrawerOpen}
        agentKey={agentKey}
        versions={versions || []}
        onRestore={handleRestoreVersion}
      />
    </>
  );
}