import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Users, Shield, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";

interface ScimSyncStatusProps {
  businessId: Id<"businesses">;
}

export default function ScimSyncStatus({ businessId }: ScimSyncStatusProps) {
  const stats = useQuery(api.scim.getSyncStats);
  const logs = useQuery(api.scim.getSyncLogs, { limit: 10 });
  const forceSync = useMutation(api.scim.forceSync);

  const handleForceSync = async () => {
    try {
      await forceSync({ businessId });
      toast.success("Force sync initiated");
    } catch (error: any) {
      toast.error(error.message || "Failed to initiate sync");
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Syncs</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSyncs ?? 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users Synced</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.usersSynced ?? 0}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Groups Synced</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.groupsSynced ?? 0}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.errors ?? 0}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Sync Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sync Status</CardTitle>
              <CardDescription>
                {stats?.lastSync 
                  ? `Last synced ${formatDistanceToNow(stats.lastSync, { addSuffix: true })}`
                  : "No syncs yet"}
              </CardDescription>
            </div>
            <Button onClick={handleForceSync} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Force Sync
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Recent Sync Events</h3>
            <div className="space-y-2">
              {logs && logs.length > 0 ? (
                logs.map((log: any) => (
                  <div
                    key={log._id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {log.status === "success" ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {log.entityType === "user" ? "User" : log.entityType === "group" ? "Group" : "System"} {log.action}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(log.timestamp, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <Badge variant={log.status === "success" ? "default" : "destructive"}>
                      {log.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No sync events yet
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
