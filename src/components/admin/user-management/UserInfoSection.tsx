import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, CheckCircle, XCircle } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface UserInfoSectionProps {
  user: {
    _id: Id<"users">;
    email?: string;
    name?: string;
    isAnonymous?: boolean;
    businessTier?: string;
  };
  onToggleStatus: (userId: Id<"users">, currentStatus: boolean) => void;
  onUpdateTier: (userId: Id<"users">, tier: string) => void;
}

export function UserInfoSection({ user, onToggleStatus, onUpdateTier }: UserInfoSectionProps) {
  return (
    <div>
      <h3 className="font-semibold mb-2 flex items-center gap-2">
        <User className="h-4 w-4" />
        User Information
      </h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <Label>Email</Label>
          <p className="text-muted-foreground">{user.email || "N/A"}</p>
        </div>
        <div>
          <Label>Name</Label>
          <p className="text-muted-foreground">{user.name || "N/A"}</p>
        </div>
        <div>
          <Label>Status</Label>
          <div className="flex items-center gap-2">
            {!user.isAnonymous ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Active
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <XCircle className="h-3 w-3" />
                Inactive
              </Badge>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onToggleStatus(user._id, !user.isAnonymous)}
            >
              {!user.isAnonymous ? "Deactivate" : "Activate"}
            </Button>
          </div>
        </div>
        <div>
          <Label>Current Tier</Label>
          <Select
            value={user.businessTier || "solopreneur"}
            onValueChange={(tier) => onUpdateTier(user._id, tier)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="solopreneur">Solopreneur</SelectItem>
              <SelectItem value="startup">Startup</SelectItem>
              <SelectItem value="sme">SME</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
