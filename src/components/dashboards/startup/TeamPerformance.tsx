import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp } from "lucide-react";

interface TeamPerformanceProps {
  teamPerformance: any;
  isGuest: boolean;
}

export function TeamPerformance({ teamPerformance, isGuest }: TeamPerformanceProps) {
  if (isGuest || !teamPerformance) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Performance
          </CardTitle>
          <CardDescription>Sign in to view team metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Team performance data available after authentication
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
          Team Performance
        </CardTitle>
        <CardDescription>Last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Tasks Completed</div>
            <div className="text-2xl font-bold">{teamPerformance.tasksCompleted || 0}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Avg Response Time</div>
            <div className="text-2xl font-bold">{teamPerformance.avgResponseTime || "N/A"}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Team Velocity</div>
            <div className="text-2xl font-bold flex items-center gap-1">
              {teamPerformance.velocity || 0}
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Collaboration Score</div>
            <div className="text-2xl font-bold">{teamPerformance.collaborationScore || 0}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}