import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, TrendingUp, Award, Target, Zap, Activity } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface TeamPerformanceProps {
  businessId: Id<"businesses">;
}

export function TeamPerformance({ businessId }: TeamPerformanceProps) {
  const [viewMode, setViewMode] = useState<"overview" | "velocity" | "burndown">("overview");

  const teamMetrics = useQuery(api.telemetry.getTeamPerformanceMetrics, {
    businessId,
    days: 30,
  });

  const sprintVelocity = useQuery(api.analytics.teamVelocity.getSprintVelocity, {
    businessId,
    sprints: 6,
  });

  const burndownData = useQuery(api.analytics.teamVelocity.getBurndownData, {
    businessId,
  });

  const predictiveCompletion = useQuery(api.analytics.teamVelocity.getPredictiveCompletion, {
    businessId,
  });

  const teamContributions = useQuery(api.teamGoals.getTeamContributions, {
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Performance
            </CardTitle>
            <CardDescription>
              {teamMetrics.teamMembers.length} team members • Last 30 days
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {["overview", "velocity", "burndown"].map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode(mode as any)}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {viewMode === "overview" && (
          <>
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

            {/* Velocity Metrics */}
            {sprintVelocity && (
              <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Sprint Velocity
                  </h4>
                  <Badge variant={sprintVelocity.trend === "increasing" ? "default" : "secondary"}>
                    {sprintVelocity.trend}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Avg Velocity</p>
                    <p className="text-lg font-bold">{sprintVelocity.averageVelocity}</p>
                  </div>
                  {predictiveCompletion && (
                    <div>
                      <p className="text-muted-foreground">Est. Completion</p>
                      <p className="text-lg font-bold">{predictiveCompletion.daysToComplete}d</p>
                    </div>
                  )}
                </div>
              </div>
            )}

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
          </>
        )}

        {viewMode === "velocity" && sprintVelocity && (
          <div className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sprintVelocity.sprints}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sprint" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="velocity"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Velocity"
                  />
                  <Line
                    type="monotone"
                    dataKey="completedTasks"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Tasks"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {predictiveCompletion && (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3">
                <h4 className="text-sm font-semibold mb-2">🔮 Predictive Insights</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">Completion Date</p>
                    <p className="font-bold">{new Date(predictiveCompletion.predictedDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Confidence</p>
                    <p className="font-bold">{predictiveCompletion.confidence}%</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{predictiveCompletion.recommendation}</p>
              </div>
            )}
          </div>
        )}

        {viewMode === "burndown" && burndownData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Total Work</p>
                <p className="text-xl font-bold">{burndownData.totalWork}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Remaining</p>
                <p className="text-xl font-bold text-orange-600">{burndownData.remainingWork}</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={burndownData.idealBurndown.map((ideal, idx) => ({
                  day: ideal.day,
                  ideal: ideal.remaining,
                  actual: burndownData.actualBurndown[idx]?.remaining || 0,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="ideal"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Ideal"
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Actual"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-xs text-muted-foreground">
              {burndownData.daysRemaining} days remaining in current sprint
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}