import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from "recharts";
import { TrendingUp, Users, Activity, AlertTriangle, Target, DollarSign } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GrowthMetricsProps {
  businessId: string;
}

export function GrowthMetrics({ businessId }: GrowthMetricsProps) {
  const [timeRange, setTimeRange] = useState(30);

  const growthMetrics = useQuery(
    api.analytics.retention.getGrowthMetrics,
    businessId ? { businessId: businessId as any, timeRange } : "skip"
  );

  const lifecycleStages = useQuery(
    api.analytics.retention.getUserLifecycleStages,
    businessId ? { businessId: businessId as any } : "skip"
  );

  const churnPrediction = useQuery(
    api.analytics.churn.getChurnPrediction,
    businessId ? { businessId: businessId as any } : "skip"
  );

  const cohortAnalysis = useQuery(
    api.analytics.cohorts.getCohortAnalysis,
    businessId ? { businessId: businessId as any, months: 6 } : "skip"
  );

  const cohortLTV = useQuery(
    api.analytics.cohorts.getCohortLTV,
    businessId ? { businessId: businessId as any } : "skip"
  );

  if (!growthMetrics || !lifecycleStages || !churnPrediction) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Growth Metrics
          </CardTitle>
          <CardDescription>Loading growth analytics...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Growth Metrics
            </CardTitle>
            <CardDescription>Track user acquisition and engagement with lifecycle insights</CardDescription>
          </div>
          <div className="flex gap-2">
            {[7, 30, 90].map((days) => (
              <Button
                key={days}
                variant={timeRange === days ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(days)}
              >
                {days}d
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="cohorts">Cohorts</TabsTrigger>
            <TabsTrigger value="ltv">LTV Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Total Contacts</div>
                <div className="text-2xl font-bold">{growthMetrics.totalContacts}</div>
                <div className="text-xs text-muted-foreground">
                  {lifecycleStages.percentages.active}% active
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">New Contacts</div>
                <div className="text-2xl font-bold text-green-600">
                  +{growthMetrics.newContacts}
                </div>
                <div className="text-xs text-muted-foreground">
                  {lifecycleStages.percentages.new}% new users
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Growth Rate</div>
                <div className={`text-2xl font-bold ${growthMetrics.growthRate >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {growthMetrics.growthRate}%
                </div>
                <Badge variant={growthMetrics.growthRate >= 10 ? "default" : "secondary"}>
                  {growthMetrics.growthRate >= 10 ? "Strong" : "Moderate"}
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Engagement</div>
                <div className="text-2xl font-bold">{growthMetrics.engagementRate}%</div>
                <div className="text-xs text-muted-foreground">
                  {growthMetrics.activeContacts} engaged
                </div>
              </div>
            </div>

            {/* Lifecycle Stages */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4" />
                User Lifecycle Distribution
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">New</span>
                    <Badge variant="outline">{lifecycleStages.stages.new}</Badge>
                  </div>
                  <div className="text-sm font-semibold text-blue-600">
                    {lifecycleStages.percentages.new}%
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Active</span>
                    <Badge variant="outline">{lifecycleStages.stages.active}</Badge>
                  </div>
                  <div className="text-sm font-semibold text-green-600">
                    {lifecycleStages.percentages.active}%
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">At Risk</span>
                    <Badge variant="outline">{lifecycleStages.stages.atRisk}</Badge>
                  </div>
                  <div className="text-sm font-semibold text-orange-600">
                    {lifecycleStages.percentages.atRisk}%
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Churned</span>
                    <Badge variant="outline">{lifecycleStages.stages.churned}</Badge>
                  </div>
                  <div className="text-sm font-semibold text-red-600">
                    {lifecycleStages.percentages.churned}%
                  </div>
                </div>
              </div>
            </div>

            {/* Churn Risk Alert */}
            {churnPrediction.summary.atRisk > 0 && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950 p-3 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-semibold text-red-900 dark:text-red-100">
                    Churn Risk Alert
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">High Risk</p>
                    <p className="font-bold text-red-600">{churnPrediction.summary.atRisk}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Moderate</p>
                    <p className="font-bold text-orange-600">{churnPrediction.summary.moderate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Low Risk</p>
                    <p className="font-bold text-green-600">{churnPrediction.summary.low}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Growth Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthMetrics.dailyGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="newContacts"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="New Contacts"
                  />
                  <Line
                    type="monotone"
                    dataKey="totalContacts"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Total Contacts"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="cohorts" className="space-y-4">
            {cohortAnalysis && cohortAnalysis.length > 0 ? (
              <>
                <div className="rounded-lg bg-muted/50 p-4">
                  <h4 className="text-sm font-semibold mb-3">Cohort Analysis by Signup Month</h4>
                  <div className="space-y-2">
                    {cohortAnalysis.map((cohort: any) => (
                      <div key={cohort.cohort} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium text-sm">{cohort.cohort}</p>
                          <p className="text-xs text-muted-foreground">{cohort.size} users</p>
                        </div>
                        <div className="text-right">
                          <div className="flex gap-3 text-xs">
                            <div>
                              <p className="text-muted-foreground">Active</p>
                              <p className="font-bold text-green-600">{cohort.active}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Churned</p>
                              <p className="font-bold text-red-600">{cohort.churned}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cohortAnalysis}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="cohort" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="active" fill="#10b981" name="Active" />
                      <Bar dataKey="churned" fill="#ef4444" name="Churned" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Not enough data for cohort analysis</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="ltv" className="space-y-4">
            {cohortLTV && cohortLTV.length > 0 ? (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      Avg LTV
                    </div>
                    <div className="text-2xl font-bold">
                      ${Math.round(cohortLTV.reduce((sum: number, c: any) => sum + c.averageLTV, 0) / cohortLTV.length)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Target className="h-4 w-4" />
                      Total Revenue
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      ${cohortLTV.reduce((sum: number, c: any) => sum + c.totalRevenue, 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      Total Users
                    </div>
                    <div className="text-2xl font-bold">
                      {cohortLTV.reduce((sum: number, c: any) => sum + c.size, 0)}
                    </div>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cohortLTV}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="cohort" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="averageLTV" fill="#3b82f6" name="Avg LTV ($)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Revenue tracking not yet available</p>
                <p className="text-xs mt-1">Add revenue data to contacts for LTV analysis</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Insights */}
        <div className="rounded-lg bg-muted/50 p-3 space-y-2">
          <h4 className="text-sm font-semibold">💡 Growth Insights</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            {growthMetrics.growthRate > 0 && (
              <li>• Growing at {growthMetrics.growthRate}% over the last {timeRange} days</li>
            )}
            {lifecycleStages.percentages.active > 50 && (
              <li>• Strong engagement with {lifecycleStages.percentages.active}% active users</li>
            )}
            {lifecycleStages.percentages.atRisk > 20 && (
              <li>• {lifecycleStages.stages.atRisk} users at risk - consider re-engagement campaigns</li>
            )}
            {churnPrediction.summary.atRisk > 0 && (
              <li>• {churnPrediction.summary.atRisk} high-risk users need immediate attention</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}