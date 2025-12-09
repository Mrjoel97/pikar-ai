import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, DollarSign, Users, TrendingUp } from "lucide-react";

interface OptimizationTabProps {
  workforceOptimization: any;
}

export function OptimizationTab({ workforceOptimization }: OptimizationTabProps) {
  if (!workforceOptimization) {
    return <div className="text-sm text-muted-foreground">Loading optimization recommendations...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Optimization Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workforceOptimization.optimizationScore || 0}</div>
            <p className="text-xs text-muted-foreground">Out of 100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(workforceOptimization.potentialSavings || 0).toLocaleString()}
            </div>
            <p className="text-xs text-green-600">Annual potential</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency Gain</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workforceOptimization.efficiencyGain || 0}%</div>
            <p className="text-xs text-blue-600">Projected improvement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recommendations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workforceOptimization.recommendations?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Action items</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Optimization Recommendations</CardTitle>
          <CardDescription>AI-powered workforce optimization strategies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {workforceOptimization.recommendations?.map((rec: any, idx: number) => (
              <div key={idx} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        rec.priority === "high"
                          ? "destructive"
                          : rec.priority === "medium"
                          ? "default"
                          : "outline"
                      }
                    >
                      {rec.priority} priority
                    </Badge>
                    <span className="font-medium">{rec.category}</span>
                  </div>
                </div>
                <p className="text-sm mb-2">{rec.recommendation}</p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Impact: <span className="font-medium text-green-600">{rec.impact}</span>
                  </div>
                  <Button size="sm" variant="outline">
                    Implement
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cost Savings Opportunities</CardTitle>
          <CardDescription>Potential annual savings by initiative</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {workforceOptimization.costSavings?.map((saving: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div className="flex-1">
                  <div className="font-medium mb-1">{saving.initiative}</div>
                  <div className="text-sm text-muted-foreground">
                    Implementation cost: ${saving.implementation?.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    ${saving.annualSavings?.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">annual savings</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}