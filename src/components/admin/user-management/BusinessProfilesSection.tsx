import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Building2 } from "lucide-react";
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
}

export function BusinessProfilesSection({ businesses, onUpdateAgentLimit }: BusinessProfilesSectionProps) {
  return (
    <div>
      <h3 className="font-semibold mb-2 flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        Business Profiles ({businesses.length})
      </h3>
      <div className="space-y-3">
        {businesses.map((business) => (
          <Card key={business._id}>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label>Business Name</Label>
                  <p className="text-muted-foreground">{business.name}</p>
                </div>
                <div>
                  <Label>Role</Label>
                  <Badge>{business.role}</Badge>
                </div>
                <div>
                  <Label>Tier</Label>
                  <Badge variant="outline">{business.tier || "N/A"}</Badge>
                </div>
                <div>
                  <Label>Industry</Label>
                  <p className="text-muted-foreground">{business.industry || "N/A"}</p>
                </div>
                <div>
                  <Label>Website</Label>
                  <p className="text-muted-foreground truncate">{business.website || "N/A"}</p>
                </div>
                <div>
                  <Label>Location</Label>
                  <p className="text-muted-foreground">{business.location || "N/A"}</p>
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <p className="text-muted-foreground text-xs">{business.description || "N/A"}</p>
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
        ))}
      </div>
    </div>
  );
}
