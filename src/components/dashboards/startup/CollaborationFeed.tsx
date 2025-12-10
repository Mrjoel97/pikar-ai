import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, User, Clock, Users, AtSign, MessageSquare, Heart, Share2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CollaborationFeedProps {
  businessId: Id<"businesses">;
}

export default function CollaborationFeed({ businessId }: CollaborationFeedProps) {
  const [timeRange, setTimeRange] = useState(7);
  
  const teamActivity = useQuery(
    api.activityFeed.getTeamActivity,
    businessId ? { businessId: businessId as any, timeRange } : "skip"
  );

  const mentions = useQuery(
    api.activityFeed.getMentions,
    businessId && userId ? { businessId: businessId as any, userId: userId as any } : "skip"
  );

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "notification":
        return "🔔";
      case "workflow_run":
        return "⚙️";
      case "team_message":
        return "💬";
      case "goal_update":
        return "🎯";
      case "approval":
        return "✅";
      case "social_post":
        return "📱";
      default:
        return "📋";
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "succeeded":
      case "completed":
      case "approved":
      case "posted":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "failed":
      case "rejected":
        return "bg-red-500/10 text-red-700 dark:text-red-400";
      case "running":
      case "in_progress":
      case "pending":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
    }
  };

  const highlightMentions = (text: string) => {
    return text.replace(/@(\w+)/g, '<span class="text-blue-600 font-semibold">@$1</span>');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Collaboration Feed
            </CardTitle>
            <CardDescription>Real-time team activity and mentions</CardDescription>
          </div>
          <Select value={String(timeRange)} onValueChange={(v) => setTimeRange(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="14">14 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Activity Metrics */}
        {teamActivity?.metrics && (
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{teamActivity.metrics.mentions}</div>
              <div className="text-xs text-muted-foreground">Mentions</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{teamActivity.metrics.replies}</div>
              <div className="text-xs text-muted-foreground">Replies</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{teamActivity.metrics.reactions}</div>
              <div className="text-xs text-muted-foreground">Reactions</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{teamActivity.metrics.shares}</div>
              <div className="text-xs text-muted-foreground">Shares</div>
            </div>
          </div>
        )}

        {/* Activity Feed */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {teamActivity?.activities.map((activity: any) => (
            <div key={activity._id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                {activity.activityType === "mention" && <AtSign className="h-4 w-4" />}
                {activity.activityType === "reply" && <MessageSquare className="h-4 w-4" />}
                {activity.activityType === "reaction" && <Heart className="h-4 w-4" />}
                {activity.activityType === "share" && <Share2 className="h-4 w-4" />}
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">{activity.userName}</span>{" "}
                  {activity.activityType === "mention" && "mentioned you"}
                  {activity.activityType === "reply" && "replied to your message"}
                  {activity.activityType === "reaction" && "reacted to your post"}
                  {activity.activityType === "share" && "shared your content"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(activity.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}