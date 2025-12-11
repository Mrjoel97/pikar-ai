import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link as LinkIcon } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface CRMSyncCardProps {
  businessId: Id<"businesses">;
}

export function CRMSyncCard({ businessId }: CRMSyncCardProps) {
  const syncStatus = useQuery(api.crmIntegrations.getSyncStatus, { businessId });

  if (!syncStatus) {
    return <div className="text-sm text-muted-foreground">Loading sync status...</div>;
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <LinkIcon className="h-5 w-5 text-muted-foreground" />
        <div>
          <div className="font-medium">
            {syncStatus.connections > 0
              ? `${syncStatus.connections} CRM Connected`
              : "No CRM Connected"}
          </div>
          {syncStatus.lastSync && (
            <div className="text-xs text-muted-foreground">
              Last sync: {new Date(syncStatus.lastSync).toLocaleString()}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {syncStatus.pendingConflicts > 0 && (
          <Badge variant="destructive">{syncStatus.pendingConflicts} Conflicts</Badge>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() => (window.location.href = "/crm-integration-hub")}
        >
          Manage
        </Button>
      </div>
    </div>
  );
}
