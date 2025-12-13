import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

interface PredictivePerformanceProps {
  businessId: Id<"businesses">;
  agentId?: Id<"aiAgents">;
}

export function PredictivePerformance({ businessId, agentId }: PredictivePerformanceProps) {
  const predictions = useQuery(
    api.agentPerformance.predictive.getPredictivePerformance,
    { businessId, agentId }
  );

  const forecast = useQuery(
    api.agentPerformance.predictive.getPerformanceForecast,
    agentId ? { businessId, agentId, days: 30 } : "skip"
  );

  const healthPredictions = useQuery(
    api.agentPerformance.predictive.getAgentHealthPredictions,
    { businessId }
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Performance Predictions</CardTitle>
          <CardDescription>ML-based performance forecasting</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {predictions?.map((pred: any) => (
              <div key={pred.agentId} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{pred.agentName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {pred.dataPoints} data points • {(pred.confidence * 100).toFixed(0)}% confidence
                    </p>
                  </div>
                  <Badge variant={pred.trend === "improving" ? "default" : pred.trend === "declining" ? "destructive" : "secondary"}>
                    {pred.trend === "improving" && <TrendingUp className="h-3 w-3 mr-1" />}
                    {pred.trend === "declining" && <TrendingDown className="h-3 w-3 mr-1" />}
                    {pred.trend}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Current Performance</div>
                    <div className="text-2xl font-bold">{pred.currentPerformance.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Predicted ({pred.forecastDays}d)</div>
                    <div className="text-2xl font-bold">{pred.predictedPerformance.toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {forecast && (
        <Card>
          <CardHeader>
            <CardTitle>30-Day Performance Forecast</CardTitle>
            <CardDescription>Predicted performance with confidence intervals</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={forecast.forecast}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Area type="monotone" dataKey="upperBound" stackId="1" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                <Area type="monotone" dataKey="predicted" stackId="2" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Area type="monotone" dataKey="lowerBound" stackId="3" stroke="#ffc658" fill="#ffc658" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Agent Health Predictions</CardTitle>
          <CardDescription>Predicted health status for next 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {healthPredictions?.map((health: any) => (
              <div key={health.agentId} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{health.agentName}</div>
                  <div className="text-sm text-muted-foreground">
                    Score: {health.healthScore.toFixed(0)}/100
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={health.currentHealth === "healthy" ? "default" : "destructive"}>
                    {health.currentHealth}
                  </Badge>
                  {health.predictedHealth !== health.currentHealth && (
                    <>
                      <span className="text-muted-foreground">→</span>
                      <Badge variant={health.predictedHealth === "healthy" ? "default" : "destructive"}>
                        {health.predictedHealth}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
