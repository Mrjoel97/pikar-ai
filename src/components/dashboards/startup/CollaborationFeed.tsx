import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, AtSign, Heart, Share2, Clock } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";

interface CollaborationFeedProps {
  businessId: Id<"businesses">;
}

export function CollaborationFeed({ businessId }: CollaborationFeedProps) {
  const teamActivity = useQuery(api.activityFeed.getTeamActivity, {
    businessId,
    timeRange: 7,
  });

  if (!teamActivity) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Team Collaboration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "mention":
        return <AtSign className="h-4 w-4 text-blue-600" />;
      case "reply":
        return <MessageSquare className="h-4 w-4 text-green-600" />;
      case "reaction":
        return <Heart className="h-4 w-4 text-pink-600" />;
      case "share":
        return <Share2 className="h-4 w-4 text-purple-600" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Team Collaboration
        </CardTitle>
        <CardDescription>
          {teamActivity.metrics.totalActivities} activities in the last 7 days
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Activity Metrics */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <AtSign className="h-4 w-4 mx-auto mb-1 text-blue-600" />
            <p className="text-lg font-bold">{teamActivity.metrics.mentions}</p>
            <p className="text-xs text-muted-foreground">Mentions</p>
          </div>
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <MessageSquare className="h-4 w-4 mx-auto mb-1 text-green-600" />
            <p className="text-lg font-bold">{teamActivity.metrics.replies}</p>
            <p className="text-xs text-muted-foreground">Replies</p>
          </div>
          <div className="text-center p-2 bg-pink-50 rounded-lg">
            <Heart className="h-4 w-4 mx-auto mb-1 text-pink-600" />
            <p className="text-lg font-bold">{teamActivity.metrics.reactions}</p>
            <p className="text-xs text-muted-foreground">Reactions</p>
          </div>
          <div className="text-center p-2 bg-purple-50 rounded-lg">
            <Share2 className="h-4 w-4 mx-auto mb-1 text-purple-600" />
            <p className="text-lg font-bold">{teamActivity.metrics.shares}</p>
            <p className="text-xs text-muted-foreground">Shares</p>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="pt-3 border-t">
          <p className="text-xs font-medium mb-2">Recent Activity</p>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {teamActivity.activities.map((activity: any) => (
                <div key={activity._id} className="flex items-start gap-2 p-2 hover:bg-muted rounded-lg">
                  <div className="mt-0.5">{getActivityIcon(activity.activityType)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{activity.userName}</span>
                      <span className="text-muted-foreground ml-1">
                        {activity.activityType === "mention" && "mentioned someone"}
                        {activity.activityType === "reply" && "replied"}
                        {activity.activityType === "reaction" && "reacted"}
                        {activity.activityType === "share" && "shared"}
                      </span>
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {activity.entityType}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}