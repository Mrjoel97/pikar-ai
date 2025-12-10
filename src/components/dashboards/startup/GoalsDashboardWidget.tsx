import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, AlertCircle, CheckCircle, Users, Zap, Award } from "lucide-react";
import { useNavigate } from "react-router";

interface GoalsDashboardWidgetProps {
  businessId: string;
}

export function GoalsDashboardWidget({ businessId }: GoalsDashboardWidgetProps) {
  const navigate = useNavigate();
  
  const summary = useQuery(
    api.teamGoals.getDashboardSummary,
    businessId ? { businessId: businessId as any } : "skip"
  );

  const analytics = useQuery(
    api.teamGoals.getGoalsAnalytics,
    businessId ? { businessId: businessId as any, timeRange: 30 } : "skip"
  );

  const contributions = useQuery(
    api.teamGoals.getTeamContributions,
    businessId ? { businessId: businessId as any, days: 30 } : "skip"
  );

  if (!summary) {
    return (
      <Card className="neu-raised">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Goals Dashboard
          </CardTitle>
          <CardDescription>Loading goals...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="neu-raised">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Goals Dashboard
            </CardTitle>
            <CardDescription>Team goals tracking with advanced analytics</CardDescription>
          </div>
          <Button size="sm" onClick={() => navigate("/workflows")}>
            Manage Goals
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enhanced Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Target className="h-3 w-3" />
              Active Goals
            </div>
            <div className="text-xl font-bold">{summary.active}</div>
            <Progress value={(summary.active / summary.total) * 100} className="h-1" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3" />
              Completed
            </div>
            <div className="text-xl font-bold text-green-600">{summary.completed}</div>
            <p className="text-xs text-muted-foreground">
              {summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0}% rate
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-3 w-3" />
              At Risk
            </div>
            <div className="text-xl font-bold text-red-600">{summary.overdue}</div>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className="h-3 w-3" />
              Near Complete
            </div>
            <div className="text-xl font-bold text-blue-600">{summary.nearCompletion}</div>
            <p className="text-xs text-muted-foreground">&gt;75% done</p>
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
                <div className="text-lg font-bold text-green-600">{analytics.completionRate}%</div>
              </div>
              <div>
                <div className="text-muted-foreground">Velocity</div>
                <div className="text-lg font-bold">{analytics.velocity} pts/day</div>
              </div>
              <div>
                <div className="text-muted-foreground">Avg Progress</div>
                <div className="text-lg font-bold">{analytics.averageProgress}%</div>
              </div>
            </div>
          </div>
        )}

        {/* Top Goals with Progress */}
        {summary.topGoals && summary.topGoals.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Top Active Goals</h4>
            {summary.topGoals.map((goal: any) => (
              <div key={goal._id} className="space-y-2 p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{goal.title}</p>
                  <Badge variant={goal.progress >= 75 ? "default" : goal.progress >= 50 ? "secondary" : "outline"} className="text-xs">
                    {goal.progress}%
                  </Badge>
                </div>
                <Progress value={goal.progress} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {goal.deadline && (
                    <span className={goal.deadline < Date.now() ? "text-red-600 font-semibold" : ""}>
                      Due {new Date(goal.deadline).toLocaleDateString()}
                    </span>
                  )}
                  {goal.assignedTo && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {goal.assignedTo.length} members
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Top Contributors with Achievements */}
        {contributions && contributions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Award className="h-4 w-4" />
              Top Contributors (30 days)
            </h4>
            {contributions.slice(0, 3).map((contrib: any, idx: number) => (
              <div key={contrib.userId} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx === 0 ? "bg-yellow-100 text-yellow-700" :
                    idx === 1 ? "bg-gray-100 text-gray-700" :
                    "bg-orange-100 text-orange-700"
                  }`}>
                    {idx + 1}
                  </div>
                  <span className="text-sm font-medium">{contrib.userName}</span>
                </div>
                <div className="text-right text-xs">
                  <div className="font-semibold">{contrib.updateCount} updates</div>
                  <div className="text-muted-foreground">{contrib.goalsContributed} goals</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {summary.total === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No goals set yet</p>
            <Button size="sm" className="mt-3" onClick={() => navigate("/workflows")}>
              Create Goal
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}