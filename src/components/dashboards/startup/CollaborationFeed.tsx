import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, AtSign, Heart, Share2, TrendingUp, Users, Zap, Clock, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router";
import { Id } from "@/convex/_generated/dataModel";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface CollaborationFeedProps {
  businessId: Id<"businesses"> | string | null;
}

export function CollaborationFeed({ businessId }: CollaborationFeedProps) {
  const navigate = useNavigate();
  const [cursor, setCursor] = useState<string | null>(null);
  const [allActivities, setAllActivities] = useState<any[]>([]);
  
  const activityFeed = useQuery(
    api.notifications.realtime.subscribeToActivityFeed,
    businessId ? { businessId: businessId as Id<"businesses">, cursor: cursor || undefined, limit: 50 } : "skip"
  );

  const teamActivity = useQuery(
    api.activityFeed.getTeamActivity,
    businessId ? { businessId: businessId as Id<"businesses">, timeRange: 7 } : "skip"
  );

  const markAsRead = useMutation(api.notifications.realtime.markActivitiesAsRead);

  // Append new activities when cursor changes
  useEffect(() => {
    if (activityFeed?.activities) {
      if (cursor === null) {
        setAllActivities(activityFeed.activities);
      } else {
        setAllActivities((prev) => [...prev, ...activityFeed.activities]);
      }
    }
  }, [activityFeed, cursor]);

  const handleLoadMore = () => {
    if (activityFeed?.nextCursor) {
      setCursor(activityFeed.nextCursor);
    }
  };

  const handleMarkAllRead = async () => {
    const unreadIds = allActivities
      .filter((a) => !a.read)
      .map((a) => a._id);
    
    if (unreadIds.length > 0) {
      await markAsRead({ activityIds: unreadIds });
      toast.success(`Marked ${unreadIds.length} activities as read`);
    }
  };

  if (!teamActivity || teamActivity === "skip") {
    return (
      <Card className="neu-raised">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Collaboration Feed
          </CardTitle>
          <CardDescription>Loading team activity...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { metrics } = teamActivity;
  const unreadCount = allActivities.filter((a) => !a.read).length;

  return (
    <Card className="neu-raised">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Collaboration Feed
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount} new
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Real-time team activity</CardDescription>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button size="sm" variant="outline" onClick={handleMarkAllRead}>
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark All Read
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => navigate("/workflows")}>
              View All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enhanced Activity Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className="h-3 w-3" />
              Total Activity
            </div>
            <div className="text-xl font-bold">{metrics.totalActivities}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AtSign className="h-3 w-3" />
              Mentions
            </div>
            <div className="text-xl font-bold text-blue-600">{metrics.mentions}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              Replies
            </div>
            <div className="text-xl font-bold text-green-600">{metrics.replies}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Heart className="h-3 w-3" />
              Reactions
            </div>
            <div className="text-xl font-bold text-pink-600">{metrics.reactions}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Share2 className="h-3 w-3" />
              Shares
            </div>
            <div className="text-xl font-bold text-purple-600">{metrics.shares}</div>
          </div>
        </div>

        {/* Real-time Activity Feed with Infinite Scroll */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent Activity
          </h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {allActivities.map((activity: any) => {
              const activityType = activity.activityType || "notification";
              const icon = activityType === "mention" ? AtSign :
                          activityType === "reply" ? MessageSquare :
                          activityType === "reaction" ? Heart :
                          activityType === "share" ? Share2 : MessageSquare;
              
              const iconColor = activityType === "mention" ? "text-blue-600" :
                               activityType === "reply" ? "text-green-600" :
                               activityType === "reaction" ? "text-pink-600" :
                               activityType === "share" ? "text-purple-600" : "text-gray-600";
              
              const Icon = icon;
              
              return (
                <div 
                  key={activity._id} 
                  className={`flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors ${
                    !activity.read ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200" : ""
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">
                    <Icon className={`h-4 w-4 ${iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{activity.userName || "Unknown"}</span>
                      <Badge variant="outline" className="text-xs">
                        {activityType}
                      </Badge>
                      {!activity.read && (
                        <Badge variant="default" className="text-xs">
                          New
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.title} • {new Date(activity.timestamp).toLocaleString()}
                    </p>
                    {activity.message && (
                      <p className="text-sm mt-2 line-clamp-2">{activity.message}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More Button */}
          {activityFeed?.hasMore && (
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleLoadMore}
            >
              Load More
            </Button>
          )}
        </div>

        {allActivities.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No team activity yet</p>
            <p className="text-xs mt-1">Start collaborating to see activity here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}