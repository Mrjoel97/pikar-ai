import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface CapacityTabProps {
  capacityPlanning: any;
}

export function CapacityTab({ capacityPlanning }: CapacityTabProps) {
  if (!capacityPlanning) {
    return <div className="text-sm text-muted-foreground">Loading capacity data...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">Current Capacity</div>
            <div className="text-2xl font-bold">{capacityPlanning.currentCapacity || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">Q4 Projected Demand</div>
            <div className="text-2xl font-bold">
              {Math.round(capacityPlanning.projectedDemand?.[3]?.demand || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">Q4 Capacity Gap</div>
            <div className="text-2xl font-bold text-red-600">
              {capacityPlanning.capacityGap?.[3]?.gap || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Utilization Forecast */}
      <Card>
        <CardHeader>
          <CardTitle>Utilization Forecast</CardTitle>
          <CardDescription>Projected capacity utilization over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={capacityPlanning.utilizationForecast || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="utilization" stroke="#3b82f6" name="Utilization %" strokeWidth={2} />
              <Line type="monotone" dataKey="capacity" stroke="#10b981" name="Capacity" strokeWidth={2} />
              <Line type="monotone" dataKey="demand" stroke="#f59e0b" name="Demand" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Capacity Gap Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Quarterly Capacity Gap</CardTitle>
          <CardDescription>Projected shortfalls by quarter</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {capacityPlanning.capacityGap?.map((gap: any) => (
              <div key={gap.quarter} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">{gap.quarter}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{gap.gap} employees short</span>
                  <Badge variant="outline" className={
                    gap.severity === "critical" ? "bg-red-100 text-red-700" :
                    gap.severity === "high" ? "bg-orange-100 text-orange-700" :
                    gap.severity === "medium" ? "bg-yellow-100 text-yellow-700" :
                    "bg-blue-100 text-blue-700"
                  }>
                    {gap.severity}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scaling Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Scaling Recommendations</CardTitle>
          <CardDescription>Actions to address capacity gaps</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {capacityPlanning.scalingRecommendations?.map((rec: any, idx: number) => (
              <div key={idx} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{rec.action}</span>
                  <Badge variant="outline">${rec.cost.toLocaleString()}</Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div><span className="font-medium">Rationale:</span> {rec.rationale}</div>
                  <div><span className="font-medium">Impact:</span> {rec.impact}</div>
                  <div><span className="font-medium">Timeline:</span> {rec.timeline}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
