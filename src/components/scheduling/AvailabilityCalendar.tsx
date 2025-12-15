import React, { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Calendar, Clock, RefreshCw, Plus } from "lucide-react";
import { CalendarIntegrationButton } from "@/components/calendar/CalendarIntegrationButton";
import type { Id } from "@/convex/_generated/dataModel";

interface AvailabilityCalendarProps {
  businessId: Id<"businesses">;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOURS = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"
];

interface DayAvailability {
  enabled: boolean;
  start: string;
  end: string;
}

type WeeklyAvailability = Record<string, DayAvailability>;

export function AvailabilityCalendar({ businessId }: AvailabilityCalendarProps) {
  const [availability, setAvailability] = useState<WeeklyAvailability>({
    Monday: { enabled: true, start: "09:00", end: "17:00" },
    Tuesday: { enabled: true, start: "09:00", end: "17:00" },
    Wednesday: { enabled: true, start: "09:00", end: "17:00" },
    Thursday: { enabled: true, start: "09:00", end: "17:00" },
    Friday: { enabled: true, start: "09:00", end: "17:00" },
    Saturday: { enabled: false, start: "09:00", end: "17:00" },
    Sunday: { enabled: false, start: "09:00", end: "17:00" },
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const weeklyAvailability = useQuery(api.scheduling.availability.getWeeklyAvailability, {
    businessId,
  });
  
  const setAvailabilityMutation = useMutation(api.scheduling.availability.setAvailability);
  const syncGoogleEvents = useAction(api.calendar.googleCalendar.syncGoogleEvents);
  const integrations = useQuery(api.calendar.calendarIntegrations.listIntegrations, 
    businessId ? { businessId } : "skip"
  );

  const appointments = useQuery(api.scheduling.availability.listAppointments, {
    businessId,
    startDate: Date.now(),
    endDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });

  const handleSync = async () => {
    const googleIntegration = integrations?.find((int: any) => int.provider === "google");
    if (!googleIntegration) {
      toast.error("Google Calendar not connected");
      return;
    }

    setIsSyncing(true);
    try {
      const result = await syncGoogleEvents({
        integrationId: googleIntegration._id,
      });
      
      if (result.success) {
        toast.success(`Synced ${result.eventCount} events from Google Calendar`);
      } else {
        toast.error("Failed to sync calendar");
      }
    } catch (error) {
      toast.error("Calendar sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save each day's availability
      for (const [day, config] of Object.entries(availability)) {
        const dayIndex = DAYS.indexOf(day);
        if (dayIndex !== -1 && config.enabled) {
          await setAvailabilityMutation({
            businessId,
            dayOfWeek: dayIndex,
            startTime: config.start,
            endTime: config.end,
            isAvailable: true,
          });
        }
      }
      toast.success("Availability saved successfully");
    } catch (error) {
      toast.error("Failed to save availability");
    } finally {
      setIsSaving(false);
    }
  };

  const upcomingAppointments = appointments?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Availability</h2>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
          <CardDescription>
            Set your standard weekly availability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {DAYS.map((day) => (
              <div key={day} className="flex items-center gap-4">
                <div className="w-32 font-medium">{day}</div>
                <Switch
                  checked={availability[day]?.enabled}
                  onCheckedChange={(checked: boolean) => 
                    setAvailability(prev => ({
                      ...prev,
                      [day]: { ...prev[day], enabled: checked }
                    }))
                  }
                />
                {availability[day]?.enabled && (
                  <div className="flex items-center gap-2">
                    <Select
                      value={availability[day]?.start}
                      onValueChange={(val: string) => 
                        setAvailability(prev => ({
                          ...prev,
                          [day]: { ...prev[day], start: val }
                        }))
                      }
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HOURS.map(h => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span>to</span>
                    <Select
                      value={availability[day]?.end}
                      onValueChange={(val: string) => 
                        setAvailability(prev => ({
                          ...prev,
                          [day]: { ...prev[day], end: val }
                        }))
                      }
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HOURS.map(h => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Calendar Integrations</CardTitle>
          <CardDescription>
            Sync with your external calendars to prevent double booking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {integrations?.map((int: any) => (
              <div key={int._id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5" />
                  <div>
                    <div className="font-medium capitalize">{int.provider} Calendar</div>
                    <div className="text-sm text-muted-foreground">
                      Last synced: {new Date(int.lastSyncAt || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing}>
                  {isSyncing ? "Syncing..." : "Sync Now"}
                </Button>
              </div>
            ))}
            <Button className="w-full" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add Calendar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}