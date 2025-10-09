import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Calendar, History, Mail } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ReportLibraryProps {
  businessId: Id<"businesses">;
}

export function ReportLibrary({ businessId }: ReportLibraryProps) {
  const [frameworkFilter, setFrameworkFilter] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showVersions, setShowVersions] = useState(false);
  
  const reports = useQuery(api.complianceReports.listGeneratedReports, {
    businessId,
    framework: frameworkFilter !== "all" ? frameworkFilter : undefined,
  });

  const versions = useQuery(
    api.complianceReports.getReportVersions,
    selectedReport
      ? {
          businessId,
          templateId: selectedReport.templateId,
          framework: selectedReport.framework,
        }
      : "skip"
  );

  if (!reports) {
    return <div>Loading reports...</div>;
  }

  const frameworks = ["all", "GDPR", "SOC2", "HIPAA", "ISO27001"];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Report Library
            </CardTitle>
            <CardDescription>
              {reports.length} report{reports.length !== 1 ? "s" : ""} generated
            </CardDescription>
          </div>
          <Select value={frameworkFilter} onValueChange={setFrameworkFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by framework" />
            </SelectTrigger>
            <SelectContent>
              {frameworks.map((fw) => (
                <SelectItem key={fw} value={fw}>
                  {fw === "all" ? "All Frameworks" : fw}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No reports generated yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report: any) => (
              <div
                key={report._id}
                className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{report.framework}</Badge>
                      <Badge variant="secondary">v{report.version || 1}</Badge>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(report.generatedAt), "PPP")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Period: {format(new Date(report.dateRange.start), "PP")} -{" "}
                      {format(new Date(report.dateRange.end), "PP")}
                    </p>
                    {report.changeNotes && (
                      <p className="text-sm text-muted-foreground italic">
                        "{report.changeNotes}"
                      </p>
                    )}
                    {report.emailedTo && report.emailedTo.length > 0 && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        Sent to {report.emailedTo.length} recipient{report.emailedTo.length !== 1 ? "s" : ""}
                        {report.emailedAt && ` on ${format(new Date(report.emailedAt), "PP")}`}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedReport(report);
                        setShowVersions(true);
                      }}
                    >
                      <History className="h-4 w-4 mr-2" />
                      Versions
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Version History Dialog */}
      <Dialog open={showVersions} onOpenChange={setShowVersions}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>
              {selectedReport?.framework} - All versions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {versions && versions.length > 0 ? (
              versions.map((version: any) => (
                <div
                  key={version._id}
                  className="p-4 border rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={version._id === selectedReport?._id ? "default" : "secondary"}>
                        v{version.version || 1}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(version.generatedAt), "PPP 'at' p")}
                      </span>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                  {version.changeNotes && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {version.changeNotes}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Period: {format(new Date(version.dateRange.start), "PP")} -{" "}
                    {format(new Date(version.dateRange.end), "PP")}
                  </p>
                  {version.emailedTo && version.emailedTo.length > 0 && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      Distributed to: {version.emailedTo.join(", ")}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No versions found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}