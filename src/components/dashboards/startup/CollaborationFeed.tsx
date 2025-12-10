import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, AtSign, Heart, Share2, TrendingUp, Users, Zap } from "lucide-react";
import { useNavigate } from "react-router";

interface CollaborationFeedProps {
  businessId: string;
}

export function CollaborationFeed({ businessId }: CollaborationFeedProps) {
  const navigate = useNavigate();
  
  const teamActivity = useQuery(
    api.activityFeed.getTeamActivity,
    businessId ? { businessId: businessId as any, timeRange: 7 } : "skip"
  );

  const recentActivity = useQuery(
    api.activityFeed.getRecent,
    businessId ? { businessId: businessId as any, limit: 10 } : "skip"
  );

  if (!teamActivity) {
    return (
      <Card className="neu-raised">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Collaboration Feed
          </CardTitle>
          <CardDescription>Loading activity...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { activities, metrics } = teamActivity;

  return (
    <Card className="neu-raised">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Collaboration Feed
            </CardTitle>
            <CardDescription>Team activity with mentions, replies, and engagement tracking</CardDescription>
          </div>
          <Button size="sm" onClick={() => navigate("/workflows")}>
            View All
          </Button>
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

        {/* Engagement Summary */}
        <div className="rounded-lg bg-muted/50 p-3 space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            7-Day Engagement
          </h4>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground">Avg/Day</div>
              <div className="text-lg font-bold">
                {Math.round(metrics.totalActivities / 7)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Most Active</div>
              <div className="text-lg font-bold text-green-600">
                {activities[0]?.userName || "N/A"}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Engagement Rate</div>
              <div className="text-lg font-bold text-blue-600">
                {metrics.totalActivities > 0 
                  ? Math.round(((metrics.replies + metrics.reactions) / metrics.totalActivities) * 100)
                  : 0}%
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Recent Activity
          </h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {activities.slice(0, 10).map((activity: any) => (
              <div key={activity._id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-shrink-0 mt-1">
                  {activity.activityType === "mention" && <AtSign className="h-4 w-4 text-blue-600" />}
                  {activity.activityType === "reply" && <MessageSquare className="h-4 w-4 text-green-600" />}
                  {activity.activityType === "reaction" && <Heart className="h-4 w-4 text-pink-600" />}
                  {activity.activityType === "share" && <Share2 className="h-4 w-4 text-purple-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{activity.userName}</span>
                    <Badge variant="outline" className="text-xs">
                      {activity.activityType}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.entityType} • {new Date(activity.timestamp).toLocaleString()}
                  </p>
                  {activity.metadata?.content && (
                    <p className="text-sm mt-2 line-clamp-2">{activity.metadata.content}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {activities.length === 0 && (
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