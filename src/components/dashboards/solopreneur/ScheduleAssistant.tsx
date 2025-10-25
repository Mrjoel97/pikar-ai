import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock } from "lucide-react";

interface ScheduleAssistantProps {
  businessId: Id<"businesses">;
  onShowCalendar: () => void;
}

export function ScheduleAssistant({ businessId, onShowCalendar }: ScheduleAssistantProps) {
  const nextEmailSlot = useQuery(api.schedule.nextSlotByChannel, {
    channel: "email",
    businessId,
  });

  const nextSocialSlot = useQuery(api.schedule.nextSlotByChannel, {
    channel: "social",
    businessId,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Schedule Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {nextEmailSlot && (
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="text-sm font-medium">Next Email Slot</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(nextEmailSlot.scheduledAt).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {nextSocialSlot && (
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="text-sm font-medium">Next Social Slot</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(nextSocialSlot.scheduledAt).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        <Button onClick={onShowCalendar} variant="outline" className="w-full">
          <Calendar className="mr-2 h-4 w-4" />
          View Full Calendar
        </Button>
      </CardContent>
    </Card>
  );
}