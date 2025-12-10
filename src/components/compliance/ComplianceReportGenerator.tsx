import { useState } from "react";
import { useAction, useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { CalendarIcon, FileText, Loader2, Clock, Mail, Paperclip, History, Plus, Trash2, Download, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";
import { format } from "date-fns";

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

  // Scheduling state
  const [scheduleFrequency, setScheduleFrequency] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [scheduleRecipients, setScheduleRecipients] = useState<string>("");
  const [isScheduling, setIsScheduling] = useState(false);

  // Distribution state
  const [distributionRecipients, setDistributionRecipients] = useState<string>("");
  const [selectedReportForDistribution, setSelectedReportForDistribution] = useState<Id<"generatedReports"> | null>(null);

  const departmentOptions = ["Marketing", "Sales", "Operations", "Finance", "IT", "HR"];

  const handleGenerate = async () => {
    if (!selectedTemplate || !dateRange.start || !dateRange.end) {
      toast.error("Please select a template and date range");
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    
    // Simulate progress
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

  const handleSchedule = async () => {
    if (!selectedTemplate || !scheduleRecipients) {
      toast.error("Please select a template and add recipients");
      return;
    }

    setIsScheduling(true);
    try {
      const recipients = scheduleRecipients.split(",").map((e) => e.trim()).filter(Boolean);
      
      await scheduleReport({
        businessId,
        templateId: selectedTemplate as Id<"reportTemplates">,
        frequency: scheduleFrequency,
        recipients,
        isActive: true,
      });
      
      toast.success(`Report scheduled ${scheduleFrequency}`, {
        description: `${recipients.length} recipient(s) will receive reports`,
      });
      setScheduleRecipients("");
    } catch (error) {
      toast.error("Failed to schedule report");
      console.error(error);
    } finally {
      setIsScheduling(false);
    }
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

  const handleDistribute = async () => {
    if (!selectedReportForDistribution || !distributionRecipients) {
      toast.error("Please select a report and add recipients");
      return;
    }

    try {
      const recipients = distributionRecipients.split(",").map((e) => e.trim()).filter(Boolean);
      
      await distributeReport({
        reportId: selectedReportForDistribution,
        recipients,
      });
      
      toast.success(`Report distributed to ${recipients.length} recipient(s)`);
      setDistributionRecipients("");
      setSelectedReportForDistribution(null);
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

  // Calculate report statistics
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
          <div className="flex gap-2">
            <div className="text-center">
              <div className="text-2xl font-bold">{totalReports}</div>
              <div className="text-xs text-muted-foreground">Total Reports</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{reportsThisMonth}</div>
              <div className="text-xs text-muted-foreground">This Month</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{activeSchedules}</div>
              <div className="text-xs text-muted-foreground">Active Schedules</div>
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

          {/* Generate Tab */}
          <TabsContent value="generate" className="space-y-6">
            {/* Framework Selection */}
            <div className="space-y-2">
              <Label>Compliance Framework</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select framework" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template: any) => (
                    <SelectItem key={template._id} value={template._id}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{template.framework}</Badge>
                        {template.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.start ? format(dateRange.start, "PPP") : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.start}
                      onSelect={(date) => setDateRange({ ...dateRange, start: date })}
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.end ? format(dateRange.end, "PPP") : "End date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.end}
                      onSelect={(date) => setDateRange({ ...dateRange, end: date })}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Departments */}
            <div className="space-y-2">
              <Label>Departments (Optional)</Label>
              <div className="grid grid-cols-2 gap-2">
                {departmentOptions.map((dept) => (
                  <div key={dept} className="flex items-center space-x-2">
                    <Checkbox
                      id={dept}
                      checked={departments.includes(dept)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setDepartments([...departments, dept]);
                        } else {
                          setDepartments(departments.filter((d) => d !== dept));
                        }
                      }}
                    />
                    <label htmlFor={dept} className="text-sm cursor-pointer">
                      {dept}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Evidence Attachments */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Evidence Attachments
              </Label>
              <div className="border rounded-md p-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  {evidenceFiles.length} file(s) attached
                </p>
                <Button variant="outline" size="sm" disabled>
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Evidence
                </Button>
              </div>
            </div>

            {/* Version Notes */}
            <div className="space-y-2">
              <Label>Version Notes (Optional)</Label>
              <textarea
                className="w-full min-h-[80px] px-3 py-2 text-sm border rounded-md"
                placeholder="Describe what's new or changed in this report version..."
                value={changeNotes}
                onChange={(e) => setChangeNotes(e.target.value)}
              />
            </div>

            {/* Generation Progress */}
            {isGenerating && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Generating report...</span>
                  <span className="font-medium">{generationProgress}%</span>
                </div>
                <Progress value={generationProgress} />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={handleGenerate} disabled={isGenerating} className="flex-1">
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Template</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template: any) => (
                      <SelectItem key={template._id} value={template._id}>
                        {template.framework} - {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={scheduleFrequency} onValueChange={(v: any) => setScheduleFrequency(v)}>
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

              <div className="space-y-2">
                <Label>Recipients (comma-separated emails)</Label>
                <Input
                  placeholder="email1@example.com, email2@example.com"
                  value={scheduleRecipients}
                  onChange={(e) => setScheduleRecipients(e.target.value)}
                />
              </div>

              <Button onClick={handleSchedule} disabled={isScheduling} className="w-full">
                {isScheduling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    Schedule Report
                  </>
                )}
              </Button>
            </div>

            {/* Active Schedules */}
            <div className="space-y-2">
              <Label>Active Schedules</Label>
              <div className="space-y-2">
                {scheduledReports?.map((schedule: any) => (
                  <div key={schedule._id} className="border rounded-md p-3 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{schedule.framework}</span>
                        <Badge variant={schedule.isActive ? "default" : "secondary"}>
                          {schedule.isActive ? "Active" : "Paused"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {schedule.frequency} • {schedule.recipients.length} recipient(s)
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Next run: {schedule.nextRunAt ? format(new Date(schedule.nextRunAt), "PPP p") : "N/A"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleSchedule(schedule._id, schedule.isActive)}
                      >
                        {schedule.isActive ? "Pause" : "Resume"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteSchedule(schedule._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {(!scheduledReports || scheduledReports.length === 0) && (
                  <div className="text-center py-8 border rounded-md">
                    <Clock className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground">No scheduled reports yet</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <div className="space-y-2">
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
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <div className="space-y-2">
              {templates.map((template: any) => (
                <div key={template._id} className="border rounded-md p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
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
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}