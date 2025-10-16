import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Download, Calendar, Filter, Mail } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface AuditSearchPanelProps {
  businessId: Id<"businesses"> | undefined;
}

export function AuditSearchPanel({ businessId }: AuditSearchPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [selectedEntity, setSelectedEntity] = useState<string>("");
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const [scheduleForm, setScheduleForm] = useState({
    frequency: "weekly" as "daily" | "weekly" | "monthly",
    format: "csv" as "csv" | "pdf",
    recipients: "",
  });

  // Queries
  const auditLogs = useQuery(
    api.audit.searchAuditLogs,
    businessId
      ? {
          businessId,
          searchTerm: searchTerm || undefined,
          startDate: startDate ? new Date(startDate).getTime() : undefined,
          endDate: endDate ? new Date(endDate).getTime() : undefined,
          action: selectedAction || undefined,
          entityType: selectedEntity || undefined,
          limit: 100,
        }
      : undefined
  );

  const actionTypes = useQuery(api.audit.getActionTypes, businessId ? { businessId } : undefined);
  const entityTypes = useQuery(api.audit.getEntityTypes, businessId ? { businessId } : undefined);

  const scheduleReport = useMutation(api.audit.scheduleAuditReport);

  const handleExportCSV = () => {
    if (!businessId) return;
    
    const params = new URLSearchParams({ businessId });
    if (startDate) params.append("startDate", new Date(startDate).getTime().toString());
    if (endDate) params.append("endDate", new Date(endDate).getTime().toString());
    if (selectedAction) params.append("action", selectedAction);
    if (selectedEntity) params.append("entityType", selectedEntity);

    const url = `/api/audit/export?${params.toString()}`;
    window.open(url, "_blank");
    toast.success("Exporting audit logs to CSV");
  };

  const handleScheduleReport = async () => {
    if (!businessId) return;

    try {
      const recipients = scheduleForm.recipients
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);

      if (recipients.length === 0) {
        toast.error("Please enter at least one recipient email");
        return;
      }

      await scheduleReport({
        businessId,
        frequency: scheduleForm.frequency,
        format: scheduleForm.format,
        recipients,
        filters: {
          startDate: startDate ? new Date(startDate).getTime() : undefined,
          endDate: endDate ? new Date(endDate).getTime() : undefined,
          action: selectedAction || undefined,
          entityType: selectedEntity || undefined,
        },
      });

      toast.success("Audit report scheduled successfully");
      setIsScheduleOpen(false);
      setScheduleForm({ frequency: "weekly", format: "csv", recipients: "" });
    } catch (error: any) {
      toast.error(error.message || "Failed to schedule report");
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setSelectedAction("");
    setSelectedEntity("");
  };

  if (!businessId) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Sign in to search audit logs</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Audit Trail Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div>
            <Label>Search</Label>
            <Input
              placeholder="Search by action, entity, or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Action Type</Label>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  {actionTypes?.map((action: string) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Entity Type</Label>
              <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                <SelectTrigger>
                  <SelectValue placeholder="All entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All entities</SelectItem>
                  {entityTypes?.map((entity: string) => (
                    <SelectItem key={entity} value={entity}>
                      {entity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClearFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Schedule Report
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Schedule Audit Report</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Frequency</Label>
                    <Select
                      value={scheduleForm.frequency}
                      onValueChange={(v: any) =>
                        setScheduleForm({ ...scheduleForm, frequency: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Format</Label>
                    <Select
                      value={scheduleForm.format}
                      onValueChange={(v: any) =>
                        setScheduleForm({ ...scheduleForm, format: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Recipients (comma-separated emails)</Label>
                    <Input
                      placeholder="admin@example.com, manager@example.com"
                      value={scheduleForm.recipients}
                      onChange={(e) =>
                        setScheduleForm({ ...scheduleForm, recipients: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsScheduleOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleScheduleReport}>Schedule</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>
            Audit Logs ({auditLogs?.length || 0} results)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!auditLogs ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : auditLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No audit logs found</p>
          ) : (
            <div className="space-y-2">
              {auditLogs.map((log: any) => (
                <div key={log._id} className="border rounded-md p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{log.action}</Badge>
                        <Badge variant="secondary">{log.entityType}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">
                        Entity ID: <code className="text-xs">{log.entityId || "N/A"}</code>
                      </p>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer">
                            View details
                          </summary>
                          <pre className="text-xs mt-1 p-2 bg-muted rounded">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}