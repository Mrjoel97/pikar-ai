import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface PolicyEditorDialogProps {
  businessId: Id<"businesses">;
  policyId: Id<"policies"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PolicyEditorDialog({ businessId, policyId, open, onOpenChange }: PolicyEditorDialogProps) {
  const createPolicy = useMutation(api.policyManagement.createPolicy);
  const updatePolicy = useMutation(api.policyManagement.updatePolicy);
  const policy = useQuery(
    api.policyManagement.getPolicy,
    policyId ? { policyId } : "skip"
  );

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    content: "",
    severity: "medium" as "low" | "medium" | "high" | "critical",
    changeNotes: "",
  });

  const handleSubmit = async () => {
    try {
      if (policyId) {
        await updatePolicy({ policyId, ...formData });
        toast.success("Policy updated successfully");
      } else {
        await createPolicy({ businessId, ...formData });
        toast.success("Policy created successfully");
      }
      onOpenChange(false);
      setFormData({
        title: "",
        description: "",
        category: "",
        content: "",
        severity: "medium",
        changeNotes: "",
      });
    } catch (error) {
      toast.error("Failed to save policy");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{policyId ? "Edit Policy" : "Create New Policy"}</DialogTitle>
          <DialogDescription>
            {policyId
              ? "Update policy details and content"
              : "Create a new organizational policy"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Policy title"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Security, HR, Finance"
              />
            </div>
            <div>
              <Label htmlFor="severity">Severity</Label>
              <Select
                value={formData.severity}
                onValueChange={(value: any) => setFormData({ ...formData, severity: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="content">Policy Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Full policy content..."
              rows={10}
            />
          </div>
          {policyId && (
            <div>
              <Label htmlFor="changeNotes">Change Notes</Label>
              <Textarea
                id="changeNotes"
                value={formData.changeNotes}
                onChange={(e) => setFormData({ ...formData, changeNotes: e.target.value })}
                placeholder="Describe what changed in this version..."
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {policyId ? "Update Policy" : "Create Policy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
