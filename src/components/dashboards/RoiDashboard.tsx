import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp, Clock, DollarSign, Target, Settings, Zap, Award, Activity } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PredictiveROIChart } from "@/components/analytics/PredictiveROIChart";
import { ScenarioPlanner } from "@/components/analytics/ScenarioPlanner";
import { Sparkles, AlertCircle } from "lucide-react";

interface RoiDashboardProps {
  businessId: string;
  userId: string;
}

export function RoiDashboard({ businessId, userId }: RoiDashboardProps) {
  const [period, setPeriod] = useState<30 | 60 | 90>(30);
  const [showSettings, setShowSettings] = useState(false);
  const [hourlyRateInput, setHourlyRateInput] = useState("");

  const roiData = useQuery(
    api.roiCalculations.calculateTimeSavedROI,
    businessId && userId ? { businessId: businessId as any, userId: userId as any, days: period } : "skip"
  );

  const updateHourlyRate = useMutation(api.roiCalculations.updateHourlyRate);

  const handleUpdateHourlyRate = async () => {
    const rate = parseFloat(hourlyRateInput);
    if (isNaN(rate) || rate <= 0) {
      toast.error("Please enter a valid hourly rate");
      return;
    }

    try {
      await updateHourlyRate({
        businessId: businessId as any,
        userId: userId as any,
        hourlyRate: rate,
      });
      toast.success("Hourly rate updated successfully");
      setShowSettings(false);
      setHourlyRateInput("");
    } catch (error) {
      toast.error("Failed to update hourly rate");
    }
  };

  // Add: Predictive analytics queries
  const predictiveROI = useQuery(
    api.analytics.predictiveROI.getPredictiveROI,
    businessId && userId ? { businessId: businessId as any, userId: userId as any, forecastDays: 90 } : "skip"
  );

  const optimizationSuggestions = useQuery(
    api.analytics.optimization.getROIOptimizationSuggestions,
    businessId && userId ? { businessId: businessId as any, userId: userId as any } : "skip"
  );

  const historicalTrends = useQuery(
    api.roiCalculations.getHistoricalROITrends,
    businessId && userId ? { businessId: businessId as any, userId: userId as any, months: 6 } : "skip"
  );

  if (!roiData) {
    return (
      <Card className="neu-raised">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            ROI Dashboard
          </CardTitle>
          <CardDescription>Loading ROI metrics...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const roiColor = roiData.roiPercentage >= 100 ? "text-green-600" : roiData.roiPercentage >= 50 ? "text-yellow-600" : "text-orange-600";
  const roiStatus = roiData.roiPercentage >= 100 ? "Exceeding" : roiData.roiPercentage >= 50 ? "On Track" : "Growing";

  return (
    <Card className="neu-raised">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              ROI Dashboard with Predictive Analytics
            </CardTitle>
            <CardDescription>Time saved converted to revenue impact with AI-powered forecasting</CardDescription>
          </div>
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ROI Settings</DialogTitle>
                <DialogDescription>Configure your hourly rate for ROI calculations</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Your Hourly Rate ($)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    placeholder={`Current: $${roiData.hourlyRate}/hr`}
                    value={hourlyRateInput}
                    onChange={(e) => setHourlyRateInput(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    This rate is used to calculate the monetary value of time saved
                  </p>
                </div>
                <Button onClick={handleUpdateHourlyRate} className="w-full">
                  Update Rate
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="forecast">Forecast</TabsTrigger>
            <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
            <TabsTrigger value="optimize">Optimize</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Period Selector */}
            <div className="flex gap-2">
              {[30, 60, 90].map((days) => (
                <Button
                  key={days}
                  variant={period === days ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPeriod(days as 30 | 60 | 90)}
                >
                  {days} Days
                </Button>
              ))}
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Time Saved
                </div>
                <div className="text-2xl font-bold">{roiData.timeSavedHours}h</div>
                <div className="text-xs text-muted-foreground">{roiData.timeSavedMinutes} minutes total</div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  Estimated Value
                </div>
                <div className="text-2xl font-bold">${roiData.estimatedRevenue.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">@ ${roiData.hourlyRate}/hr</div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Target className="h-4 w-4" />
                  Actual Revenue
                </div>
                <div className="text-2xl font-bold">${roiData.actualRevenue.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Tracked revenue</div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  ROI
                </div>
                <div className={`text-2xl font-bold ${roiColor}`}>{roiData.roiPercentage}%</div>
                <Badge variant={roiData.roiPercentage >= 100 ? "default" : "secondary"} className="text-xs">
                  {roiStatus}
                </Badge>
              </div>
            </div>

            {/* Performance Breakdown */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Performance Breakdown
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Daily Avg Time Saved</div>
                  <div className="text-lg font-bold">
                    {Math.round((roiData.timeSavedMinutes / period) / 60 * 10) / 10}h
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Daily Avg Revenue</div>
                  <div className="text-lg font-bold text-green-600">
                    ${Math.round(roiData.actualRevenue / period)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Efficiency Gain</div>
                  <div className="text-lg font-bold text-blue-600">
                    {Math.round((roiData.timeSavedHours / (period * 8)) * 100)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={roiData.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="timeSaved"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="Time Saved (min)"
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Revenue ($)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Historical Trends */}
            {historicalTrends && historicalTrends !== "skip" && (
              <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  6-Month Trend Analysis
                </h4>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">Average ROI</div>
                    <div className="text-lg font-bold">{historicalTrends.summary.averageROI}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Trend</div>
                    <div className={`text-lg font-bold ${historicalTrends.summary.trend > 0 ? "text-green-600" : "text-red-600"}`}>
                      {historicalTrends.summary.trend > 0 ? "+" : ""}{historicalTrends.summary.trend}%
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Direction</div>
                    <Badge variant={historicalTrends.summary.trendDirection === "up" ? "default" : "secondary"}>
                      {historicalTrends.summary.trendDirection}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Insights */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Award className="h-4 w-4" />
                ROI Insights
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                {roiData.timeSavedHours > 0 && (
                  <li>• You've saved {roiData.timeSavedHours} hours in the last {period} days</li>
                )}
                {roiData.roiPercentage >= 100 && (
                  <li>• Your actual revenue exceeds estimated value - excellent performance!</li>
                )}
                {roiData.roiPercentage < 50 && (
                  <li>• Consider tracking more revenue events to see full ROI impact</li>
                )}
                {roiData.estimatedRevenue > 0 && (
                  <li>• Time saved is worth ${roiData.estimatedRevenue.toLocaleString()} at your current rate</li>
                )}
                {Math.round((roiData.timeSavedHours / (period * 8)) * 100) > 10 && (
                  <li>• You're gaining {Math.round((roiData.timeSavedHours / (period * 8)) * 100)}% efficiency - keep it up!</li>
                )}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="forecast" className="space-y-6">
            {predictiveROI && predictiveROI !== "skip" ? (
              <PredictiveROIChart
                historical={predictiveROI.historical}
                forecast={predictiveROI.forecast}
                trends={predictiveROI.trends}
              />
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Loading predictive analytics...
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="scenarios" className="space-y-6">
            {businessId && userId ? (
              <ScenarioPlanner
                businessId={businessId as any}
                userId={userId as any}
              />
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Sign in to access scenario planning
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="optimize" className="space-y-6">
            {optimizationSuggestions && optimizationSuggestions !== "skip" && optimizationSuggestions.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    AI-Powered Optimization Suggestions
                  </CardTitle>
                  <CardDescription>
                    Personalized recommendations to maximize your ROI
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {optimizationSuggestions.map((suggestion: any, idx: number) => {
                    const priorityColor = 
                      suggestion.priority === "high" ? "text-red-500" :
                      suggestion.priority === "medium" ? "text-orange-500" : "text-blue-500";
                    
                    return (
                      <div key={idx} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <AlertCircle className={`h-4 w-4 ${priorityColor}`} />
                              <h4 className="font-semibold">{suggestion.title}</h4>
                              <Badge variant={suggestion.priority === "high" ? "destructive" : "secondary"}>
                                {suggestion.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {suggestion.description}
                            </p>
                            <div className="bg-blue-50 dark:bg-blue-950 rounded p-2 mb-2">
                              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                💡 Potential Impact: {suggestion.potentialImpact}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs font-semibold text-muted-foreground">Action Items:</div>
                          <ul className="text-sm space-y-1">
                            {suggestion.actionItems.map((item: string, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-green-600">✓</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <Sparkles className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Keep tracking your activities to unlock AI-powered optimization suggestions
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}