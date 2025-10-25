import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface OptimizationTabProps {
  workforceOptimization: any;
}

export function OptimizationTab({ workforceOptimization }: OptimizationTabProps) {
  if (!workforceOptimization) {
    return <div className="text-sm text-muted-foreground">Loading optimization data...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Workforce Optimization</h3>
          <p className="text-sm text-muted-foreground">
            Overall Score: <span className="font-bold">{workforceOptimization.optimizationScore || 0}/100</span>
          </p>
        </div>
        <Button>
          <Lightbulb className="h-4 w-4 mr-2" />
          Generate Plan
        </Button>
      </div>

      {/* Optimization Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Recommendations</CardTitle>
          <CardDescription>Prioritized actions to improve workforce efficiency</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {workforceOptimization.recommendations?.map((rec: any, idx: number) => (
              <div key={idx} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <Badge variant="outline" className="mb-1">{rec.category}</Badge>
                    <div className="font-medium">{rec.recommendation}</div>
                  </div>
                  <Badge variant="outline" className={
                    rec.priority === "critical" ? "bg-red-100 text-red-700" :
                    rec.priority === "high" ? "bg-orange-100 text-orange-700" :
                    "bg-yellow-100 text-yellow-700"
                  }>
                    {rec.priority}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div><span className="font-medium">Rationale:</span> {rec.rationale}</div>
                  <div><span className="font-medium">Impact:</span> {rec.impact}</div>
                  <div className="flex items-center gap-4">
                    <span><span className="font-medium">Effort:</span> {rec.effort}</span>
                    <span><span className="font-medium">Timeframe:</span> {rec.timeframe}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cost Savings */}
      <Card>
        <CardHeader>
          <CardTitle>Projected Cost Savings</CardTitle>
          <CardDescription>Financial impact of optimization initiatives</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {workforceOptimization.costSavings?.map((saving: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{saving.initiative}</div>
                  <div className="text-xs text-muted-foreground">
                    Payback: {saving.paybackPeriod}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    ${saving.netSavings.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Annual savings
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Efficiency Gains */}
      <Card>
        <CardHeader>
          <CardTitle>Efficiency Gains by Area</CardTitle>
          <CardDescription>Potential improvements across departments</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={workforceOptimization.efficiencyGains || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="area" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="currentEfficiency" fill="#94a3b8" name="Current %" />
              <Bar dataKey="targetEfficiency" fill="#10b981" name="Target %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Implementation Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Roadmap</CardTitle>
          <CardDescription>Phased approach to workforce optimization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {workforceOptimization.implementationPlan?.map((phase: any, idx: number) => (
              <div key={idx} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium">{phase.phase}</div>
                    <div className="text-xs text-muted-foreground">{phase.duration}</div>
                  </div>
                  <Badge variant="outline">${phase.cost.toLocaleString()}</Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div><span className="font-medium">Actions:</span> {phase.actions.join(", ")}</div>
                  <div><span className="font-medium">Expected Impact:</span> {phase.expectedImpact}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
