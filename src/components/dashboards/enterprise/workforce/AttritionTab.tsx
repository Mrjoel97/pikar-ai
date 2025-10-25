import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingDown, AlertCircle, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface AttritionTabProps {
  attritionPredictions: any;
}

export function AttritionTab({ attritionPredictions }: AttritionTabProps) {
  if (!attritionPredictions) {
    return <div className="text-sm text-muted-foreground">Loading attrition data...</div>;
  }

  const getRiskColor = (score: number) => {
    if (score >= 80) return "bg-red-100 text-red-700 border-red-300";
    if (score >= 60) return "bg-orange-100 text-orange-700 border-orange-300";
    if (score >= 40) return "bg-yellow-100 text-yellow-700 border-yellow-300";
    return "bg-green-100 text-green-700 border-green-300";
  };

  const getTrendColor = (trend: string) => {
    if (trend === "increasing" || trend === "improving") return "text-green-600";
    if (trend === "decreasing" || trend === "declining") return "text-red-600";
    return "text-blue-600";
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{attritionPredictions.overallAttritionRate || 0}%</div>
                <div className="text-xs text-muted-foreground mt-1">Overall Attrition Rate</div>
              </div>
              <TrendingDown className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{attritionPredictions.predictedAttrition || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">Predicted Departures</div>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold capitalize">{attritionPredictions.attritionTrend || "stable"}</div>
                <div className="text-xs text-muted-foreground mt-1">Trend</div>
              </div>
              <TrendingUp className={`h-8 w-8 ${getTrendColor(attritionPredictions.attritionTrend || "stable")}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* High Risk Employees */}
      <Card>
        <CardHeader>
          <CardTitle>High Risk Employees</CardTitle>
          <CardDescription>Employees with elevated attrition risk</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {attritionPredictions.highRiskEmployees?.map((emp: any) => (
              <div key={emp.employeeId} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium">{emp.name}</div>
                    <div className="text-xs text-muted-foreground">{emp.department} • {emp.tenure} months tenure</div>
                  </div>
                  <Badge variant="outline" className={getRiskColor(emp.riskScore)}>
                    Risk: {emp.riskScore}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Risk Factors:</span> {emp.riskFactors.join(", ")}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Attrition by Department */}
      <Card>
        <CardHeader>
          <CardTitle>Attrition by Department</CardTitle>
          <CardDescription>Current and predicted attrition rates</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attritionPredictions.attritionByDepartment || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="currentRate" fill="#3b82f6" name="Current Rate %" />
              <Bar dataKey="predictedRate" fill="#f59e0b" name="Predicted Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Retention Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Retention Recommendations</CardTitle>
          <CardDescription>Actions to reduce attrition</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {attritionPredictions.retentionRecommendations?.map((rec: any, idx: number) => (
              <div key={idx} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{rec.action}</span>
                  <Badge variant="outline" className={
                    rec.priority === "high" ? "bg-red-100 text-red-700" :
                    rec.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                    "bg-blue-100 text-blue-700"
                  }>
                    {rec.priority}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div><span className="font-medium">Impact:</span> {rec.impact}</div>
                  <div><span className="font-medium">Cost:</span> {rec.cost}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
