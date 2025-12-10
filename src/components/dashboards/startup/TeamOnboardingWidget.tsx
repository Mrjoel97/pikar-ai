import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, Clock, CheckCircle, TrendingUp } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface TeamOnboardingWidgetProps {
  businessId: Id<"businesses">;
}

export function TeamOnboardingWidget({ businessId }: TeamOnboardingWidgetProps) {
  const dashboard = useQuery(api.teamOnboarding.getTeamOnboardingDashboard, {
    businessId,
  });

  const analytics = useQuery(api.teamOnboarding.getOnboardingAnalytics, {
    businessId,
    timeRange: "30d",
  });

  if (!dashboard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Onboarding
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Onboarding
        </CardTitle>
        <CardDescription>
          {dashboard.stats.active} active • {dashboard.stats.completed} completed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-semibold">{dashboard.stats.averageProgress}%</span>
          </div>
          <Progress value={dashboard.stats.averageProgress} className="h-2" />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>Active</span>
            </div>
            <p className="text-xl font-bold">{dashboard.stats.active}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3" />
              <span>Completed</span>
            </div>
            <p className="text-xl font-bold text-green-600">{dashboard.stats.completed}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Avg Days</span>
            </div>
            <p className="text-xl font-bold">{analytics?.averageCompletionDays.toFixed(1) || 0}</p>
          </div>
        </div>

        {/* Analytics Insights */}
        {analytics && (
          <div className="pt-3 border-t space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Completion Rate</span>
              <span className="font-semibold text-green-600">
                {analytics.completionRate.toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Sessions</span>
              <span className="font-semibold">{analytics.totalSessions}</span>
            </div>
          </div>
        )}

        {/* Role Breakdown */}
        {analytics?.roleBreakdown && Object.keys(analytics.roleBreakdown).length > 0 && (
          <div className="pt-3 border-t">
            <p className="text-xs font-medium mb-2">By Role</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(analytics.roleBreakdown).map(([role, count]) => (
                <Badge key={role} variant="secondary" className="text-xs">
                  {role}: {count as number}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Recent Sessions */}
        {dashboard.sessions.length > 0 && (
          <div className="pt-3 border-t">
            <p className="text-xs font-medium mb-2">Recent Activity</p>
            <div className="space-y-2">
              {dashboard.sessions.slice(0, 3).map((session: any) => (
                <div key={session._id} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground truncate">{session.role}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={session.progress} className="h-1 w-16" />
                    <span className="font-medium">{session.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}