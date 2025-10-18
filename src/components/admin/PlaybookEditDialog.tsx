import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

type Playbook = {
  _id: string;
  playbook_key: string;
  display_name: string;
  version: string;
  triggers: any;
  input_schema: any;
  output_schema: any;
  steps: any;
  metadata: any;
  active: boolean;
};

export function PlaybookEditDialog({ 
  playbook, 
  onSave, 
  onClose 
}: { 
  playbook: Playbook; 
  onSave: (data: Partial<Playbook>) => void; 
  onClose: () => void; 
}) {
  const [formData, setFormData] = useState(playbook);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Playbook: {playbook.display_name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Playbook Key</label>
              <Input
                value={formData.playbook_key}
                onChange={(e) => setFormData({ ...formData, playbook_key: e.target.value })}
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
            <label className="text-sm font-medium">Version</label>
            <Input
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
            />
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
