import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

interface ReportLibraryProps {
  businessId: Id<"businesses">;
}

export function ReportLibrary({ businessId }: ReportLibraryProps) {
  const [frameworkFilter, setFrameworkFilter] = useState<string>("all");
  
  const reports = useQuery(api.complianceReports.listGeneratedReports, {
    businessId,
    framework: frameworkFilter !== "all" ? frameworkFilter : undefined,
  });

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
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(report.generatedAt), "PPP")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Period: {format(new Date(report.dateRange.start), "PP")} -{" "}
                      {format(new Date(report.dateRange.end), "PP")}
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}