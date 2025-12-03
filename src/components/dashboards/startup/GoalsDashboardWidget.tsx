import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Trophy, 
  TrendingUp, 
  Users, 
  AlertCircle,
  CheckCircle2,
  Calendar,
} from "lucide-react";

interface GoalsDashboardWidgetProps {
  businessId: Id<"businesses">;
}

export default function GoalsDashboardWidget({ businessId }: GoalsDashboardWidgetProps) {
  const summary = useQuery(api.teamGoals.getDashboardSummary, { businessId });
  const contributions = useQuery(api.teamGoals.getTeamContributions, { 
    businessId, 
    days: 30 
  });

  if (!summary) {
    return <div className="text-sm text-muted-foreground">Loading goals...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded-lg p-3">
          <div className="text-xs text-muted-foreground">Active Goals</div>
          <div className="text-2xl font-bold">{summary.active}</div>
        </div>
        <div className="border rounded-lg p-3">
          <div className="text-xs text-muted-foreground">Completed</div>
          <div className="text-2xl font-bold text-green-600">{summary.completed}</div>
        </div>
        <div className="border rounded-lg p-3">
          <div className="text-xs text-muted-foreground">Near Completion</div>
          <div className="text-2xl font-bold text-blue-600">{summary.nearCompletion}</div>
        </div>
        <div className="border rounded-lg p-3">
          <div className="text-xs text-muted-foreground">Overdue</div>
          <div className={`text-2xl font-bold ${summary.overdue > 0 ? "text-amber-600" : ""}`}>
            {summary.overdue}
          </div>
        </div>
      </div>

      {/* Recent Completions Alert */}
      {summary.recentCompletions > 0 && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <Trophy className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium text-green-900">
            🎉 {summary.recentCompletions} goal{summary.recentCompletions > 1 ? "s" : ""} completed this week!
          </span>
        </div>
      )}

      {/* Top Active Goals */}
      {summary.topGoals.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Top Active Goals</h4>
          {summary.topGoals.map((goal: { _id: Id<"teamGoals">; title: string; progress: number; deadline?: number }) => (
            <Card key={goal._id} className="border-l-4 border-l-emerald-500">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{goal.title}</span>
                  <div className="flex items-center gap-2">
                    {goal.progress >= 75 && (
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Near completion
                      </Badge>
                    )}
                    {goal.deadline && goal.deadline < Date.now() && (
                      <Badge variant="destructive">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Overdue
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                  {goal.deadline && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      Due: {new Date(goal.deadline).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Team Contributions */}
      {contributions && contributions.length > 0 && (
        <div className="space-y-2 border-t pt-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Top Contributors (Last 30 Days)
          </h4>
          <div className="space-y-2">
            {contributions.slice(0, 5).map((contrib: { userId: string; userName: string; updateCount: number; totalProgress: number; goalsContributed: number }, idx: number) => (
              <div key={contrib.userId} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx === 0 ? "bg-yellow-100 text-yellow-700" :
                    idx === 1 ? "bg-gray-100 text-gray-700" :
                    idx === 2 ? "bg-orange-100 text-orange-700" :
                    "bg-blue-50 text-blue-700"
                  }`}>
                    {idx + 1}
                  </div>
                  <span className="text-sm font-medium">{contrib.userName}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{contrib.updateCount} updates</span>
                  <span>•</span>
                  <span>{contrib.goalsContributed} goals</span>
                  {contrib.totalProgress > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-green-600 font-medium">+{contrib.totalProgress}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
