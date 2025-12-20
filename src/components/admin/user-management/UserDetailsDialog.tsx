import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { UserInfoSection } from "./UserInfoSection";
import { BusinessProfilesSection } from "./BusinessProfilesSection";
import { AIAgentsSection } from "./AIAgentsSection";
import type { Id } from "@/convex/_generated/dataModel";

interface UserDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userDetails: {
    user: {
      _id: Id<"users">;
      email?: string;
      name?: string;
      isAnonymous?: boolean;
      businessTier?: string;
    };
    businesses: Array<any>;
    aiAgents: Array<any>;
  } | null;
  onToggleStatus: (userId: Id<"users">, currentStatus: boolean) => void;
  onUpdateTier: (userId: Id<"users">, tier: string) => void;
  onUpdateAgentLimit: (businessId: Id<"businesses">, maxAgents: number) => void;
  onToggleAgent: (agentId: Id<"aiAgents">, isActive: boolean) => void;
}

export function UserDetailsDialog({
  open,
  onOpenChange,
  userDetails,
  onToggleStatus,
  onUpdateTier,
  onUpdateAgentLimit,
  onToggleAgent,
}: UserDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Management</DialogTitle>
          <DialogDescription>
            Manage user account, tier, and AI agent access
          </DialogDescription>
        </DialogHeader>
        
        {userDetails && (
          <div className="space-y-6">
            <UserInfoSection
              user={userDetails.user}
              onToggleStatus={onToggleStatus}
              onUpdateTier={onUpdateTier}
            />

            <Separator />

            <BusinessProfilesSection
              businesses={userDetails.businesses}
              onUpdateAgentLimit={onUpdateAgentLimit}
            />

            <Separator />

            <AIAgentsSection
              agents={userDetails.aiAgents}
              onToggleAgent={onToggleAgent}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
