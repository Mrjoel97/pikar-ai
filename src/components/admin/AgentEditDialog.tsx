import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

type Agent = {
  _id: string;
  agent_key: string;
  display_name: string;
  short_desc: string;
  long_desc: string;
  capabilities: string[];
  default_model: string;
  model_routing: string;
  prompt_template_version: string;
  prompt_templates: string;
  input_schema: string;
  output_schema: string;
  tier_restrictions: string[];
  confidence_hint: number;
  active: boolean;
  createdAt: number;
  updatedAt?: number;
};

export function AgentEditDialog({ 
  agent, 
  onSave, 
  onClose 
}: { 
  agent: Agent; 
  onSave: (data: Partial<Agent>) => void; 
  onClose: () => void; 
}) {
  const [formData, setFormData] = useState(agent);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Agent: {agent.display_name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Agent Key</label>
              <Input
                value={formData.agent_key}
                onChange={(e) => setFormData({ ...formData, agent_key: e.target.value })}
                disabled
              />
            </div>
            <div>
              <label className="text-sm font-medium">Display Name</label>
              <Input
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Short Description</label>
            <Input
              value={formData.short_desc}
              onChange={(e) => setFormData({ ...formData, short_desc: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Long Description</label>
            <Textarea
              value={formData.long_desc}
              onChange={(e) => setFormData({ ...formData, long_desc: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Default Model</label>
              <Input
                value={formData.default_model}
                onChange={(e) => setFormData({ ...formData, default_model: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Confidence Hint</label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={formData.confidence_hint}
                onChange={(e) => setFormData({ ...formData, confidence_hint: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.active}
              onCheckedChange={(active) => setFormData({ ...formData, active })}
            />
            <label className="text-sm font-medium">Active</label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
