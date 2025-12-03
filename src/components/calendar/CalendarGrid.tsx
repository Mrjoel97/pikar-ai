import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Mail, Share2, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface CalendarEvent {
  id: string;
  type: "schedule" | "social" | "email";
  title: string;
  scheduledAt: number;
  status: string;
  platforms?: string[];
  channel?: string;
}

interface CalendarGridProps {
  events: CalendarEvent[];
  startDate: Date;
  endDate: Date;
  onEventClick: (event: CalendarEvent) => void;
  onEventDrop: (eventId: string, newDate: Date) => void;
}

export default function CalendarGrid({ events, startDate, endDate, onEventClick, onEventDrop }: CalendarGridProps) {
  const [draggedEvent, setDraggedEvent] = React.useState<CalendarEvent | null>(null);

  const getDaysInRange = () => {
    const days: Date[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const getEventsForDay = (day: Date) => {
    const dayStart = new Date(day).setHours(0, 0, 0, 0);
    const dayEnd = new Date(day).setHours(23, 59, 59, 999);
    return events.filter((e) => e.scheduledAt >= dayStart && e.scheduledAt <= dayEnd);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="h-3 w-3" />;
      case "social":
        return <Share2 className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "email":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "social":
        return "bg-green-100 text-green-700 border-green-300";
      default:
        return "bg-purple-100 text-purple-700 border-purple-300";
    }
  };

  const handleDragStart = (event: CalendarEvent) => {
    setDraggedEvent(event);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (day: Date) => {
    if (draggedEvent) {
      onEventDrop(draggedEvent.id, day);
      setDraggedEvent(null);
    }
  };

  const days = getDaysInRange();

  return (
    <div className="grid grid-cols-7 gap-2">
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
        <div key={day} className="text-center font-semibold text-sm p-2 bg-muted rounded">
          {day}
        </div>
      ))}
      
      {days.map((day, index) => {
        const dayEvents = getEventsForDay(day);
        const isToday = new Date().toDateString() === day.toDateString();
        
        return (
          <Card
            key={index}
            className={`min-h-[120px] p-2 ${isToday ? "ring-2 ring-primary" : ""}`}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(day)}
          >
            <div className="text-sm font-medium mb-2">
              {day.getDate()}
            </div>
            <div className="space-y-1">
              {dayEvents.map((event) => (
                <motion.div
                  key={event.id}
                  draggable
                  onDragStart={() => handleDragStart(event)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`w-full justify-start text-xs p-1 h-auto ${getEventColor(event.type)}`}
                    onClick={() => onEventClick(event)}
                  >
                    <div className="flex items-center gap-1 truncate">
                      {getEventIcon(event.type)}
                      <span className="truncate">{event.title}</span>
                    </div>
                  </Button>
                </motion.div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
