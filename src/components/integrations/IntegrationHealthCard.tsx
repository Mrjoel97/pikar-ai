import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Settings, 
  Unlink,
  Clock
} from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface IntegrationHealthCardProps {
  integration: any;
  businessId: Id<"businesses">;
  isGuest?: boolean;
}

export function IntegrationHealthCard({ 
  integration, 
  businessId, 
  isGuest = false 
}: IntegrationHealthCardProps) {
  const [syncing, setSyncing] = useState(false);
  
  const triggerSync = useMutation(api.crmIntegrations.triggerSync);
  const disconnectCRM = useMutation(api.crmIntegrations.disconnectCRM);

  const handleSync = async () => {
    if (isGuest || integration.type !== "crm") {
      toast.info("Sync functionality available for authenticated CRM connections");
      return;
    }

    try {
      setSyncing(true);
      await triggerSync({ connectionId: integration.id as Id<"crmConnections"> });
      toast.success(`${integration.name} synced successfully`);
    } catch (error: any) {
      toast.error(error?.message || "Failed to sync");
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (isGuest) {
      toast.info("Disconnect functionality available for authenticated users");
      return;
    }

    if (!confirm(`Are you sure you want to disconnect ${integration.name}?`)) return;

    try {
      if (integration.type === "crm") {
        await disconnectCRM({ connectionId: integration.id as Id<"crmConnections"> });
      }
      toast.success(`${integration.name} disconnected`);
    } catch (error: any) {
      toast.error(error?.message || "Failed to disconnect");
    }
  };

  const getStatusIcon = () => {
    if (integration.status === "disconnected") {
      return <XCircle className="h-5 w-5 text-gray-500" />;
    }
    switch (integration.health) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <CheckCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    if (integration.status === "disconnected") {
      return <Badge variant="outline" className="border-gray-300 text-gray-700">Disconnected</Badge>;
    }
    switch (integration.health) {
      case "healthy":
        return <Badge variant="outline" className="border-green-300 text-green-700">Healthy</Badge>;
      case "warning":
        return <Badge variant="outline" className="border-amber-300 text-amber-700">Warning</Badge>;
      case "error":
        return <Badge variant="outline" className="border-red-300 text-red-700">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTypeColor = () => {
    switch (integration.type) {
      case "crm":
        return "bg-blue-500";
      case "social":
        return "bg-purple-500";
      case "api":
        return "bg-emerald-500";
      case "email":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatLastSync = (timestamp: number) => {
    if (!timestamp) return "Never";
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${getTypeColor()}`} />
              <div>
                <h4 className="font-medium capitalize">{integration.name}</h4>
                {integration.accountName && (
                  <p className="text-xs text-muted-foreground">{integration.accountName}</p>
                )}
              </div>
            </div>
            {getStatusIcon()}
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-between">
            {getStatusBadge()}
            <Badge variant="secondary" className="text-xs capitalize">
              {integration.type}
            </Badge>
          </div>

          {/* Last Sync */}
          {integration.status === "connected" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Last sync: {formatLastSync(integration.lastSync)}</span>
            </div>
          )}

          {/* Description */}
          {integration.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {integration.description}
            </p>
          )}

          {/* Actions */}
          {integration.status === "connected" && (
            <div className="flex gap-2 pt-2 border-t">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSync}
                disabled={syncing || isGuest}
                className="flex-1"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${syncing ? "animate-spin" : ""}`} />
                Sync
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={isGuest}
                className="flex-1"
              >
                <Settings className="h-3 w-3 mr-1" />
                Configure
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDisconnect}
                disabled={isGuest}
              >
                <Unlink className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
