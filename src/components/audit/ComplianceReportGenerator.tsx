import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ComplianceReportGeneratorProps {
  businessId: Id<"businesses">;
}

export function ComplianceReportGenerator({ businessId }: ComplianceReportGeneratorProps) {
  const [framework, setFramework] = useState<string>("SOC2");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  const templates = useQuery(api.audit.getComplianceReportTemplates);
  const generateReport = useMutation(api.audit.complianceReports.generateComplianceReport);

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select date range");
      return;
    }

    setGenerating(true);
    try {
      const report = await generateReport({
        businessId,
        framework: framework as any,
        startDate: new Date(startDate).getTime(),
        endDate: new Date(endDate).getTime(),
        includeRemediation: true,
      });

      toast.success("Report generated successfully");
      
      // Download as JSON (in production, convert to PDF)
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `compliance-report-${framework}-${Date.now()}.json`;
      a.click();
    } catch (error) {
      toast.error("Failed to generate report");
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Compliance Report Generator
        </CardTitle>
        <CardDescription>
          Generate compliance reports for various regulatory frameworks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="framework">Compliance Framework</Label>
            <Select value={framework} onValueChange={setFramework}>
              <SelectTrigger id="framework">
                <SelectValue placeholder="Select framework" />
              </SelectTrigger>
              <SelectContent>
                {templates?.map((template: any) => (
                  <SelectItem key={template.id} value={template.framework}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {templates && (
              <p className="text-xs text-muted-foreground">
                {templates.find((t: any) => t.framework === framework)?.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Report Sections</Label>
            <div className="flex flex-wrap gap-2">
              {templates
                ?.find((t: any) => t.framework === framework)
                ?.sections.map((section: string) => (
                  <Badge key={section} variant="secondary">
                    {section}
                  </Badge>
                ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleGenerate} disabled={generating} className="flex-1">
            {generating ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate Report
              </>
            )}
          </Button>
          <Button variant="outline" disabled={generating}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Reports include audit trail analysis, compliance scoring, and actionable recommendations
            based on {framework} requirements.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
