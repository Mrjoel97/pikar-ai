import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, TrendingUp, Target, AlertCircle } from "lucide-react";

interface WorkforceDashboardProps {
  businessId: Id<"businesses"> | null;
}

export function WorkforceDashboard({ businessId }: WorkforceDashboardProps) {
  if (!businessId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Sign in to access workforce analytics</p>
        </CardContent>
      </Card>
    );
  }

  const teamPerformance = useQuery(api.workforceAnalytics.getGlobalTeamPerformance, { businessId });
  const productivityByRegion = useQuery(api.workforceAnalytics.getProductivityByRegion, { businessId });
  const skillGaps = useQuery(api.workforceAnalytics.getSkillGapAnalysis, { businessId });
  const workforcePlanning = useQuery(api.workforceAnalytics.getWorkforcePlanning, { businessId });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Global Workforce Analytics</h2>
        <p className="text-sm text-muted-foreground">Team performance and planning across all regions</p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamPerformance?.totalEmployees || 0}</div>
            <p className="text-xs text-muted-foreground">Active users: {teamPerformance?.activeUsers || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productivity Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamPerformance?.productivityScore || 0}%</div>
            <p className="text-xs text-green-600">+5% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Skill Gaps</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{skillGaps?.criticalGaps.length || 0}</div>
            <p className="text-xs text-muted-foreground">Require immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projected Headcount</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workforcePlanning?.projectedNeeds[0]?.headcount || 0}
            </div>
            <p className="text-xs text-muted-foreground">Q1 2025 target</p>
          </CardContent>
        </Card>
      </div>

      {/* Productivity by Region */}
      <Card>
        <CardHeader>
          <CardTitle>Productivity by Region</CardTitle>
          <CardDescription>Regional team performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {productivityByRegion?.map((region: any) => (
              <div key={region.region} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">{region.region}</span>
                    <Badge variant="outline">{region.tasksCompleted} tasks</Badge>
                  </div>
                  <span className="text-sm font-medium">{region.productivity}%</span>
                </div>
                <Progress value={region.productivity} className="h-2" />
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Avg Response: {region.avgResponseTime}h</span>
                  <span>Utilization: {region.utilizationRate}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Skill Gap Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Skill Gap Analysis</CardTitle>
          <CardDescription>Critical skills requiring development or hiring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {skillGaps?.criticalGaps.map((gap: any) => (
              <div key={gap.skill} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{gap.skill}</span>
                  <Badge variant="destructive">Gap: {gap.gap}%</Badge>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-muted-foreground w-20">Current:</span>
                  <Progress value={gap.currentLevel} className="h-2 flex-1" />
                  <span className="text-xs font-medium w-12">{gap.currentLevel}%</span>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-muted-foreground w-20">Target:</span>
                  <Progress value={gap.targetLevel} className="h-2 flex-1" />
                  <span className="text-xs font-medium w-12">{gap.targetLevel}%</span>
                </div>
              </div>
            ))}
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium mb-2">Recommendations:</p>
              <ul className="space-y-1">
                {skillGaps?.recommendations.map((rec: string, idx: number) => (
                  <li key={idx} className="text-sm text-muted-foreground">• {rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workforce Planning */}
      <Card>
        <CardHeader>
          <CardTitle>Workforce Planning</CardTitle>
          <CardDescription>Projected hiring needs and budget allocation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-3">Projected Headcount</h3>
              <div className="space-y-2">
                {workforcePlanning?.projectedNeeds.map((need: any) => (
                  <div key={need.quarter} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium">{need.quarter}</p>
                      <p className="text-xs text-muted-foreground">{need.roles.join(", ")}</p>
                    </div>
                    <Badge>{need.headcount} employees</Badge>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-3">Budget Allocation</h3>
              <div className="space-y-2">
                {workforcePlanning?.budgetAllocation.map((budget: any) => (
                  <div key={budget.department} className="flex items-center justify-between p-2 border rounded">
                    <span className="font-medium">{budget.department}</span>
                    <div className="text-right">
                      <p className="text-sm font-medium">${budget.projected.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        Current: ${budget.current.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
