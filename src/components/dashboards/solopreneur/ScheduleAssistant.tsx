import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Sparkles, Link as LinkIcon, Video } from "lucide-react";
import { ScheduleAssistant as AIScheduleAssistant } from "@/components/scheduling/ScheduleAssistant";
import { AvailabilityCalendar } from "@/components/scheduling/AvailabilityCalendar";
import { CalendarIntegrationButton } from "@/components/scheduling/CalendarIntegrationButton";
import type { Id } from "@/convex/_generated/dataModel";

interface ScheduleAssistantWidgetProps {
  businessId: Id<"businesses">;
}

interface Appointment {
  _id: Id<"appointments">;
  startTime: number;
  title: string;
  type: string;
}

export function ScheduleAssistant({ businessId }: ScheduleAssistantWidgetProps) {
  const [showAssistant, setShowAssistant] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const integrations = useQuery(api.calendar.calendarIntegrations.listIntegrations, { businessId });

  const googleConnected = integrations?.some((i: any) => i.provider === "google" && i.isActive) || false;
  const outlookConnected = integrations?.some((i: any) => i.provider === "outlook" && i.isActive) || false;

  const now = Date.now();
  const weekFromNow = now + 7 * 24 * 60 * 60 * 1000;
  const appointments = useQuery(api.scheduling.availability.listAppointments, {
    businessId,
    startDate: now,
    endDate: weekFromNow,
  });

  const getNextMeeting = () => {
    if (!appointments) return undefined;
    return appointments
      .filter((i: Appointment) => i.startTime > now)
      .sort((a: Appointment, b: Appointment) => a.startTime - b.startTime)[0];
  };

  const nextMeeting = getNextMeeting();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Schedule Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {nextMeeting ? (
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-medium">{nextMeeting.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {new Date(nextMeeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <Badge>{nextMeeting.type}</Badge>
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" className="w-full" variant="outline">
                Reschedule
              </Button>
              <Button size="sm" className="w-full">
                Join
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No upcoming meetings
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="justify-start">
              <Clock className="mr-2 h-4 w-4" />
              Block Time
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              <Video className="mr-2 h-4 w-4" />
              New Meeting
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium">Today's Overview</h4>
            <span className="text-xs text-muted-foreground">
              {appointments?.filter((i: Appointment) => {
                const today = new Date();
                const date = new Date(i.startTime);
                return date.getDate() === today.getDate() &&
                  date.getMonth() === today.getMonth() &&
                  date.getFullYear() === today.getFullYear();
              }).length || 0} meetings
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}