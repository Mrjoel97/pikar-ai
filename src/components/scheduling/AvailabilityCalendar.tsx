import React, { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, RefreshCw, Plus, Switch, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Icons } from "lucide-react";
import { CalendarIntegrationButton } from "@/components/calendar/CalendarIntegrationButton";
import type { Id } from "@/convex/_generated/dataModel";

interface AvailabilityCalendarProps {
  businessId: Id<"businesses">;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"
];

export function AvailabilityCalendar({ businessId }: AvailabilityCalendarProps) {
  const [selectedDay, setSelectedDay] = useState(1);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const weeklyAvailability = useQuery(api.scheduling.availability.getWeeklyAvailability, {
    businessId,
  });
  
  const setAvailability = useMutation(api.scheduling.availability.setAvailability);
  const syncCalendar = useAction(api.calendar.googleCalendar.syncGoogleCalendarEvents);
  const integrations = useQuery(api.calendar.calendarIntegrations.listCalendarIntegrations, {
    businessId,
  });

  const appointments = useQuery(api.scheduling.availability.listAppointments, {
    businessId,
    startDate: Date.now(),
    endDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });

  const handleSync = async () => {
    const googleIntegration = integrations?.find(int => int.provider === "google");
    if (!googleIntegration) {
      toast.error("Google Calendar not connected");
      return;
    }

    setIsSyncing(true);
    try {
      const result = await syncCalendar({
        businessId,
        calendarIntegrationId: googleIntegration._id,
      });
      
      if (result.success) {
        toast.success(`Synced ${result.syncedEvents} events from Google Calendar`);
      } else {
        toast.error("Failed to sync calendar");
      }
    } catch (error) {
      toast.error("Calendar sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleAvailability = async (
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    currentState: boolean
  ) => {
    try {
      await setAvailability({
        businessId,
        dayOfWeek,
        startTime,
        endTime,
        isAvailable: !currentState,
      });
      toast.success("Availability updated");
    } catch (error) {
      toast.error("Failed to update availability");
    }
  };

  const getAvailabilityForSlot = (day: number, time: string) => {
    if (!weeklyAvailability) return false;
    const blocks = weeklyAvailability[day] || [];
    return blocks.some(
      (block: any) => block.startTime === time && block.isAvailable
    );
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
                  onCheckedChange={(checked) => 
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
                      onValueChange={(val) => 
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
                      onValueChange={(val) => 
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
                  {int.provider === "google" && <Icons.google className="h-5 w-5" />}
                  {int.provider === "outlook" && <Icons.microsoft className="h-5 w-5" />}
                  <div>
                    <div className="font-medium capitalize">{int.provider} Calendar</div>
                    <div className="text-sm text-muted-foreground">
                      Last synced: {new Date(int.lastSyncAt || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Settings
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