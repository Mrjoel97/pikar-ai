import * as React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, ChevronLeft, ChevronRight, Clock, Sparkles, Trash2, Edit, CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { Id } from "@/convex/_generated/dataModel";

interface PostSchedulerProps {
  businessId: Id<"businesses">;
  userId: Id<"users">;
  onEditPost?: (postId: Id<"socialPosts">) => void;
}

// Time zone options
const TIME_ZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
];

// Optimal posting times by platform (based on industry research)
const OPTIMAL_TIMES = {
  twitter: [
    { hour: 9, label: "9:00 AM - Morning engagement" },
    { hour: 12, label: "12:00 PM - Lunch break" },
    { hour: 17, label: "5:00 PM - Evening commute" },
  ],
  linkedin: [
    { hour: 8, label: "8:00 AM - Start of workday" },
    { hour: 12, label: "12:00 PM - Lunch break" },
    { hour: 17, label: "5:00 PM - End of workday" },
  ],
  facebook: [
    { hour: 13, label: "1:00 PM - Afternoon peak" },
    { hour: 15, label: "3:00 PM - Mid-afternoon" },
    { hour: 19, label: "7:00 PM - Evening peak" },
  ],
};

export function PostScheduler({ businessId, userId, onEditPost }: PostSchedulerProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedTimeZone, setSelectedTimeZone] = React.useState("America/New_York");
  const [selectedPost, setSelectedPost] = React.useState<any>(null);
  const [showBulkScheduler, setShowBulkScheduler] = React.useState(false);
  const [showOptimalTimes, setShowOptimalTimes] = React.useState(false);
  const [draggedPost, setDraggedPost] = React.useState<any>(null);

  const startDate = React.useMemo(() => {
    return startOfWeek(startOfMonth(currentDate)).getTime();
  }, [currentDate]);

  const endDate = React.useMemo(() => {
    return endOfWeek(endOfMonth(currentDate)).getTime();
  }, [currentDate]);

  const scheduledPosts = useQuery(
    api.socialPosts.listScheduledPosts,
    businessId ? { businessId, status: "scheduled" } : "skip"
  );

  const updatePost = useMutation(api.socialPosts.updateSocialPost);
  const deletePost = useMutation(api.socialPosts.deleteSocialPost);

  const days = React.useMemo(() => {
    return eachDayOfInterval({ start: new Date(startDate), end: new Date(endDate) });
  }, [startDate, endDate]);

  const getPostsForDay = (day: Date) => {
    if (!scheduledPosts) return [];
    return scheduledPosts.filter((post: any) => 
      post.scheduledAt && isSameDay(new Date(post.scheduledAt), day)
    );
  };

  const handlePrevious = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNext = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDragStart = (e: React.DragEvent, post: any) => {
    setDraggedPost(post);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetDay: Date) => {
    e.preventDefault();
    
    if (!draggedPost) return;

    try {
      // Calculate new scheduled time (keep same time of day, change date)
      const originalDate = new Date(draggedPost.scheduledAt);
      const newDate = new Date(targetDay);
      newDate.setHours(originalDate.getHours());
      newDate.setMinutes(originalDate.getMinutes());

      await updatePost({
        postId: draggedPost._id,
        scheduledAt: newDate.getTime(),
      });

      toast.success("Post rescheduled successfully");
      setDraggedPost(null);
    } catch (error) {
      toast.error("Failed to reschedule post");
    }
  };

  const handleDeletePost = async (postId: Id<"socialPosts">) => {
    try {
      await deletePost({ postId });
      toast.success("Post deleted successfully");
      setSelectedPost(null);
    } catch (error) {
      toast.error("Failed to delete post");
    }
  };

  const getOptimalTimesForPost = (platforms: string[]) => {
    // Get optimal times for the first platform (can be enhanced to merge multiple platforms)
    const platform = platforms[0] as keyof typeof OPTIMAL_TIMES;
    return OPTIMAL_TIMES[platform] || OPTIMAL_TIMES.twitter;
  };

  const scheduleAtOptimalTime = async (post: any, hour: number) => {
    try {
      const scheduledDate = new Date(post.scheduledAt || Date.now());
      scheduledDate.setHours(hour, 0, 0, 0);

      await updatePost({
        postId: post._id,
        scheduledAt: scheduledDate.getTime(),
      });

      toast.success(`Post rescheduled to ${hour}:00`);
      setShowOptimalTimes(false);
    } catch (error) {
      toast.error("Failed to reschedule post");
    }
  };

  const getPlatformColor = (platforms: string[]) => {
    if (platforms.includes("twitter")) return "bg-blue-100 text-blue-700 border-blue-200";
    if (platforms.includes("linkedin")) return "bg-blue-100 text-blue-700 border-blue-200";
    if (platforms.includes("facebook")) return "bg-blue-100 text-blue-700 border-blue-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Post Scheduler
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedTimeZone} onValueChange={setSelectedTimeZone}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_ZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkScheduler(true)}
            >
              <CalendarPlus className="h-4 w-4 mr-2" />
              Bulk Schedule
            </Button>
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
              {format(currentDate, "MMMM yyyy")}
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
              const dayPosts = getPostsForDay(day);
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-24 border rounded-lg p-2 ${
                    isToday ? "bg-emerald-50 border-emerald-300" : "bg-white"
                  }`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, day)}
                >
                  <div className="text-sm font-medium mb-1">{format(day, "d")}</div>
                  <div className="space-y-1">
                    {dayPosts.slice(0, 3).map((post: any) => (
                      <div
                        key={post._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, post)}
                        onClick={() => setSelectedPost(post)}
                        className={`w-full text-left text-xs p-1 rounded border ${getPlatformColor(
                          post.platforms
                        )} hover:opacity-80 transition-opacity cursor-move`}
                      >
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span className="truncate">
                            {post.scheduledAt && format(new Date(post.scheduledAt), "HH:mm")}
                          </span>
                        </div>
                        <div className="truncate text-[10px] mt-0.5">
                          {post.content.substring(0, 30)}...
                        </div>
                      </div>
                    ))}
                    {dayPosts.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayPosts.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 pt-4 border-t">
            <span className="text-sm font-medium">Tip:</span>
            <span className="text-sm text-muted-foreground">
              Drag and drop posts to reschedule them
            </span>
          </div>
        </div>
      </CardContent>

      {/* Post Details Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Scheduled Post Details
            </DialogTitle>
            <DialogDescription>
              {selectedPost && selectedPost.scheduledAt && format(new Date(selectedPost.scheduledAt), "PPpp")}
            </DialogDescription>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">Content</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedPost.content}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Platforms</h4>
                <div className="flex gap-2">
                  {selectedPost.platforms.map((platform: string) => (
                    <Badge key={platform} variant="secondary">
                      {platform}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-1">Status</h4>
                <Badge variant="outline">{selectedPost.status}</Badge>
              </div>
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Optimal Posting Times
                </h4>
                <div className="space-y-2">
                  {getOptimalTimesForPost(selectedPost.platforms).map((time: any) => (
                    <Button
                      key={time.hour}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => scheduleAtOptimalTime(selectedPost, time.hour)}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      {time.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-4 border-t">
                {onEditPost && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onEditPost(selectedPost._id);
                      setSelectedPost(null);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeletePost(selectedPost._id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Scheduler Dialog */}
      <Dialog open={showBulkScheduler} onOpenChange={setShowBulkScheduler}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Schedule Posts</DialogTitle>
            <DialogDescription>
              Schedule multiple posts at optimal times
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This feature allows you to schedule multiple posts across different platforms
              at AI-recommended optimal times for maximum engagement.
            </p>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Recommended Times:</h4>
              {Object.entries(OPTIMAL_TIMES).map(([platform, times]) => (
                <div key={platform} className="border rounded-lg p-3">
                  <div className="font-medium text-sm capitalize mb-2">{platform}</div>
                  <div className="space-y-1">
                    {times.map((time) => (
                      <div key={time.hour} className="text-xs text-muted-foreground flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {time.label}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Button className="w-full" onClick={() => setShowBulkScheduler(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
