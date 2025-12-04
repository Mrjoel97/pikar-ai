import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle, CheckCircle, Clock, User } from "lucide-react";

interface ComplianceAuditViewerProps {
  businessId: Id<"businesses">;
}

export function ComplianceAuditViewer({ businessId }: ComplianceAuditViewerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");

  const auditLogs = useQuery(api.audit.searchAuditLogs, {
    businessId,
    query: searchQuery || undefined,
    actionType: actionFilter !== "all" ? actionFilter : undefined,
    entityType: entityFilter !== "all" ? entityFilter : undefined,
    limit: 50,
  });

  const actionTypes = useQuery(api.audit.getActionTypes, { businessId });
  const entityTypes = useQuery(api.audit.getEntityTypes, { businessId });

  const getActionIcon = (action: string) => {
    if (action.includes("create") || action.includes("approve")) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (action.includes("delete") || action.includes("reject")) {
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
    return <Clock className="h-4 w-4 text-blue-600" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes("create") || action.includes("approve")) return "bg-green-100 text-green-800";
    if (action.includes("delete") || action.includes("reject")) return "bg-red-100 text-red-800";
    if (action.includes("update")) return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Audit Trail</CardTitle>
        <div className="flex gap-2 mt-4">
          <Input
            placeholder="Search audit logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Action type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {actionTypes?.map((type: string) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Entity type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              {entityTypes?.map((type: string) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          {auditLogs?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No audit logs found
            </div>
          ) : (
            <div className="space-y-3">
              {auditLogs?.map((log: any) => (
                <div
                  key={log._id}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="mt-1">{getActionIcon(log.action)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getActionColor(log.action)}>
                        {log.action}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {log.entityType}
                      </span>
                    </div>
                    <p className="text-sm">
                      Entity ID: <code className="text-xs bg-muted px-1 rounded">{log.entityId}</code>
                    </p>
                    {log.details && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {JSON.stringify(log.details)}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>User ID: {log.userId || "System"}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(log.createdAt, { addSuffix: true })}</span>
                      {log.ipAddress && (
                        <>
                          <span>•</span>
                          <span>IP: {log.ipAddress}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
