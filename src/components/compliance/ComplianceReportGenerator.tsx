import { useState } from "react";
import { useAction, useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import { ReportGenerationForm } from "./report-generator/ReportGenerationForm";
import { ReportScheduler } from "./report-generator/ReportScheduler";
import { ReportHistory } from "./report-generator/ReportHistory";

interface ComplianceReportGeneratorProps {
  businessId: Id<"businesses">;
}

export function ComplianceReportGenerator({ businessId }: ComplianceReportGeneratorProps) {
  const templates = useQuery(api.complianceReports.listTemplates);
  const scheduledReports = useQuery(api.complianceReports.getScheduledReports, { businessId });
  const reportHistory = useQuery(api.complianceReports.getReportHistory, { businessId, limit: 20 });
  
  const generateReport = useAction(api.complianceReports.generateComplianceReport);
  const scheduleReport = useMutation(api.complianceReports.scheduleReport);
  const updateSchedule = useMutation(api.complianceReports.updateScheduledReport);
  const deleteSchedule = useMutation(api.complianceReports.deleteScheduledReport);
  const distributeReport = useAction(api.complianceReports.distributeReport);

  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ start: Date | undefined; end: Date | undefined }>({
    start: undefined,
    end: undefined,
  });
  const [departments, setDepartments] = useState<string[]>([]);
  const [changeNotes, setChangeNotes] = useState<string>("");
  const [evidenceFiles, setEvidenceFiles] = useState<Id<"_storage">[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  const handleGenerate = async () => {
    if (!selectedTemplate || !dateRange.start || !dateRange.end) {
      toast.error("Please select a template and date range");
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    
    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => Math.min(prev + 10, 90));
    }, 300);

    try {
      const result = await generateReport({
        businessId,
        templateId: selectedTemplate as Id<"reportTemplates">,
        dateRange: {
          start: dateRange.start.getTime(),
          end: dateRange.end.getTime(),
        },
        departments: departments.length > 0 ? departments : undefined,
        evidenceIds: evidenceFiles.length > 0 ? evidenceFiles : undefined,
        changeNotes: changeNotes || undefined,
      });
      
      setGenerationProgress(100);
      toast.success("Compliance report generated successfully", {
        description: `Report ID: ${result.reportId}`,
      });
      setChangeNotes("");
      setEvidenceFiles([]);
    } catch (error) {
      toast.error("Failed to generate report");
      console.error(error);
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setIsGenerating(false);
        setGenerationProgress(0);
      }, 500);
    }
  };

  const handleSchedule = async (frequency: "daily" | "weekly" | "monthly", recipients: string[]) => {
    if (!selectedTemplate || recipients.length === 0) {
      toast.error("Please select a template and add recipients");
      return;
    }

    await scheduleReport({
      businessId,
      templateId: selectedTemplate as Id<"reportTemplates">,
      frequency,
      recipients,
      isActive: true,
    });
    
    toast.success(`Report scheduled ${frequency}`, {
      description: `${recipients.length} recipient(s) will receive reports`,
    });
  };

  const handleToggleSchedule = async (scheduleId: Id<"scheduledReports">, isActive: boolean) => {
    try {
      await updateSchedule({ scheduleId, isActive: !isActive });
      toast.success(isActive ? "Schedule paused" : "Schedule activated");
    } catch (error) {
      toast.error("Failed to update schedule");
    }
  };

  const handleDeleteSchedule = async (scheduleId: Id<"scheduledReports">) => {
    try {
      await deleteSchedule({ scheduleId });
      toast.success("Schedule deleted");
    } catch (error) {
      toast.error("Failed to delete schedule");
    }
  };

  const handleDistribute = async (reportId: Id<"generatedReports">, recipients: string[]) => {
    try {
      await distributeReport({ reportId, recipients });
      toast.success(`Report distributed to ${recipients.length} recipient(s)`);
    } catch (error) {
      toast.error("Failed to distribute report");
      console.error(error);
    }
  };

  if (!templates) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const totalReports = reportHistory?.length || 0;
  const reportsThisMonth = reportHistory?.filter((r: any) => {
    const reportDate = new Date(r.generatedAt);
    const now = new Date();
    return reportDate.getMonth() === now.getMonth() && reportDate.getFullYear() === now.getFullYear();
  }).length || 0;
  const activeSchedules = scheduledReports?.filter((s: any) => s.isActive).length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Compliance Report Generator
            </CardTitle>
            <CardDescription>
              Generate, schedule, and distribute compliance reports for regulatory frameworks
            </CardDescription>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{totalReports}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{reportsThisMonth}</div>
              <div className="text-xs text-muted-foreground">This Month</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{activeSchedules}</div>
              <div className="text-xs text-muted-foreground">Scheduled</div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="generate">
            <ReportGenerationForm
              templates={templates}
              selectedTemplate={selectedTemplate}
              setSelectedTemplate={setSelectedTemplate}
              dateRange={dateRange}
              setDateRange={setDateRange}
              departments={departments}
              setDepartments={setDepartments}
              changeNotes={changeNotes}
              setChangeNotes={setChangeNotes}
              evidenceFiles={evidenceFiles}
              isGenerating={isGenerating}
              generationProgress={generationProgress}
              onGenerate={handleGenerate}
            />
          </TabsContent>

          <TabsContent value="schedule">
            <ReportScheduler
              templates={templates}
              selectedTemplate={selectedTemplate}
              setSelectedTemplate={setSelectedTemplate}
              scheduledReports={scheduledReports || []}
              onSchedule={handleSchedule}
              onToggleSchedule={handleToggleSchedule}
              onDeleteSchedule={handleDeleteSchedule}
            />
          </TabsContent>

          <TabsContent value="history">
            <ReportHistory
              reportHistory={reportHistory || []}
              onDistribute={handleDistribute}
            />
          </TabsContent>

          <TabsContent value="templates" className="space-y-2">
            {templates.map((template: any) => (
              <div key={template._id} className="border rounded-md p-3 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{template.name}</span>
                    <Badge>{template.framework}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {template.sections?.length || 0} section(s)
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTemplate(template._id)}
                >
                  Use Template
                </Button>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}