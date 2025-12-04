import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Save } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

interface SimpleSegmentBuilderProps {
  businessId: Id<"businesses">;
  onSegmentCreated?: () => void;
}

export function SimpleSegmentBuilder({ businessId, onSegmentCreated }: SimpleSegmentBuilderProps) {
  const createSegment = useMutation(api.customerSegmentationData.createSegment);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [engagement, setEngagement] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a segment name");
      return;
    }

    setSaving(true);
    try {
      const criteria: any = {};
      
      if (engagement) {
        criteria.engagement = engagement;
      }
      
      if (status) {
        criteria.status = status;
      }
      
      if (tags.length > 0) {
        criteria.tags = tags;
      }

      await createSegment({
        businessId,
        name,
        description: description || undefined,
        criteria,
      });

      toast.success("Segment created successfully!");
      
      // Reset form
      setName("");
      setDescription("");
      setEngagement("");
      setStatus("");
      setTags([]);
      
      onSegmentCreated?.();
    } catch (error) {
      toast.error("Failed to create segment");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Custom Segment</CardTitle>
        <CardDescription>
          Build a segment by defining criteria to group your contacts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="segment-name">Segment Name *</Label>
          <Input
            id="segment-name"
            placeholder="e.g., High-Value Customers"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="segment-description">Description</Label>
          <Textarea
            id="segment-description"
            placeholder="Describe what this segment represents..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="engagement-level">Engagement Level</Label>
          <Select value={engagement} onValueChange={setEngagement}>
            <SelectTrigger id="engagement-level">
              <SelectValue placeholder="Select engagement level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="active">Active (engaged in last 30 days)</SelectItem>
              <SelectItem value="dormant">Dormant (30-90 days)</SelectItem>
              <SelectItem value="inactive">Inactive (90+ days)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact-status">Contact Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="contact-status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="subscribed">Subscribed</SelectItem>
              <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
              <SelectItem value="bounced">Bounced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <div className="flex gap-2">
            <Input
              id="tags"
              placeholder="Add a tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <Button type="button" size="sm" onClick={handleAddTag}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Creating..." : "Create Segment"}
        </Button>
      </CardContent>
    </Card>
  );
}
