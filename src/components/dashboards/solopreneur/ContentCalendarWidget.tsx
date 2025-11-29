import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Mail, Share2 } from "lucide-react";
import { useNavigate } from "react-router";
import { Id } from "@/convex/_generated/dataModel";
import { format, addDays, startOfDay } from "date-fns";

interface ContentCalendarWidgetProps {
  businessId: Id<"businesses"> | null;
  userId: Id<"users"> | null;
}

export function ContentCalendarWidget({ businessId, userId }: ContentCalendarWidgetProps) {
  const navigate = useNavigate();
  
  const startDate = startOfDay(new Date()).getTime();
  const endDate = addDays(startDate, 7).getTime();

  const events = useQuery(
    api.calendar.getContentCalendar,
    businessId && userId ? { businessId, userId, startDate, endDate } : "skip"
  );

  const todayEvents = events?.filter(e => {
    const eventDate = startOfDay(new Date(e.scheduledAt || 0)).getTime();
    return eventDate === startDate;
  }) || [];

  const upcomingEvents = events?.filter(e => {
    const eventDate = startOfDay(new Date(e.scheduledAt || 0)).getTime();
    return eventDate > startDate;
  }) || [];

  const getEventIcon = (type: string) => {
    switch (type) {
      case "email": return <Mail className="h-4 w-4" />;
      case "social": return <Share2 className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "email": return "bg-blue-100 text-blue-700 border-blue-300";
      case "social": return "bg-purple-100 text-purple-700 border-purple-300";
      default: return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">Content Calendar</CardTitle>
        <Button 
          size="sm" 
          onClick={() => navigate("/calendar")}
          className="h-8"
        >
          <Plus className="h-4 w-4 mr-1" />
          Schedule
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Today's Events */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Today</p>
            <Badge variant="outline" className="text-xs">
              {todayEvents.length} scheduled
            </Badge>
          </div>
          {todayEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No content scheduled today</p>
          ) : (
            <div className="space-y-2">
              {todayEvents.slice(0, 3).map((event) => (
                <div 
                  key={event.id}
                  className={`flex items-center gap-2 p-2 rounded-lg border ${getEventColor(event.type)}`}
                >
                  {getEventIcon(event.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{event.title}</p>
                    <p className="text-xs opacity-75">
                      {format(new Date(event.scheduledAt || 0), "h:mm a")}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {event.type}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming This Week */}
        <div className="space-y-2">
          <p className="text-sm font-medium">This Week</p>
          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming content</p>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.slice(0, 3).map((event) => (
                <div 
                  key={event.id}
                  className="flex items-center justify-between p-2 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {getEventIcon(event.type)}
                    <div>
                      <p className="text-sm font-medium truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(event.scheduledAt || 0), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {event.type}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => navigate("/calendar")}
        >
          <Calendar className="h-4 w-4 mr-2" />
          View Full Calendar
        </Button>
      </CardContent>
    </Card>
  );
}
