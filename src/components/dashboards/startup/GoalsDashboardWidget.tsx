import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Trophy, 
  TrendingUp, 
  Users, 
  AlertCircle,
  CheckCircle2,
  Calendar,
  Target,
  Button,
} from "lucide-react";

interface GoalsDashboardWidgetProps {
  businessId: Id<"businesses">;
}

export function GoalsDashboardWidget({ businessId }: GoalsDashboardWidgetProps) {
  const [timeRange, setTimeRange] = useState(30);

  const goalsAnalytics = useQuery(
    api.teamGoals.getGoalsAnalytics,
    businessId ? { businessId: businessId as any, timeRange } : "skip"
  );

  const goalsSummary = useQuery(
    api.teamGoals.getDashboardSummary,
    businessId ? { businessId: businessId as any } : "skip"
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Goals Dashboard
            </CardTitle>
            <CardDescription>Track team goals and progress</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/goals")}>
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Analytics Metrics */}
        {goalsAnalytics && (
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{goalsAnalytics.completionRate}%</div>
              <div className="text-xs text-muted-foreground">Completion Rate</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{goalsAnalytics.velocity}</div>
              <div className="text-xs text-muted-foreground">Daily Velocity</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{goalsAnalytics.activeGoals}</div>
              <div className="text-xs text-muted-foreground">Active Goals</div>
            </div>
          </div>
        )}

        {/* Top Goals */}
        <div className="space-y-2">
          {goalsSummary?.topGoals.map((goal: any) => (
            <div key={goal._id} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{goal.title}</span>
                <Badge variant="outline">{goal.progress}%</Badge>
              </div>
              <Progress value={goal.progress} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}