import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, ChevronLeft, ChevronRight, Mail, MessageSquare, Clock, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";

interface ContentCalendarProps {
  businessId: string;
  userId: string;
}

export function ContentCalendar({ businessId, userId }: ContentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const startDate = useMemo(() => {
    if (view === "month") {
      return startOfWeek(startOfMonth(currentDate)).getTime();
    } else if (view === "week") {
      return startOfWeek(currentDate).getTime();
    } else {
      return new Date(currentDate.setHours(0, 0, 0, 0)).getTime();
    }
  }, [currentDate, view]);

  const endDate = useMemo(() => {
    if (view === "month") {
      return endOfWeek(endOfMonth(currentDate)).getTime();
    } else if (view === "week") {
      return endOfWeek(currentDate).getTime();
    } else {
      return new Date(currentDate.setHours(23, 59, 59, 999)).getTime();
    }
  }, [currentDate, view]);

  const events = useQuery(api.calendar.getContentCalendar, 
    businessId && userId
      ? {
          businessId: businessId as any,
          userId: userId as any,
          startDate,
          endDate,
        }
      : "skip"
  );

  const bulkDelete = useMutation(api.calendar.bulkDelete);

  const days = useMemo(() => {
    return eachDayOfInterval({ start: new Date(startDate), end: new Date(endDate) });
  }, [startDate, endDate]);

  const getEventsForDay = (day: Date) => {
    if (!events) return [];
    return events.filter((event: any) => isSameDay(new Date(event.scheduledAt), day));
  };

  const handlePrevious = () => {
    if (view === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (view === "week") {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000));
    }
  };

  const handleNext = () => {
    if (view === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (view === "week") {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
    }
  };

  const handleDeleteEvent = async (event: any) => {
    try {
      await bulkDelete({
        events: [{ id: event.id, type: event.type }],
        userId: userId as any,
      });
      toast.success("Event deleted successfully");
      setSelectedEvent(null);
    } catch (error) {
      toast.error("Failed to delete event");
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="h-3 w-3" />;
      case "social":
        return <MessageSquare className="h-3 w-3" />;
      case "schedule":
        return <Clock className="h-3 w-3" />;
      default:
        return <Calendar className="h-3 w-3" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "email":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "social":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "schedule":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Content Calendar
            </CardTitle>
            <CardDescription>
              View and manage all your scheduled content in one place
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={view === "month" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("month")}
              >
                Month
              </Button>
              <Button
                variant={view === "week" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("week")}
              >
                Week
              </Button>
              <Button
                variant={view === "day" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("day")}
              >
                Day
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={handlePrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold">
              {format(currentDate, view === "month" ? "MMMM yyyy" : view === "week" ? "'Week of' MMM d, yyyy" : "MMMM d, yyyy")}
            </h3>
            <Button variant="outline" size="sm" onClick={handleNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                {day}
              </div>
            ))}
            {days.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-24 border rounded-lg p-2 ${
                    isToday ? "bg-emerald-50 border-emerald-300" : "bg-white"
                  }`}
                >
                  <div className="text-sm font-medium mb-1">{format(day, "d")}</div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event: any) => (
                      <button
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className={`w-full text-left text-xs p-1 rounded border ${getEventColor(
                          event.type
                        )} hover:opacity-80 transition-opacity`}
                      >
                        <div className="flex items-center gap-1">
                          {getEventIcon(event.type)}
                          <span className="truncate">{event.title}</span>
                        </div>
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 pt-4 border-t">
            <span className="text-sm font-medium">Legend:</span>
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
              <Mail className="h-3 w-3 mr-1" />
              Email
            </Badge>
            <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
              <MessageSquare className="h-3 w-3 mr-1" />
              Social
            </Badge>
            <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">
              <Clock className="h-3 w-3 mr-1" />
              Schedule
            </Badge>
          </div>
        </div>
      </CardContent>

      {/* Event Details Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEvent && getEventIcon(selectedEvent.type)}
              Event Details
            </DialogTitle>
            <DialogDescription>
              {selectedEvent && format(new Date(selectedEvent.scheduledAt), "PPpp")}
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">Title</h4>
                <p className="text-sm text-muted-foreground">{selectedEvent.title}</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Type</h4>
                <Badge variant="outline" className={getEventColor(selectedEvent.type)}>
                  {selectedEvent.type}
                </Badge>
              </div>
              {selectedEvent.type === "social" && selectedEvent.platforms && (
                <div>
                  <h4 className="font-medium mb-1">Platforms</h4>
                  <div className="flex gap-2">
                    {selectedEvent.platforms.map((platform: string) => (
                      <Badge key={platform} variant="secondary">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {selectedEvent.status && (
                <div>
                  <h4 className="font-medium mb-1">Status</h4>
                  <Badge variant="outline">{selectedEvent.status}</Badge>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteEvent(selectedEvent)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}