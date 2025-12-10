import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Users, CheckCircle, Clock, TrendingUp, Award, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router";

interface TeamOnboardingWidgetProps {
  businessId: string;
}

export function TeamOnboardingWidget({ businessId }: TeamOnboardingWidgetProps) {
  const navigate = useNavigate();
  
  const dashboard = useQuery(
    api.teamOnboarding.getTeamOnboardingDashboard,
    businessId ? { businessId: businessId as any } : "skip"
  );

  const analytics = useQuery(
    api.teamOnboarding.getOnboardingAnalytics,
    businessId ? { businessId: businessId as any, timeRange: "30d" } : "skip"
  );

  if (!dashboard) {
    return (
      <Card className="neu-raised">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Onboarding System
          </CardTitle>
          <CardDescription>Loading onboarding data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { sessions, stats } = dashboard;

  return (
    <Card className="neu-raised">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Onboarding System
            </CardTitle>
            <CardDescription>Automated onboarding with role-based tasks and analytics</CardDescription>
          </div>
          <Button size="sm" onClick={() => navigate("/settings")}>
            Manage
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enhanced Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              Total Members
            </div>
            <div className="text-xl font-bold">{stats.total}</div>
            <Progress value={(stats.completed / stats.total) * 100} className="h-1" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              In Progress
            </div>
            <div className="text-xl font-bold text-blue-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(stats.averageProgress)}% avg
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3" />
              Completed
            </div>
            <div className="text-xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% rate
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Avg Time
            </div>
            <div className="text-xl font-bold text-purple-600">
              {analytics?.averageCompletionDays ? Math.round(analytics.averageCompletionDays) : 0}d
            </div>
            <p className="text-xs text-muted-foreground">to complete</p>
          </div>
        </div>

        {/* Analytics Summary */}
        {analytics && (
          <div className="rounded-lg bg-muted/50 p-3 space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              30-Day Analytics
            </h4>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground">Completion Rate</div>
                <div className="text-lg font-bold text-green-600">
                  {Math.round(analytics.completionRate || 0)}%
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">New Members</div>
                <div className="text-lg font-bold">{analytics.totalSessions || 0}</div>
              </div>
              <div>
                <div className="text-muted-foreground">In Progress</div>
                <div className="text-lg font-bold text-blue-600">
                  {analytics.inProgressSessions || 0}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Role Breakdown */}
        {analytics?.roleBreakdown && Object.keys(analytics.roleBreakdown).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Award className="h-4 w-4" />
              Role Distribution
            </h4>
            {Object.entries(analytics.roleBreakdown).map(([role, count]: [string, any]) => (
              <div key={role} className="flex items-center justify-between text-sm">
                <span className="capitalize">{role}</span>
                <Badge variant="outline">{count} members</Badge>
              </div>
            ))}
          </div>
        )}

        {/* Recent Onboarding Sessions */}
        {sessions && sessions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Recent Onboarding</h4>
            {sessions.slice(0, 5).map((session: any) => (
              <div key={session._id} className="space-y-1 p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{session.role}</p>
                    <Badge variant={
                      session.status === "completed" ? "default" :
                      session.status === "in_progress" ? "secondary" :
                      "outline"
                    } className="text-xs">
                      {session.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {session.progress}%
                  </span>
                </div>
                <Progress value={session.progress} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Started {new Date(session.startDate).toLocaleDateString()}</span>
                  {session.status === "in_progress" && session.progress < 50 && (
                    <span className="flex items-center gap-1 text-amber-600">
                      <AlertCircle className="h-3 w-3" />
                      Needs attention
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {stats.total === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No team members onboarding yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}