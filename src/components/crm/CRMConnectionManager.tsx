import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Link, Unlink, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface CRMConnectionManagerProps {
  businessId: Id<"businesses">;
}

export function CRMConnectionManager({ businessId }: CRMConnectionManagerProps) {
  const connections = useQuery(api.crmIntegrations.listConnections, { businessId });
  const disconnectCRM = useMutation(api.crmIntegrations.disconnectCRM);
  const triggerSync = useMutation(api.crmIntegrations.triggerSync);
  const [syncing, setSyncing] = useState<string | null>(null);

  const handleConnect = (platform: "salesforce" | "hubspot" | "pipedrive") => {
    toast.info(`OAuth flow for ${platform} would open here`);
    // In production, this would redirect to OAuth provider
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

  const platforms = [
    { id: "salesforce", name: "Salesforce", color: "bg-blue-500" },
    { id: "hubspot", name: "HubSpot", color: "bg-orange-500" },
    { id: "pipedrive", name: "Pipedrive", color: "bg-green-500" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-5 w-5" />
          CRM Connections
        </CardTitle>
        <CardDescription>
          Connect your CRM to sync contacts, deals, and activities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Available Platforms */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Available Platforms</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {platforms.map((platform) => {
              const connection = connections?.find(
                (c: any) => c.platform === platform.id && c.isActive
              );
              const isConnected = !!connection;

              return (
                <Card key={platform.id} className="relative">
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
                            Sync
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
        </div>

        {/* Connection Status */}
        {connections && connections.length > 0 && (
          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium mb-2">Connection Details</h3>
            <div className="space-y-2">
              {connections.map((conn: any) => (
                <div key={conn._id} className="flex items-center justify-between text-sm p-2 rounded bg-muted">
                  <div>
                    <span className="font-medium capitalize">{conn.platform}</span>
                    <span className="text-muted-foreground ml-2">• {conn.accountName}</span>
                  </div>
                  <Badge variant={conn.isActive ? "default" : "secondary"}>
                    {conn.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
