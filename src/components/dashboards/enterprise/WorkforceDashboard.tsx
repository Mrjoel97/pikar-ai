import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, TrendingUp, Target, AlertTriangle } from "lucide-react";
import { AttritionTab } from "./workforce/AttritionTab";
import { SkillsTab } from "./workforce/SkillsTab";
import { CapacityTab } from "./workforce/CapacityTab";
import { PerformanceTab } from "./workforce/PerformanceTab";
import { OptimizationTab } from "./workforce/OptimizationTab";

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
  
  // New enhanced queries
  const attritionPredictions = useQuery(api.workforceAnalytics.getAttritionPredictions, { businessId });
  const advancedSkillGaps = useQuery(api.workforceAnalytics.getAdvancedSkillGapAnalysis, { businessId });
  const capacityPlanning = useQuery(api.workforceAnalytics.getCapacityPlanning, { businessId });
  const performanceForecasting = useQuery(api.workforceAnalytics.getPerformanceForecasting, { businessId });
  const workforceOptimization = useQuery(api.workforceAnalytics.getWorkforceOptimization, { businessId });

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Global Workforce Analytics</h2>
        <p className="text-sm text-muted-foreground">Predictive insights and optimization recommendations</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attrition">Attrition Predictions</TabsTrigger>
          <TabsTrigger value="skills">Skill Gap Analysis</TabsTrigger>
          <TabsTrigger value="capacity">Capacity Planning</TabsTrigger>
          <TabsTrigger value="performance">Performance Forecasting</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
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
                <CardTitle className="text-sm font-medium">Attrition Risk</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attritionPredictions?.overallAttritionRate || 0}%</div>
                <p className="text-xs text-orange-600">{attritionPredictions?.predictedAttrition || 0} employees at risk</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Optimization Score</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{workforceOptimization?.optimizationScore || 0}</div>
                <p className="text-xs text-muted-foreground">Out of 100</p>
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
        </TabsContent>

        <TabsContent value="attrition" className="space-y-4">
          <AttritionTab attritionPredictions={attritionPredictions} />
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <SkillsTab advancedSkillGaps={advancedSkillGaps} />
        </TabsContent>

        <TabsContent value="capacity" className="space-y-4">
          <CapacityTab capacityPlanning={capacityPlanning} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <PerformanceTab performanceForecasting={performanceForecasting} />
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <OptimizationTab workforceOptimization={workforceOptimization} />
        </TabsContent>
      </Tabs>
    </div>
  );
}