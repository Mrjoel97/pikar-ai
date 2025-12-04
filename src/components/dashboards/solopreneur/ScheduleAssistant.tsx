import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Clock, Sparkles } from "lucide-react";
import { ScheduleAssistant as AIScheduleAssistant } from "@/components/scheduling/ScheduleAssistant";
import { AvailabilityCalendar } from "@/components/scheduling/AvailabilityCalendar";
import type { Id } from "@/convex/_generated/dataModel";

interface ScheduleAssistantWidgetProps {
  businessId: Id<"businesses">;
}

export function ScheduleAssistantWidget({ businessId }: ScheduleAssistantWidgetProps) {
  const [showAssistant, setShowAssistant] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Assistant
          </h3>
          <Sparkles className="h-5 w-5 text-emerald-600" />
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          AI-powered scheduling to optimize your time and find the best meeting slots
        </p>

        <div className="space-y-2">
          <Button
            onClick={() => setShowAssistant(true)}
            className="w-full"
            variant="default"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Find Optimal Meeting Times
          </Button>
          
          <Button
            onClick={() => setShowCalendar(true)}
            className="w-full"
            variant="outline"
          >
            <Clock className="h-4 w-4 mr-2" />
            Manage Availability
          </Button>
        </div>
      </Card>

      <AIScheduleAssistant
        open={showAssistant}
        onOpenChange={setShowAssistant}
        businessId={businessId}
      />

      {showCalendar && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border rounded-lg shadow-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Availability Calendar</h2>
              <Button variant="ghost" onClick={() => setShowCalendar(false)}>
                Close
              </Button>
            </div>
            <AvailabilityCalendar businessId={businessId} />
          </div>
        </div>
      )}
    </>
  );
}