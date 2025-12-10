import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CalendarIcon, FileText, Loader2, Paperclip, Plus } from "lucide-react";
import { format } from "date-fns";

interface ReportGenerationFormProps {
  templates: any[];
  selectedTemplate: string;
  setSelectedTemplate: (value: string) => void;
  dateRange: { start: Date | undefined; end: Date | undefined };
  setDateRange: (range: { start: Date | undefined; end: Date | undefined }) => void;
  departments: string[];
  setDepartments: (deps: string[]) => void;
  changeNotes: string;
  setChangeNotes: (notes: string) => void;
  evidenceFiles: Id<"_storage">[];
  isGenerating: boolean;
  generationProgress: number;
  onGenerate: () => void;
}

const departmentOptions = ["Marketing", "Sales", "Operations", "Finance", "IT", "HR"];

export function ReportGenerationForm({
  templates,
  selectedTemplate,
  setSelectedTemplate,
  dateRange,
  setDateRange,
  departments,
  setDepartments,
  changeNotes,
  setChangeNotes,
  evidenceFiles,
  isGenerating,
  generationProgress,
  onGenerate,
}: ReportGenerationFormProps) {
  return (
    <div className="space-y-6">
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
      <Button onClick={onGenerate} disabled={isGenerating} className="w-full">
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
  );
}
