import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Users, Shield, AlertCircle, CheckCircle, Filter } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

interface ScimSyncStatusProps {
  businessId: Id<"businesses">;
}

export default function ScimSyncStatus({ businessId }: ScimSyncStatusProps) {
  const [entityFilter, setEntityFilter] = useState<"all" | "user" | "group" | "system">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "error">("all");

  const stats = useQuery(api.scim.getSyncStats, { businessId });
  const logs = useQuery(api.scim.getSyncLogs, { 
    businessId,
    entityType: entityFilter !== "all" ? entityFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    limit: 20,
  });
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
              <CardTitle>Sync Status & Logs</CardTitle>
              <CardDescription>
                {stats?.lastSync 
                  ? `Last synced ${formatDistanceToNow(stats.lastSync, { addSuffix: true })}`
                  : "No syncs yet"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleForceSync} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Force Sync
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              <Select value={entityFilter} onValueChange={(v: any) => setEntityFilter(v)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                  <SelectItem value="group">Groups</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sync Events */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Recent Sync Events</h3>
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
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">
                            {log.entityType === "user" ? "User" : log.entityType === "group" ? "Group" : "System"} {log.action}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {log.entityType}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(log.timestamp, { addSuffix: true })}
                        </p>
                        {log.details && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {log.details.email && `Email: ${log.details.email}`}
                            {log.details.displayName && `Group: ${log.details.displayName}`}
                            {log.details.memberCount !== undefined && ` (${log.details.memberCount} members)`}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant={log.status === "success" ? "default" : "destructive"}>
                      {log.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No sync events match the selected filters
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}