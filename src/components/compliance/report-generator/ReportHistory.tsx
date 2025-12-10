import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle2, Download, History, Mail } from "lucide-react";
import { format } from "date-fns";

interface ReportHistoryProps {
  reportHistory: any[];
  onDistribute: (reportId: Id<"generatedReports">, recipients: string[]) => Promise<void>;
}

export function ReportHistory({ reportHistory, onDistribute }: ReportHistoryProps) {
  const [distributionRecipients, setDistributionRecipients] = useState<string>("");
  const [selectedReportForDistribution, setSelectedReportForDistribution] = useState<Id<"generatedReports"> | null>(null);

  const handleDistribute = async () => {
    if (!selectedReportForDistribution || !distributionRecipients) return;
    
    const recipients = distributionRecipients.split(",").map((e) => e.trim()).filter(Boolean);
    await onDistribute(selectedReportForDistribution, recipients);
    setDistributionRecipients("");
    setSelectedReportForDistribution(null);
  };

  return (
    <div className="space-y-4">
      {reportHistory?.map((report: any) => (
        <div key={report._id} className="border rounded-md p-3 space-y-2">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{report.framework}</span>
                <Badge variant="outline">v{report.version || 1}</Badge>
                {report.emailedTo && (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Distributed
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {format(new Date(report.generatedAt), "PPP p")}
              </p>
              {report.changeNotes && (
                <p className="text-sm">{report.changeNotes}</p>
              )}
              {report.emailedTo && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Sent to {report.emailedTo.length} recipient(s)
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedReportForDistribution(report._id)}
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Distribute Report</DialogTitle>
                    <DialogDescription>
                      Send this report to additional recipients
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Recipients (comma-separated emails)</Label>
                      <Input
                        placeholder="email1@example.com, email2@example.com"
                        value={distributionRecipients}
                        onChange={(e) => setDistributionRecipients(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleDistribute} className="w-full">
                      <Mail className="mr-2 h-4 w-4" />
                      Send Report
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="sm" disabled>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
      {(!reportHistory || reportHistory.length === 0) && (
        <div className="text-center py-12 border rounded-md">
          <History className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">No reports generated yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Generate your first compliance report to get started
          </p>
        </div>
      )}
    </div>
  );
}
