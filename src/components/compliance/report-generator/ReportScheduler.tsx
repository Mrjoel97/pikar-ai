import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface ReportSchedulerProps {
  templates: any[];
  selectedTemplate: string;
  setSelectedTemplate: (value: string) => void;
  scheduledReports: any[];
  onSchedule: (frequency: "daily" | "weekly" | "monthly", recipients: string[]) => Promise<void>;
  onToggleSchedule: (scheduleId: Id<"scheduledReports">, isActive: boolean) => Promise<void>;
  onDeleteSchedule: (scheduleId: Id<"scheduledReports">) => Promise<void>;
}

export function ReportScheduler({
  templates,
  selectedTemplate,
  setSelectedTemplate,
  scheduledReports,
  onSchedule,
  onToggleSchedule,
  onDeleteSchedule,
}: ReportSchedulerProps) {
  const [scheduleFrequency, setScheduleFrequency] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [scheduleRecipients, setScheduleRecipients] = useState<string>("");
  const [isScheduling, setIsScheduling] = useState(false);

  const handleSchedule = async () => {
    setIsScheduling(true);
    try {
      const recipients = scheduleRecipients.split(",").map((e) => e.trim()).filter(Boolean);
      await onSchedule(scheduleFrequency, recipients);
      setScheduleRecipients("");
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="space-y-6">
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
                  onClick={() => onToggleSchedule(schedule._id, schedule.isActive)}
                >
                  {schedule.isActive ? "Pause" : "Resume"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDeleteSchedule(schedule._id)}
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
    </div>
  );
}
