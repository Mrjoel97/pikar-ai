import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { DollarSign, TrendingUp } from "lucide-react";

interface CostForecastingProps {
  businessId: Id<"businesses">;
  agentId?: Id<"aiAgents">;
}

export function CostForecasting({ businessId, agentId }: CostForecastingProps) {
  const forecast30 = useQuery(
    api.agentPerformance.costForecasting.getCostForecast,
    { businessId, agentId, days: 30 }
  );

  const forecast90 = useQuery(
    api.agentPerformance.costForecasting.getCostForecast,
    { businessId, agentId, days: 90 }
  );

  const scenarios = useQuery(
    api.agentPerformance.costForecasting.getCostOptimizationScenarios,
    { businessId, agentId }
  );

  const roiProjections = useQuery(
    api.agentPerformance.costForecasting.getROIProjections,
    { businessId, agentId, months: 12 }
  );

  return (
    <div className="space-y-4">
      <Tabs defaultValue="30d">
        <TabsList>
          <TabsTrigger value="30d">30 Days</TabsTrigger>
          <TabsTrigger value="90d">90 Days</TabsTrigger>
        </TabsList>

        <TabsContent value="30d" className="space-y-4">
          {forecast30?.map((forecast: any) => (
            <Card key={forecast.agentId}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  {forecast.agentName} - 30 Day Forecast
                </CardTitle>
                <CardDescription>
                  Total forecasted cost: ${forecast.totalForecastedCost.toFixed(2)} • {(forecast.confidence * 100).toFixed(0)}% confidence
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={forecast.dailyForecasts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="cost" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="90d" className="space-y-4">
          {forecast90?.map((forecast: any) => (
            <Card key={forecast.agentId}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  {forecast.agentName} - 90 Day Forecast
                </CardTitle>
                <CardDescription>
                  Total forecasted cost: ${forecast.totalForecastedCost.toFixed(2)} • {(forecast.confidence * 100).toFixed(0)}% confidence
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={forecast.dailyForecasts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="cost" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Cost Optimization Scenarios</CardTitle>
          <CardDescription>Potential cost reduction strategies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {scenarios?.map((scenario: any) => (
              <div key={scenario.agentId} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{scenario.agentName}</h4>
                  <div className="text-sm">
                    Current: <span className="font-bold">${scenario.currentMonthlyCost.toFixed(2)}/mo</span>
                  </div>
                </div>
                {scenario.scenarios.map((s: any, idx: number) => (
                  <div key={idx} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-sm text-muted-foreground">{s.description}</div>
                      </div>
                      <Badge variant="outline" className="text-green-600">
                        ${s.monthlySavings.toFixed(2)}/mo
                      </Badge>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <Badge variant="secondary">Implementation: {s.implementation}</Badge>
                      <Badge variant="secondary">Impact: {s.impact}</Badge>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between font-medium">
                    <span>Total Potential Savings</span>
                    <span className="text-green-600">${scenario.totalPotentialSavings.toFixed(2)}/mo</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            ROI Projections
          </CardTitle>
          <CardDescription>12-month return on investment forecast</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {roiProjections?.map((projection: any) => (
              <div key={projection.agentId}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{projection.agentName}</h4>
                  <div className="text-sm">
                    Current ROI: <span className="font-bold">{projection.currentMonthlyROI.toFixed(1)}%</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={projection.projections}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="roi" stroke="#82ca9d" name="Monthly ROI %" strokeWidth={2} />
                    <Line type="monotone" dataKey="cumulativeROI" stroke="#8884d8" name="Cumulative ROI %" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
                {projection.breakEvenMonth > 0 && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Break-even point: Month {projection.breakEvenMonth}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
