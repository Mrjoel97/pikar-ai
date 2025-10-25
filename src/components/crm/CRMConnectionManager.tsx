import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Link, Unlink, RefreshCw, CheckCircle, XCircle, AlertTriangle, Clock, TrendingUp, Database } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface CRMConnectionManagerProps {
  businessId: Id<"businesses"> | null | undefined;
}

export function CRMConnectionManager({ businessId }: CRMConnectionManagerProps) {
  const connections = useQuery(
    api.crmIntegrations.listConnections,
    businessId ? { businessId } : "skip"
  );
  const conflicts = useQuery(
    api.crmIntegrations.getSyncConflicts,
    businessId ? { businessId } : "skip"
  );
  const disconnectCRM = useMutation(api.crmIntegrations.disconnectCRM);
  const triggerSync = useMutation(api.crmIntegrations.triggerSync);
  const resolveConflict = useMutation(api.crmIntegrations.resolveConflict);
  const syncContacts = useAction(api.crmSync.syncContacts);
  const syncDeals = useAction(api.crmSync.syncDeals);
  
  const [syncing, setSyncing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("connections");

  const handleConnect = (platform: "salesforce" | "hubspot" | "pipedrive") => {
    if (!businessId) {
      toast.error("Please sign in to connect a CRM");
      return;
    }
    toast.info(`OAuth flow for ${platform} would open here`);
  };

  const handleDisconnect = async (connectionId: Id<"crmConnections">) => {
    try {
      await disconnectCRM({ connectionId });
      toast.success("CRM disconnected successfully");
    } catch (error: any) {
      toast.error(error?.message || "Failed to disconnect CRM");
    }
  };

  const handleSync = async (connectionId: Id<"crmConnections">) => {
    try {
      setSyncing(connectionId);
      await triggerSync({ connectionId });
      toast.success("Sync completed successfully");
    } catch (error: any) {
      toast.error(error?.message || "Failed to sync");
    } finally {
      setSyncing(null);
    }
  };

  const handleBidirectionalSync = async (connectionId: Id<"crmConnections">, type: "contacts" | "deals") => {
    try {
      setSyncing(connectionId);
      if (type === "contacts") {
        const result = await syncContacts({ connectionId, direction: "both" });
        toast.success(`Synced ${result.synced} contacts${result.errors > 0 ? ` (${result.errors} errors)` : ""}`);
      } else {
        const result = await syncDeals({ connectionId, direction: "both" });
        toast.success(`Synced ${result.synced} deals${result.errors > 0 ? ` (${result.errors} errors)` : ""}`);
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to sync");
    } finally {
      setSyncing(null);
    }
  };

  const handleResolveConflict = async (
    conflictId: Id<"crmSyncConflicts">,
    resolution: "keep_local" | "keep_remote" | "merge"
  ) => {
    try {
      await resolveConflict({ conflictId, resolution });
      toast.success("Conflict resolved successfully");
    } catch (error: any) {
      toast.error(error?.message || "Failed to resolve conflict");
    }
  };

  const platforms = [
    { id: "salesforce", name: "Salesforce", color: "bg-blue-500" },
    { id: "hubspot", name: "HubSpot", color: "bg-orange-500" },
    { id: "pipedrive", name: "Pipedrive", color: "bg-green-500" },
  ];

  if (!businessId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            CRM Connections
          </CardTitle>
          <CardDescription>
            Sign in to connect your CRM and sync contacts, deals, and activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Please sign in to manage CRM connections.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          CRM Integration Hub
        </CardTitle>
        <CardDescription>
          Bidirectional sync with real-time conflict resolution
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="connections">Connections</TabsTrigger>
            <TabsTrigger value="sync">Sync Status</TabsTrigger>
            <TabsTrigger value="conflicts">
              Conflicts {conflicts && conflicts.length > 0 && (
                <Badge variant="destructive" className="ml-2">{conflicts.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Connections Tab */}
          <TabsContent value="connections" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {platforms.map((platform) => {
                const connection = connections?.find(
                  (c: any) => c.platform === platform.id && c.isActive
                );
                const isConnected = !!connection;

                return (
                  <Card key={platform.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${platform.color}`} />
                          <span className="font-medium">{platform.name}</span>
                        </div>
                        {isConnected ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">
                            <XCircle className="h-3 w-3 mr-1" />
                            Not Connected
                          </Badge>
                        )}
                      </div>

                      {isConnected && connection ? (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">
                            Account: {connection.accountName}
                          </p>
                          {connection.lastSyncAt && (
                            <p className="text-xs text-muted-foreground">
                              Last sync: {new Date(connection.lastSyncAt).toLocaleString()}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSync(connection._id)}
                              disabled={syncing === connection._id}
                            >
                              <RefreshCw className={`h-3 w-3 mr-1 ${syncing === connection._id ? "animate-spin" : ""}`} />
                              Quick Sync
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDisconnect(connection._id)}
                            >
                              <Unlink className="h-3 w-3 mr-1" />
                              Disconnect
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => handleConnect(platform.id as any)}
                        >
                          <Link className="h-3 w-3 mr-1" />
                          Connect
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Sync Status Tab */}
          <TabsContent value="sync" className="space-y-4">
            {connections && connections.length > 0 ? (
              connections.map((conn: any) => (
                <Card key={conn._id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          platforms.find(p => p.id === conn.platform)?.color
                        }`} />
                        <span className="font-medium capitalize">{conn.platform}</span>
                        <Badge variant={conn.isActive ? "default" : "secondary"}>
                          {conn.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleBidirectionalSync(conn._id, "contacts")}
                          disabled={syncing === conn._id}
                        >
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Sync Contacts
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleBidirectionalSync(conn._id, "deals")}
                          disabled={syncing === conn._id}
                        >
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Sync Deals
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Last Sync</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {conn.lastSyncAt
                            ? new Date(conn.lastSyncAt).toLocaleString()
                            : "Never"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Account</span>
                        <span>{conn.accountName}</span>
                      </div>
                      {syncing === conn._id && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>Syncing...</span>
                            <span>In Progress</span>
                          </div>
                          <Progress value={45} className="h-1" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Alert>
                <AlertDescription>
                  No active connections. Connect a CRM to start syncing.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Conflicts Tab */}
          <TabsContent value="conflicts" className="space-y-4">
            {conflicts && conflicts.length > 0 ? (
              conflicts.map((conflict: any) => (
                <Card key={conflict._id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">{conflict.conflictType.replace(/_/g, " ")}</p>
                          <p className="text-xs text-muted-foreground">{conflict.contactEmail}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        Pending
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                      <div className="p-2 rounded bg-muted">
                        <p className="text-xs font-medium mb-1">Local Data</p>
                        <p className="text-xs">{JSON.stringify(conflict.localData)}</p>
                      </div>
                      <div className="p-2 rounded bg-muted">
                        <p className="text-xs font-medium mb-1">Remote Data</p>
                        <p className="text-xs">{JSON.stringify(conflict.remoteData)}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolveConflict(conflict._id, "keep_local")}
                      >
                        Keep Local
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolveConflict(conflict._id, "keep_remote")}
                      >
                        Keep Remote
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolveConflict(conflict._id, "merge")}
                      >
                        Merge
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  No conflicts detected. All data is in sync!
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Sync history will appear here. Recent syncs, errors, and resolutions are tracked.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}