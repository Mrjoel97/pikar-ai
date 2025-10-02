import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { CalendarIcon, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface ComplianceReportGeneratorProps {
  businessId: Id<"businesses">;
}

export function ComplianceReportGenerator({ businessId }: ComplianceReportGeneratorProps) {
  const templates = useQuery(api.complianceReports.listTemplates);
  const generateReport = useAction(api.complianceReports.generateComplianceReport);

  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ start: Date | undefined; end: Date | undefined }>({
    start: undefined,
    end: undefined,
  });
  const [departments, setDepartments] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const departmentOptions = ["Marketing", "Sales", "Operations", "Finance", "IT", "HR"];

  const handleGenerate = async () => {
    if (!selectedTemplate || !dateRange.start || !dateRange.end) {
      toast.error("Please select a template and date range");
      return;
    }

    setIsGenerating(true);
    try {
      await generateReport({
        businessId,
        templateId: selectedTemplate as Id<"reportTemplates">,
        dateRange: {
          start: dateRange.start.getTime(),
          end: dateRange.end.getTime(),
        },
        departments: departments.length > 0 ? departments : undefined,
      });
      toast.success("Compliance report generated successfully");
    } catch (error) {
      toast.error("Failed to generate report");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!templates) {
    return <div>Loading templates...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Generate Compliance Report
        </CardTitle>
        <CardDescription>
          Create a compliance report for regulatory frameworks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
                  {template.framework} - {template.name}
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

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={handleGenerate} disabled={isGenerating} className="flex-1">
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Report"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}