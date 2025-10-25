import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface PerformanceTabProps {
  performanceForecasting: any;
}

export function PerformanceTab({ performanceForecasting }: PerformanceTabProps) {
  if (!performanceForecasting) {
    return <div className="text-sm text-muted-foreground">Loading performance data...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Department Performance Forecasts</CardTitle>
          <CardDescription>Predicted performance trends by department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {performanceForecasting.departmentForecasts?.map((dept: any) => (
              <div key={dept.department} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium">{dept.department}</div>
                    <div className="text-xs text-muted-foreground">
                      Confidence: {dept.confidence}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">
                      {dept.currentScore} → {dept.forecastedScore}
                    </div>
                    <Badge variant="outline" className={
                      dept.trend === "improving" ? "bg-green-100 text-green-700" :
                      dept.trend === "declining" ? "bg-red-100 text-red-700" :
                      "bg-blue-100 text-blue-700"
                    }>
                      {dept.trend}
                    </Badge>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Factors:</span> {dept.factors.join(", ")}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Productivity Predictions */}
      <Card>
        <CardHeader>
          <CardTitle>Productivity Predictions</CardTitle>
          <CardDescription>6-month productivity forecast</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceForecasting.productivityPredictions || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="predicted" stroke="#3b82f6" name="Predicted" strokeWidth={2} />
              <Line type="monotone" dataKey="actual" stroke="#10b981" name="Actual" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Risks */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Risks</CardTitle>
          <CardDescription>Potential threats to team performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {performanceForecasting.performanceRisks?.map((risk: any, idx: number) => (
              <div key={idx} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{risk.risk}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{risk.probability}% probability</Badge>
                    <Badge variant="outline" className={
                      risk.impact === "high" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    }>
                      {risk.impact} impact
                    </Badge>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Mitigation:</span> {risk.mitigation}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Improvement Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle>Improvement Opportunities</CardTitle>
          <CardDescription>High-impact initiatives to boost performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {performanceForecasting.improvementOpportunities?.map((opp: any, idx: number) => (
              <div key={idx} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium">{opp.opportunity}</div>
                    <div className="text-xs text-green-600">{opp.potentialGain}</div>
                  </div>
                  <Badge variant="outline">ROI: {opp.roi}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>Investment: {opp.investment}</div>
                  <div>Timeline: {opp.timeline}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
