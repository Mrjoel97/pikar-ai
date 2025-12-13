import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { Id } from "@/convex/_generated/dataModel";

interface AuditSearchPanelProps {
  businessId: Id<"businesses">;
}

export function AuditSearchPanel({ businessId }: AuditSearchPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [action, setAction] = useState<string | undefined>(undefined);
  const [entityType, setEntityType] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const logs = useQuery(api.audit.search.searchAuditLogs, {
    businessId,
    action: action || undefined,
    entityType: entityType || undefined,
    searchTerm: searchTerm || undefined,
    startDate: startDate ? new Date(startDate).getTime() : undefined,
    endDate: endDate ? new Date(endDate).getTime() : undefined,
    limit: 100,
  });

  const stats = useQuery(api.audit.search.getAuditStats, {
    businessId,
    timeRange: 30 * 24 * 60 * 60 * 1000, // Last 30 days
  });

  const timeline = useQuery(api.audit.search.getAuditTimeline, {
    businessId,
    days: 7,
  });

  const anomalies = useQuery(api.audit.search.detectAnomalies, {
    businessId,
    threshold: 2,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Audit Log Search
          </CardTitle>
          <CardDescription>
            Search and filter audit logs with advanced criteria
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Term</Label>
              <Input
                id="search"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <Select value={action || "all"} onValueChange={(v) => setAction(v === "all" ? undefined : v)}>
                <SelectTrigger id="action">
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="view">View</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="entityType">Entity Type</Label>
              <Select value={entityType || "all"} onValueChange={(v) => setEntityType(v === "all" ? undefined : v)}>
                <SelectTrigger id="entityType">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="workflow">Workflow</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Apply Filters
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {anomalies && anomalies.anomalies.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Badge variant="destructive">Alert</Badge>
              Anomalies Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {anomalies.anomalies.slice(0, 3).map((anomaly: any) => (
                <div key={anomaly.date} className="text-sm">
                  <span className="font-medium">{anomaly.date}:</span>{" "}
                  <Badge variant={anomaly.type === "spike" ? "destructive" : "secondary"}>
                    {anomaly.type === "spike" ? "↑" : "↓"} {anomaly.count} events
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({anomaly.deviation}σ from baseline)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Top Action</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.byAction[0]?.action || "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.byAction[0]?.count || 0} events
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Top Entity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.byEntityType[0]?.entityType || "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.byEntityType[0]?.count || 0} events
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Most Active User</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.byUser[0]?.count || 0}
              </div>
              <p className="text-xs text-muted-foreground">events</p>
            </CardContent>
          </Card>
        </div>
      )}

      {timeline && timeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Activity Timeline (Last 7 Days)</CardTitle>
            <CardDescription>Hourly audit event distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-32 flex items-end gap-1">
              {timeline.slice(-48).map((point: any, i: number) => {
                const maxCount = Math.max(...timeline.map((p: any) => p.count));
                const height = (point.count / maxCount) * 100;
                return (
                  <div
                    key={i}
                    className="flex-1 bg-primary/20 hover:bg-primary/40 transition-colors rounded-t"
                    style={{ height: `${height}%` }}
                    title={`${new Date(point.hour).toLocaleString()}: ${point.count} events`}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>
            {logs?.length || 0} results found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {logs?.map((log: any, index: number) => (
              <motion.div
                key={log._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{log.action}</Badge>
                    <span className="text-sm font-medium">{log.entityType}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Entity ID: {log.entityId}
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  View Details
                </Button>
              </motion.div>
            ))}
            {logs?.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No audit logs found matching your criteria
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}