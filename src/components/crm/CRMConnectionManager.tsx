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
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Link className="h-4 w-4 md:h-5 md:w-5" />
            CRM Connections
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Sign in to connect your CRM and sync contacts, deals, and activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs md:text-sm text-muted-foreground">
            Please sign in to manage CRM connections.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base md:text-lg lg:text-xl">
          <Database className="h-4 w-4 md:h-5 md:w-5" />
          CRM Integration Hub
        </CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Bidirectional sync with real-time conflict resolution
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto gap-1">
            <TabsTrigger value="connections" className="text-xs md:text-sm px-2 py-1.5">
              <span className="hidden sm:inline">Connections</span>
              <span className="sm:hidden">Conn.</span>
            </TabsTrigger>
            <TabsTrigger value="sync" className="text-xs md:text-sm px-2 py-1.5">
              <span className="hidden sm:inline">Sync Status</span>
              <span className="sm:hidden">Sync</span>
            </TabsTrigger>
            <TabsTrigger value="conflicts" className="text-xs md:text-sm px-2 py-1.5">
              <span className="hidden sm:inline">Conflicts</span>
              <span className="sm:hidden">Conf.</span>
              {conflicts && conflicts.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-[10px] px-1 py-0">
                  {conflicts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs md:text-sm px-2 py-1.5">
              <span className="hidden sm:inline">History</span>
              <span className="sm:hidden">Hist.</span>
            </TabsTrigger>
          </TabsList>

          {/* Connections Tab */}
          <TabsContent value="connections" className="space-y-3 mt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {platforms.map((platform) => {
                const connection = connections?.find(
                  (c: any) => c.platform === platform.id && c.isActive
                );
                const isConnected = !!connection;

                return (
                  <Card key={platform.id} className="overflow-hidden">
                    <CardContent className="p-3 md:p-4">
                      <div className="flex items-center justify-between mb-3 gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full ${platform.color} flex-shrink-0`} />
                          <span className="font-medium text-xs md:text-sm truncate">{platform.name}</span>
                        </div>
                        {isConnected ? (
                          <Badge variant="outline" className="text-green-600 border-green-600 text-[10px] md:text-xs flex-shrink-0 px-1.5 py-0">
                            <CheckCircle className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5 md:mr-1" />
                            <span className="hidden sm:inline">Connected</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500 text-[10px] md:text-xs flex-shrink-0 px-1.5 py-0">
                            <XCircle className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5 md:mr-1" />
                            <span className="hidden sm:inline">Not Connected</span>
                          </Badge>
                        )}
                      </div>

                      {isConnected && connection ? (
                        <div className="space-y-2">
                          <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                            <span className="hidden sm:inline">Account: </span>{connection.accountName}
                          </p>
                          {connection.lastSyncAt && (
                            <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                              <span className="hidden sm:inline">Last sync: </span>
                              <span className="sm:hidden">Synced: </span>
                              {new Date(connection.lastSyncAt).toLocaleString(undefined, { 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          )}
                          <div className="flex flex-col sm:flex-row gap-1.5 md:gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full sm:w-auto text-[10px] md:text-xs h-7 md:h-8 px-2 md:px-3"
                              onClick={() => handleSync(connection._id)}
                              disabled={syncing === connection._id}
                            >
                              <RefreshCw className={`h-2.5 w-2.5 md:h-3 md:w-3 mr-1 ${syncing === connection._id ? "animate-spin" : ""}`} />
                              Sync
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full sm:w-auto text-[10px] md:text-xs h-7 md:h-8 px-2 md:px-3"
                              onClick={() => handleDisconnect(connection._id)}
                            >
                              <Unlink className="h-2.5 w-2.5 md:h-3 md:w-3 mr-1" />
                              <span className="hidden sm:inline">Disconnect</span>
                              <span className="sm:hidden">Remove</span>
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          className="w-full text-[10px] md:text-xs h-7 md:h-8"
                          onClick={() => handleConnect(platform.id as any)}
                        >
                          <Link className="h-2.5 w-2.5 md:h-3 md:w-3 mr-1" />
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
          <TabsContent value="sync" className="space-y-3 mt-3">
            {connections && connections.length > 0 ? (
              connections.map((conn: any) => (
                <Card key={conn._id}>
                  <CardContent className="p-3 md:p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full flex-shrink-0 ${ 
                          platforms.find(p => p.id === conn.platform)?.color
                        }`} />
                        <span className="font-medium capitalize text-xs md:text-sm truncate">{conn.platform}</span>
                        <Badge variant={conn.isActive ? "default" : "secondary"} className="text-[10px] md:text-xs px-1.5 py-0">
                          {conn.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-1.5 md:gap-2 w-full sm:w-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full sm:w-auto text-[10px] md:text-xs h-7 md:h-8 px-2 md:px-3"
                          onClick={() => handleBidirectionalSync(conn._id, "contacts")}
                          disabled={syncing === conn._id}
                        >
                          <TrendingUp className="h-2.5 w-2.5 md:h-3 md:w-3 mr-1" />
                          Contacts
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full sm:w-auto text-[10px] md:text-xs h-7 md:h-8 px-2 md:px-3"
                          onClick={() => handleBidirectionalSync(conn._id, "deals")}
                          disabled={syncing === conn._id}
                        >
                          <TrendingUp className="h-2.5 w-2.5 md:h-3 md:w-3 mr-1" />
                          Deals
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1.5 md:space-y-2">
                      <div className="flex items-center justify-between text-[10px] md:text-xs">
                        <span className="text-muted-foreground">Last Sync</span>
                        <span className="flex items-center gap-1 truncate">
                          <Clock className="h-2.5 w-2.5 md:h-3 md:w-3 flex-shrink-0" />
                          <span className="truncate text-[10px] md:text-xs">
                            {conn.lastSyncAt
                              ? new Date(conn.lastSyncAt).toLocaleString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : "Never"}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] md:text-xs">
                        <span className="text-muted-foreground">Account</span>
                        <span className="truncate max-w-[60%] text-right">{conn.accountName}</span>
                      </div>
                      {syncing === conn._id && (
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between text-[10px]">
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
                <AlertDescription className="text-xs md:text-sm">
                  No active connections. Connect a CRM to start syncing.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Conflicts Tab */}
          <TabsContent value="conflicts" className="space-y-3 mt-3">
            {conflicts && conflicts.length > 0 ? (
              conflicts.map((conflict: any) => (
                <Card key={conflict._id}>
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-start justify-between mb-2 md:mb-3 gap-2">
                      <div className="flex items-start gap-2 min-w-0 flex-1">
                        <AlertTriangle className="h-3.5 w-3.5 md:h-4 md:w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-xs md:text-sm truncate">{conflict.conflictType.replace(/_/g, " ")}</p>
                          <p className="text-[10px] md:text-xs text-muted-foreground truncate">{conflict.contactEmail}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600 text-[10px] md:text-xs flex-shrink-0 px-1.5 py-0">
                        Pending
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2 md:mb-3">
                      <div className="p-2 rounded bg-muted">
                        <p className="text-[10px] md:text-xs font-medium mb-1">Local Data</p>
                        <p className="text-[10px] break-all line-clamp-3">{JSON.stringify(conflict.localData)}</p>
                      </div>
                      <div className="p-2 rounded bg-muted">
                        <p className="text-[10px] md:text-xs font-medium mb-1">Remote Data</p>
                        <p className="text-[10px] break-all line-clamp-3">{JSON.stringify(conflict.remoteData)}</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-1.5 md:gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto text-[10px] md:text-xs h-7 md:h-8 px-2 md:px-3"
                        onClick={() => handleResolveConflict(conflict._id, "keep_local")}
                      >
                        Keep Local
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto text-[10px] md:text-xs h-7 md:h-8 px-2 md:px-3"
                        onClick={() => handleResolveConflict(conflict._id, "keep_remote")}
                      >
                        Keep Remote
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto text-[10px] md:text-xs h-7 md:h-8 px-2 md:px-3"
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
                <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <AlertDescription className="text-xs md:text-sm">
                  No conflicts detected. All data is in sync!
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-3 mt-3">
            <Alert>
              <Clock className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <AlertDescription className="text-xs md:text-sm">
                Sync history will appear here. Recent syncs, errors, and resolutions are tracked.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}