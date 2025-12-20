import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Building2, Edit2, Save, X } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface BusinessProfilesSectionProps {
  businesses: Array<{
    _id: Id<"businesses">;
    name: string;
    role: string;
    tier?: string;
    industry?: string;
    website?: string;
    location?: string;
    description?: string;
    limits?: {
      maxAgents?: number;
    };
  }>;
  onUpdateAgentLimit: (businessId: Id<"businesses">, maxAgents: number) => void;
  onUpdateBusinessProfile?: (businessId: Id<"businesses">, updates: {
    name?: string;
    industry?: string;
    website?: string;
    location?: string;
    description?: string;
  }) => void;
}

export function BusinessProfilesSection({ 
  businesses, 
  onUpdateAgentLimit,
  onUpdateBusinessProfile 
}: BusinessProfilesSectionProps) {
  const [editingId, setEditingId] = useState<Id<"businesses"> | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const handleStartEdit = (business: any) => {
    setEditingId(business._id);
    setEditForm({
      name: business.name,
      industry: business.industry || "",
      website: business.website || "",
      location: business.location || "",
      description: business.description || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = (businessId: Id<"businesses">) => {
    if (onUpdateBusinessProfile) {
      onUpdateBusinessProfile(businessId, editForm);
    }
    setEditingId(null);
    setEditForm({});
  };

  return (
    <div>
      <h3 className="font-semibold mb-2 flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        Business Profiles ({businesses.length})
      </h3>
      <div className="space-y-3">
        {businesses.map((business) => {
          const isEditing = editingId === business._id;
          
          return (
            <Card key={business._id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-3">
                  <Badge>{business.role}</Badge>
                  {!isEditing && onUpdateBusinessProfile && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStartEdit(business)}
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  )}
                  {isEditing && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleSaveEdit(business._id)}
                      >
                        <Save className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Business Name</Label>
                    {isEditing ? (
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-muted-foreground">{business.name}</p>
                    )}
                  </div>
                  <div>
                    <Label>Tier</Label>
                    <Badge variant="outline">{business.tier || "N/A"}</Badge>
                  </div>
                  <div>
                    <Label>Industry</Label>
                    {isEditing ? (
                      <Input
                        value={editForm.industry}
                        onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-muted-foreground">{business.industry || "N/A"}</p>
                    )}
                  </div>
                  <div>
                    <Label>Website</Label>
                    {isEditing ? (
                      <Input
                        value={editForm.website}
                        onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-muted-foreground truncate">{business.website || "N/A"}</p>
                    )}
                  </div>
                  <div>
                    <Label>Location</Label>
                    {isEditing ? (
                      <Input
                        value={editForm.location}
                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-muted-foreground">{business.location || "N/A"}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <Label>Description</Label>
                    {isEditing ? (
                      <Textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="mt-1"
                        rows={3}
                      />
                    ) : (
                      <p className="text-muted-foreground text-xs">{business.description || "N/A"}</p>
                    )}
                  </div>
                  <div>
                    <Label>Max Agents</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        defaultValue={business.limits?.maxAgents || 3}
                        className="w-20"
                        disabled={isEditing}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value);
                          if (val > 0) {
                            onUpdateAgentLimit(business._id, val);
                          }
                        }}
                      />
                      <span className="text-xs text-muted-foreground">
                        Current: {business.limits?.maxAgents || 3}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}