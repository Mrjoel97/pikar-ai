import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import * as React from "react";
import { Play, TrendingUp } from "lucide-react";

interface RiskTrendChartProps {
  trendData: Array<{ date: string; score: number; count: number }>;
  byCategory: Record<string, number>;
  newRisks: number;
  mitigatedRisks: number;
  avgRiskScore: number;
  period: string;
  businessId?: Id<"businesses">;
}

export function RiskTrendChart({ 
  trendData, 
  byCategory, 
  newRisks, 
  mitigatedRisks, 
  avgRiskScore,
  period,
  businessId
}: RiskTrendChartProps) {
  const [activeTab, setActiveTab] = React.useState("trends");
  const [scenarioName, setScenarioName] = React.useState("Market Downturn");
  const [probabilityShift, setProbabilityShift] = React.useState(1);

  // Fetch advanced analytics
  const forecast = useQuery(api.riskAnalytics.getAdvancedTrendForecast,
    businessId ? { businessId, forecastDays: 30 } : "skip"
  );

  const scenarioResult = useQuery(api.riskAnalytics.simulateRiskScenario,
    businessId ? {
      businessId,
      scenario: {
        name: scenarioName,
        categoryImpact: { operational: 1.5, financial: 1.3, compliance: 1.2 },
        probabilityShift: probabilityShift,
      }
    } : "skip"
  );

  const categories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Trend Analysis</CardTitle>
        <CardDescription>
          {period} overview • Avg Score: {avgRiskScore}
          {forecast?.seasonalityDetected && (
            <Badge variant="outline" className="ml-2">Seasonal Pattern Detected</Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="forecast">Forecast</TabsTrigger>
            <TabsTrigger value="scenario">Scenario</TabsTrigger>
          </TabsList>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{newRisks}</div>
                <div className="text-xs text-muted-foreground">New Risks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{mitigatedRisks}</div>
                <div className="text-xs text-muted-foreground">Mitigated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{avgRiskScore}</div>
                <div className="text-xs text-muted-foreground">Avg Score</div>
              </div>
            </div>

            {/* Trend Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: any) => [value.toFixed(2), "Risk Score"]}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Risk Score"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Top Risk Categories */}
            <div>
              <h4 className="text-sm font-medium mb-3">Top Risk Categories</h4>
              <div className="space-y-2">
                {categories.map(([category, score]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{category}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-500 rounded-full"
                          style={{ width: `${Math.min(100, (score / 25) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{score.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Forecast Tab */}
          <TabsContent value="forecast" className="space-y-6">
            {forecast ? (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{forecast.historicalAverage}</div>
                        <div className="text-xs text-muted-foreground mt-1">Historical Avg</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{(forecast.trendStrength * 100).toFixed(0)}%</div>
                        <div className="text-xs text-muted-foreground mt-1">Trend Strength</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Badge variant={forecast.seasonalityDetected ? "default" : "secondary"}>
                          {forecast.seasonalityDetected ? "Seasonal" : "Non-Seasonal"}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">Pattern</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    30-Day Forecast with Confidence Intervals
                  </h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={forecast.forecast}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return `${date.getMonth() + 1}/${date.getDate()}`;
                          }}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="upperBound" 
                          stackId="1"
                          stroke="#94a3b8" 
                          fill="#e2e8f0"
                          name="Upper Bound"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="lowerBound" 
                          stackId="1"
                          stroke="#94a3b8" 
                          fill="#f1f5f9"
                          name="Lower Bound"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="forecastScore" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          name="Forecast"
                          dot={{ r: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Loading forecast data...
              </div>
            )}
          </TabsContent>

          {/* Scenario Tab */}
          <TabsContent value="scenario" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Scenario Name</Label>
                <Input 
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  placeholder="e.g., Market Downturn, Regulatory Change"
                />
              </div>

              <div className="space-y-2">
                <Label>Probability Shift (-2 to +2)</Label>
                <div className="flex items-center gap-4">
                  <Input 
                    type="number"
                    min={-2}
                    max={2}
                    step={0.5}
                    value={probabilityShift}
                    onChange={(e) => setProbabilityShift(parseFloat(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">
                    {probabilityShift > 0 ? "Increase" : probabilityShift < 0 ? "Decrease" : "No change"} in risk probability
                  </span>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs text-blue-700">
                  This scenario applies a {probabilityShift > 0 ? "+" : ""}{probabilityShift} shift to risk probabilities 
                  and multiplies operational risks by 1.5x, financial by 1.3x, and compliance by 1.2x.
                </p>
              </div>
            </div>

            {scenarioResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{scenarioResult.currentRiskScore}</div>
                        <div className="text-xs text-muted-foreground mt-1">Current Score</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{scenarioResult.projectedRiskScore}</div>
                        <div className="text-xs text-muted-foreground mt-1">Projected Score</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className={scenarioResult.percentageChange > 20 ? "border-red-500" : ""}>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${scenarioResult.scoreDelta > 0 ? "text-red-600" : "text-green-600"}`}>
                        {scenarioResult.scoreDelta > 0 ? "+" : ""}{scenarioResult.scoreDelta}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {scenarioResult.percentageChange > 0 ? "+" : ""}{scenarioResult.percentageChange}% change
                      </div>
                      <Badge variant={scenarioResult.percentageChange > 20 ? "destructive" : "default"} className="mt-2">
                        {scenarioResult.impactedRisks} risks affected
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {scenarioResult.recommendations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">Recommendations</h4>
                    <div className="space-y-2">
                      {scenarioResult.recommendations.map((rec, idx) => (
                        <div key={idx} className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                          <p className="text-sm text-amber-900">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}