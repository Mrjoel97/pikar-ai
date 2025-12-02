import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileDown, Download } from "lucide-react";

interface ExportHistoryProps {
  businessId: Id<"businesses">;
}

export function ExportHistory({ businessId }: ExportHistoryProps) {
  const exportHistory = useQuery(api.dataWarehouse.getExportHistory, { businessId, limit: 20 }) as any;
  const exportSchedules = useQuery(api.dataWarehouse.listExportSchedules, { businessId }) as any;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Export History</h3>
        <p className="text-sm text-muted-foreground">
          View and manage scheduled data exports
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scheduled Exports</CardTitle>
          <CardDescription>Automated data export configurations</CardDescription>
        </CardHeader>
        <CardContent>
          {exportSchedules && exportSchedules.length > 0 ? (
            <div className="space-y-2">
              {exportSchedules.map((schedule: any) => (
                <div
                  key={schedule._id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="text-sm font-medium">{schedule.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {schedule.format.toUpperCase()} • {schedule.schedule}
                    </div>
                  </div>
                  <Badge variant={schedule.enabled ? "default" : "secondary"}>
                    {schedule.enabled ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No scheduled exports configured
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Exports</CardTitle>
          <CardDescription>Export execution history</CardDescription>
        </CardHeader>
        <CardContent>
          {exportHistory && exportHistory.length > 0 ? (
            <div className="space-y-2">
              {exportHistory.map((export_: any) => (
                <div
                  key={export_._id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileDown className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{export_.fileName}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(export_.exportedAt).toLocaleString()} • {export_.format.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{export_.status}</Badge>
                    {export_.status === "completed" && (
                      <Button size="sm" variant="ghost">
                        <Download className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No export history available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}