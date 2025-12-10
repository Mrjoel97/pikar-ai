import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, TrendingUp, Award, Target } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface TeamPerformanceProps {
  businessId: Id<"businesses">;
}

export function TeamPerformance({ businessId }: TeamPerformanceProps) {
  const teamMetrics = useQuery(api.telemetry.getTeamPerformanceMetrics, {
    businessId,
    days: 30,
  });

  if (!teamMetrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Performance
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

  const topPerformer = teamMetrics.teamMembers[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Performance
        </CardTitle>
        <CardDescription>
          {teamMetrics.teamMembers.length} team members • Last 30 days
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Target className="h-3 w-3" />
              <span>Total</span>
            </div>
            <p className="text-xl font-bold">{teamMetrics.summary.totalContributions}</p>
            <p className="text-xs text-muted-foreground">Contributions</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>Approvals</span>
            </div>
            <p className="text-xl font-bold text-green-600">{teamMetrics.summary.totalApprovals}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Award className="h-3 w-3" />
              <span>Tasks</span>
            </div>
            <p className="text-xl font-bold text-blue-600">{teamMetrics.summary.totalTasks}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
        </div>

        {/* Top Performer */}
        {topPerformer && (
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium">Top Performer</p>
              <Badge variant="default" className="bg-amber-600">
                <Award className="h-3 w-3 mr-1" />
                MVP
              </Badge>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg">
              <p className="font-medium">{topPerformer.userName}</p>
              <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Contributions</p>
                  <p className="font-bold text-amber-600">{topPerformer.contributions}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Approvals</p>
                  <p className="font-bold">{topPerformer.approvals}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tasks</p>
                  <p className="font-bold">{topPerformer.tasks}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team Members List */}
        <div className="pt-3 border-t">
          <p className="text-xs font-medium mb-2">Team Breakdown</p>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {teamMetrics.teamMembers.map((member: any, index: number) => (
              <div key={member.userId} className="flex items-center justify-between p-2 hover:bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    {member.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{member.userName}</p>
                    <p className="text-xs text-muted-foreground">{member.contributions} contributions</p>
                  </div>
                </div>
                <div className="text-right">
                  <Progress value={(member.contributions / topPerformer.contributions) * 100} className="h-1 w-16 mb-1" />
                  <p className="text-xs text-muted-foreground">#{index + 1}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}