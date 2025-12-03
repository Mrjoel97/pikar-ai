import React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function ContentCalendar() {
  const { user, business } = useAuth();
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [viewMode, setViewMode] = React.useState<"month" | "week">("month");

  const getDateRange = () => {
    if (viewMode === "month") {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      return { start, end };
    } else {
      const start = new Date(currentDate);
      start.setDate(currentDate.getDate() - currentDate.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { start, end };
    }
  };

  const { start, end } = getDateRange();

  const events = useQuery(
    api.calendar.getContentCalendar,
    user && business
      ? {
          businessId: (business as any)._id,
          userId: user._id,
          startDate: start.getTime(),
          endDate: end.getTime(),
        }
      : "skip"
  );

  const bulkReschedule = useMutation(api.calendar.bulkReschedule);
  const bulkDelete = useMutation(api.calendar.bulkDelete);

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setDate(currentDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(currentDate.getMonth() + 1);
    } else {
      newDate.setDate(currentDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleEventDrop = async (eventId: string, newDate: Date) => {
    if (!user) return;
    
    try {
      const event = events?.find((e: any) => e.id === eventId);
      if (!event) return;

      const newScheduledAt = new Date(newDate);
      newScheduledAt.setHours(new Date(event.scheduledAt).getHours());
      newScheduledAt.setMinutes(new Date(event.scheduledAt).getMinutes());

      await bulkReschedule({
        events: [
          {
            id: eventId,
            type: event.type,
            newScheduledAt: newScheduledAt.getTime(),
          },
        ],
        userId: user._id,
      });

      toast.success("Event rescheduled successfully");
    } catch (error) {
      toast.error("Failed to reschedule event");
    }
  };

  const handleEventClick = (event: any) => {
    toast.info(`Event: ${event.title}`);
  };

  const formatMonthYear = () => {
    return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  if (!user || !business) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Please sign in to view your content calendar</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-8 w-8" />
            Content Calendar
          </h1>
          <p className="text-muted-foreground">Plan and schedule your content across all channels</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Event
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={handlePrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle>{formatMonthYear()}</CardTitle>
              <Button variant="outline" size="sm" onClick={handleNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleToday}>
                Today
              </Button>
            </div>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "month" | "week")}>
              <TabsList>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {events ? (
            <CalendarGrid
              events={events}
              startDate={start}
              endDate={end}
              onEventClick={handleEventClick}
              onEventDrop={handleEventDrop}
            />
          ) : (
            <div className="flex items-center justify-center p-12">
              <p className="text-muted-foreground">Loading calendar...</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Scheduled this {viewMode}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Social Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events?.filter((e: any) => e.type === "social").length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Ready to publish</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Email Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events?.filter((e: any) => e.type === "email").length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Scheduled to send</p>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}