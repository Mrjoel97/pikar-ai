import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Target } from "lucide-react";

interface BudgetDashboardProps {
  businessId: Id<"businesses">;
}

export function BudgetDashboard({ businessId }: BudgetDashboardProps) {
  const budgetTracking = useQuery(api.departmentKpis.getBudgetTracking, { businessId });
  const crossDeptAnalytics = useQuery(api.departmentKpis.getCrossDepartmentAnalytics, { businessId });

  if (!budgetTracking || !crossDeptAnalytics) {
    return <div>Loading budget data...</div>;
  }

  const totalBudget = budgetTracking.reduce((sum: number, dept: any) => sum + dept.allocated, 0);
  const totalSpent = budgetTracking.reduce((sum: number, dept: any) => sum + dept.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const overallUtilization = (totalSpent / totalBudget) * 100;

  const atRiskDepts = budgetTracking.filter((dept: any) => dept.utilizationRate > 90);
  const underUtilizedDepts = budgetTracking.filter((dept: any) => dept.utilizationRate < 50);

  return (
    <div className="space-y-4">
      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalBudget / 1000).toFixed(0)}K</div>
            <Progress value={overallUtilization} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {overallUtilization.toFixed(1)}% utilized
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${(totalSpent / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all departments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${(totalRemaining / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground mt-1">
              Available to spend
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              At Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{atRiskDepts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Departments over 90%
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="departments" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="departments">By Department</TabsTrigger>
          <TabsTrigger value="trends">Spending Trends</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="departments" className="space-y-4">
          <div className="space-y-3">
            {budgetTracking.map((dept: any) => (
              <Card key={dept.department}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base capitalize">{dept.department}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={dept.utilizationRate > 90 ? "destructive" : dept.utilizationRate > 75 ? "default" : "secondary"}>
                        {dept.utilizationRate.toFixed(1)}%
                      </Badge>
                      {dept.trend === "increasing" && <TrendingUp className="h-4 w-4 text-red-600" />}
                      {dept.trend === "decreasing" && <TrendingDown className="h-4 w-4 text-green-600" />}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Allocated</p>
                      <p className="font-semibold">${(dept.allocated / 1000).toFixed(1)}K</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Spent</p>
                      <p className="font-semibold text-red-600">${(dept.spent / 1000).toFixed(1)}K</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Remaining</p>
                      <p className="font-semibold text-green-600">${(dept.remaining / 1000).toFixed(1)}K</p>
                    </div>
                  </div>
                  <Progress value={dept.utilizationRate} />
                  {dept.utilizationRate > 90 && (
                    <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                      <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                      <p className="text-red-900">
                        Budget nearly exhausted. Consider reallocation or additional funding.
                      </p>
                    </div>
                  )}
                  {dept.projectedOverrun && (
                    <div className="flex items-start gap-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs">
                      <Target className="h-4 w-4 text-orange-600 mt-0.5" />
                      <p className="text-orange-900">
                        Projected to exceed budget by ${(dept.projectedOverrun / 1000).toFixed(1)}K
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly Spending Velocity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {budgetTracking.map((dept: any) => (
                  <div key={dept.department} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize font-medium">{dept.department}</span>
                      <span className="text-muted-foreground">
                        ${(dept.monthlyBurnRate / 1000).toFixed(1)}K/mo
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${Math.min(100, (dept.monthlyBurnRate / (dept.allocated / 12)) * 100)}%` }}
                        />
                      </div>
                      {dept.trend === "increasing" && <TrendingUp className="h-3 w-3 text-red-600" />}
                      {dept.trend === "decreasing" && <TrendingDown className="h-3 w-3 text-green-600" />}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Budget Optimization Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {atRiskDepts.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-semibold text-sm text-red-900 mb-2">⚠️ High Risk Departments</h4>
                  <ul className="space-y-1 text-sm text-red-800">
                    {atRiskDepts.map((dept: any) => (
                      <li key={dept.department} className="capitalize">
                        • {dept.department}: {dept.utilizationRate.toFixed(1)}% utilized
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {underUtilizedDepts.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-sm text-blue-900 mb-2">💡 Reallocation Opportunities</h4>
                  <ul className="space-y-1 text-sm text-blue-800">
                    {underUtilizedDepts.map((dept: any) => (
                      <li key={dept.department} className="capitalize">
                        • {dept.department}: ${(dept.remaining / 1000).toFixed(1)}K available for reallocation
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-sm text-green-900 mb-2">✓ Recommendations</h4>
                <ul className="space-y-1 text-sm text-green-800">
                  <li>• Review high-utilization departments for cost optimization</li>
                  <li>• Consider reallocating funds from under-utilized departments</li>
                  <li>• Set up automated alerts for departments exceeding 85% utilization</li>
                  <li>• Implement quarterly budget reviews for better forecasting</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}