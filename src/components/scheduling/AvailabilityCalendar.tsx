import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, Plus, Trash2 } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface AvailabilityCalendarProps {
  businessId: Id<"businesses">;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"
];

export function AvailabilityCalendar({ businessId }: AvailabilityCalendarProps) {
  const [selectedDay, setSelectedDay] = useState(1); // Monday
  const weeklyAvailability = useQuery(api.scheduling.availability.getWeeklyAvailability, {
    businessId,
  });
  const setAvailability = useMutation(api.scheduling.availability.setAvailability);

  const appointments = useQuery(api.scheduling.availability.listAppointments, {
    businessId,
    startDate: Date.now(),
    endDate: Date.now() + 7 * 24 * 60 * 60 * 1000, // next 7 days
  });

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
      {/* Weekly Availability Grid */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Availability
          </h3>
          <Badge variant="outline">Set your regular hours</Badge>
        </div>

        <div className="grid grid-cols-8 gap-2">
          {/* Header row */}
          <div className="font-medium text-sm">Time</div>
          {DAYS.map((day, idx) => (
            <div key={day} className="font-medium text-sm text-center">
              {day.slice(0, 3)}
            </div>
          ))}

          {/* Time slots */}
          {TIME_SLOTS.map((time) => (
            <React.Fragment key={time}>
              <div className="text-sm text-muted-foreground py-2">{time}</div>
              {DAYS.map((_, dayIdx) => {
                const isAvailable = getAvailabilityForSlot(dayIdx, time);
                const nextTime = TIME_SLOTS[TIME_SLOTS.indexOf(time) + 1] || "18:00";
                
                return (
                  <button
                    key={`${dayIdx}-${time}`}
                    onClick={() =>
                      handleToggleAvailability(dayIdx, time, nextTime, isAvailable)
                    }
                    className={`
                      p-2 rounded border transition-colors
                      ${isAvailable
                        ? "bg-emerald-100 dark:bg-emerald-900 border-emerald-300 dark:border-emerald-700"
                        : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      }
                      hover:opacity-80
                    `}
                  >
                    {isAvailable ? "✓" : ""}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          Click on time slots to toggle availability. Green = available for meetings.
        </p>
      </Card>

      {/* Upcoming Appointments */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Upcoming Appointments
          </h3>
          <Badge>{appointments?.length || 0} scheduled</Badge>
        </div>

        {upcomingAppointments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No upcoming appointments</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingAppointments.map((apt: any) => (
              <div
                key={apt._id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium">{apt.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(apt.startTime).toLocaleString()}
                  </div>
                  {apt.location && (
                    <div className="text-xs text-muted-foreground mt-1">
                      📍 {apt.location}
                    </div>
                  )}
                </div>
                <Badge variant={apt.status === "scheduled" ? "default" : "secondary"}>
                  {apt.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
