import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Download, Calendar, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface RiskReportsProps {
  businessId: Id<"businesses">;
}

export function RiskReports({ businessId }: RiskReportsProps) {
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [timeRange, setTimeRange] = useState("30d");

  const reports = useQuery(api.risk.reporting.listReports, { businessId });
  const generateReport = useMutation(api.risk.reporting.generateRiskReport);

  const [reportConfig, setReportConfig] = useState({
    reportType: "executive_summary" as "executive_summary" | "detailed_analysis" | "compliance" | "trend_analysis",
    includeScenarios: true,
    includeMitigations: true,
  });

  const getTimeRangeMs = (range: string) => {
    const now = Date.now();
    switch (range) {
      case "7d": return { start: now - 7 * 86400000, end: now };
      case "30d": return { start: now - 30 * 86400000, end: now };
      case "90d": return { start: now - 90 * 86400000, end: now };
      case "1y": return { start: now - 365 * 86400000, end: now };
      default: return { start: now - 30 * 86400000, end: now };
    }
  };

  const handleGenerate = async () => {
    try {
      await generateReport({
        businessId,
        reportType: reportConfig.reportType,
        timeRange: getTimeRangeMs(timeRange),
        includeScenarios: reportConfig.includeScenarios,
        includeMitigations: reportConfig.includeMitigations,
      });
      toast.success("Report generated successfully");
      setIsGenerateOpen(false);
    } catch (error) {
      toast.error("Failed to generate report");
    }
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case "executive_summary": return "Executive Summary";
      case "detailed_analysis": return "Detailed Analysis";
      case "compliance": return "Compliance Report";
      case "trend_analysis": return "Trend Analysis";
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Risk Reports</h2>
          <p className="text-muted-foreground">Generate and view automated risk reports</p>
        </div>
        <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
          <DialogTrigger asChild>
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Risk Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Report Type</Label>
                <Select
                  value={reportConfig.reportType}
                  onValueChange={(v: any) => setReportConfig({ ...reportConfig, reportType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="executive_summary">Executive Summary</SelectItem>
                    <SelectItem value="detailed_analysis">Detailed Analysis</SelectItem>
                    <SelectItem value="compliance">Compliance Report</SelectItem>
                    <SelectItem value="trend_analysis">Trend Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Time Range</Label>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Include</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="scenarios"
                    checked={reportConfig.includeScenarios}
                    onCheckedChange={(checked) =>
                      setReportConfig({ ...reportConfig, includeScenarios: checked as boolean })
                    }
                  />
                  <label htmlFor="scenarios" className="text-sm cursor-pointer">
                    Risk Scenarios
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mitigations"
                    checked={reportConfig.includeMitigations}
                    onCheckedChange={(checked) =>
                      setReportConfig({ ...reportConfig, includeMitigations: checked as boolean })
                    }
                  />
                  <label htmlFor="mitigations" className="text-sm cursor-pointer">
                    Mitigation Strategies
                  </label>
                </div>
              </div>
              <Button onClick={handleGenerate} className="w-full">
                Generate Report
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {reports?.map((report: any) => (
          <Card key={report._id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold">{getReportTypeLabel(report.reportType)}</h3>
                    <Badge variant="outline">
                      {new Date(report.generatedAt).toLocaleDateString()}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-3">
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="text-lg font-bold">{report.summary.totalRisks}</div>
                      <div className="text-xs text-muted-foreground">Total Risks</div>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded">
                      <div className="text-lg font-bold text-red-600">{report.summary.criticalRisks}</div>
                      <div className="text-xs text-muted-foreground">Critical</div>
                    </div>
                    <div className="text-center p-2 bg-orange-50 rounded">
                      <div className="text-lg font-bold text-orange-600">{report.summary.highRisks}</div>
                      <div className="text-xs text-muted-foreground">High</div>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 rounded">
                      <div className="text-lg font-bold text-yellow-600">{report.summary.mediumRisks}</div>
                      <div className="text-xs text-muted-foreground">Medium</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="text-lg font-bold text-green-600">{report.summary.lowRisks}</div>
                      <div className="text-xs text-muted-foreground">Low</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(report.timeRange.start).toLocaleDateString()} - {new Date(report.timeRange.end).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Avg Score: {report.summary.avgRiskScore.toFixed(2)}
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {reports?.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Reports Yet</h3>
            <p className="text-muted-foreground mb-4">Generate your first risk report to get started</p>
            <Button onClick={() => setIsGenerateOpen(true)}>
              Generate Report
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}