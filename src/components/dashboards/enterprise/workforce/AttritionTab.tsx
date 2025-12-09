import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, TrendingUp, Users } from "lucide-react";

interface AttritionTabProps {
  attritionPredictions: any;
}

export function AttritionTab({ attritionPredictions }: AttritionTabProps) {
  if (!attritionPredictions) {
    return <div className="text-sm text-muted-foreground">Loading attrition predictions...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Attrition Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attritionPredictions.overallAttritionRate}%</div>
            <p className="text-xs text-muted-foreground">Industry avg: 13.2%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Employees</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attritionPredictions.predictedAttrition}</div>
            <p className="text-xs text-orange-600">Requires immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retention Cost</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${attritionPredictions.retentionCost?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Annual investment</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>High-Risk Employees</CardTitle>
          <CardDescription>Employees with elevated attrition risk scores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {attritionPredictions.highRiskEmployees?.map((emp: any) => (
              <div key={emp.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{emp.name}</span>
                    <Badge variant="outline">{emp.department}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Tenure: {emp.tenure} months | Performance: {emp.performanceScore}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Risk Factors: {emp.riskFactors?.join(", ")}
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant={
                      emp.riskScore > 75
                        ? "destructive"
                        : emp.riskScore > 50
                        ? "default"
                        : "outline"
                    }
                  >
                    {emp.riskScore}% risk
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attrition by Department</CardTitle>
          <CardDescription>Department-level attrition trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {attritionPredictions.departmentBreakdown?.map((dept: any) => (
              <div key={dept.department} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{dept.department}</span>
                  <span className="text-sm">{dept.attritionRate}%</span>
                </div>
                <Progress value={dept.attritionRate} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {dept.atRiskCount} employees at risk
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}