import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface UserListItemProps {
  user: {
    _id: string;
    email?: string;
    name?: string;
    isAnonymous?: boolean;
    businessTier?: string;
    _creationTime: number;
  };
  isSelected: boolean;
  onSelect: (userId: string) => void;
  onManage: (userId: Id<"users">) => void;
}

export function UserListItem({ user, isSelected, onSelect, onManage }: UserListItemProps) {
  return (
    <div className="p-4 flex items-center gap-4 hover:bg-muted/50">
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onSelect(user._id)}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{user.email || "No email"}</p>
          {user.isAnonymous && (
            <Badge variant="secondary">Guest</Badge>
          )}
          {user.businessTier && (
            <Badge variant="outline">{user.businessTier}</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {user.name || "Unnamed"} • Joined {new Date(user._creationTime).toLocaleDateString()}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onManage(user._id as Id<"users">)}
      >
        <Settings className="h-4 w-4 mr-2" />
        Manage
      </Button>
    </div>
  );
}
