import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { FileDown, Plus, X, Save, Play } from "lucide-react";
import { exportData, ExportFormat, ExportColumn } from "@/lib/exportUtils";
import { toast } from "sonner";

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  dataSource: string;
  columns: ExportColumn[];
  filters?: any;
}

const AVAILABLE_DATA_SOURCES = [
  { value: "workflows", label: "Workflows" },
  { value: "contacts", label: "Contacts" },
  { value: "campaigns", label: "Email Campaigns" },
  { value: "initiatives", label: "Initiatives" },
  { value: "agents", label: "AI Agents" },
  { value: "audit", label: "Audit Logs" },
];

const COLUMN_PRESETS: Record<string, ExportColumn[]> = {
  workflows: [
    { key: "name", label: "Name" },
    { key: "status", label: "Status" },
    { key: "createdAt", label: "Created" },
  ],
  contacts: [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "status", label: "Status" },
  ],
  campaigns: [
    { key: "subject", label: "Subject" },
    { key: "status", label: "Status" },
    { key: "sentAt", label: "Sent Date" },
  ],
};

export function ReportBuilder() {
  const [reportName, setReportName] = useState("");
  const [dataSource, setDataSource] = useState("");
  const [selectedColumns, setSelectedColumns] = useState<ExportColumn[]>([]);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [savedTemplates, setSavedTemplates] = useState<ReportTemplate[]>([]);

  const handleAddColumn = () => {
    setSelectedColumns([
      ...selectedColumns,
      { key: "", label: "" },
    ]);
  };

  const handleRemoveColumn = (index: number) => {
    setSelectedColumns(selectedColumns.filter((_, i) => i !== index));
  };

  const handleColumnChange = (index: number, field: "key" | "label", value: string) => {
    const updated = [...selectedColumns];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedColumns(updated);
  };

  const handleLoadPreset = (source: string) => {
    const preset = COLUMN_PRESETS[source];
    if (preset) {
      setSelectedColumns(preset);
      toast.success("Preset columns loaded");
    }
  };

  const handleSaveTemplate = () => {
    if (!reportName || !dataSource || selectedColumns.length === 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    const template: ReportTemplate = {
      id: Date.now().toString(),
      name: reportName,
      description: `${dataSource} report`,
      dataSource,
      columns: selectedColumns,
    };

    setSavedTemplates([...savedTemplates, template]);
    toast.success("Report template saved");
  };

  const handleRunReport = () => {
    if (!dataSource || selectedColumns.length === 0) {
      toast.error("Please configure report settings");
      return;
    }

    // Mock data for demonstration
    const mockData = Array.from({ length: 10 }, (_, i) => {
      const row: any = {};
      selectedColumns.forEach(col => {
        row[col.key] = `Sample ${col.label} ${i + 1}`;
      });
      return row;
    });

    exportData({
      filename: reportName || `${dataSource}_report`,
      format: exportFormat,
      columns: selectedColumns,
      data: mockData,
      title: reportName || "Custom Report",
      subtitle: `Data Source: ${dataSource}`,
    });
  };

  const handleLoadTemplate = (template: ReportTemplate) => {
    setReportName(template.name);
    setDataSource(template.dataSource);
    setSelectedColumns(template.columns);
    toast.success("Template loaded");
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h2 className="text-2xl font-semibold">Custom Report Builder</h2>
        <p className="text-sm text-muted-foreground">Create and export custom reports</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Configuration</CardTitle>
              <CardDescription>Define your report settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Report Name</Label>
                <Input
                  placeholder="e.g., Monthly Workflows Report"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                />
              </div>

              <div>
                <Label>Data Source</Label>
                <Select value={dataSource} onValueChange={setDataSource}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select data source" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_DATA_SOURCES.map((source) => (
                      <SelectItem key={source.value} value={source.value}>
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {dataSource && COLUMN_PRESETS[dataSource] && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLoadPreset(dataSource)}
                >
                  Load Preset Columns
                </Button>
              )}

              <div>
                <Label>Export Format</Label>
                <Select value={exportFormat} onValueChange={(v: any) => setExportFormat(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Columns</CardTitle>
                  <CardDescription>Select columns to include</CardDescription>
                </div>
                <Button size="sm" onClick={handleAddColumn}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Column
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {selectedColumns.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No columns added yet. Click "Add Column" to start.
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedColumns.map((col, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Field key"
                          value={col.key}
                          onChange={(e) => handleColumnChange(index, "key", e.target.value)}
                        />
                        <Input
                          placeholder="Display label"
                          value={col.label}
                          onChange={(e) => handleColumnChange(index, "label", e.target.value)}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveColumn(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleRunReport}>
              <Play className="h-4 w-4 mr-2" />
              Run Report
            </Button>
            <Button variant="outline" onClick={handleSaveTemplate}>
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
          </div>
        </div>

        {/* Saved Templates */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Saved Templates</CardTitle>
              <CardDescription>Quick access to saved reports</CardDescription>
            </CardHeader>
            <CardContent>
              {savedTemplates.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No saved templates yet
                </p>
              ) : (
                <div className="space-y-2">
                  {savedTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => handleLoadTemplate(template)}
                    >
                      <div className="font-medium text-sm">{template.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {template.dataSource} • {template.columns.length} columns
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
