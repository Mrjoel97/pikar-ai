import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, DollarSign, Target, BarChart3, Route, Activity, TrendingDown } from "lucide-react";
import { useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface RevenueAttributionProps {
  businessId: Id<"businesses">;
}

const CHANNEL_COLORS: Record<string, string> = {
  email: "bg-blue-500",
  social: "bg-purple-500",
  paid: "bg-orange-500",
  referral: "bg-green-500",
  organic: "bg-teal-500",
  direct: "bg-gray-500",
};

const CHART_COLORS: Record<string, string> = {
  email: "#3b82f6",
  social: "#a855f7",
  paid: "#f97316",
  referral: "#10b981",
  organic: "#14b8a6",
  direct: "#6b7280",
};

const MODEL_LABELS: Record<string, string> = {
  first_touch: "First Touch",
  last_touch: "Last Touch",
  linear: "Linear",
  time_decay: "Time Decay",
  position_based: "Position-Based",
};

export default function RevenueAttribution({ businessId }: RevenueAttributionProps) {
  const [selectedModel, setSelectedModel] = useState<
    "first_touch" | "last_touch" | "linear" | "time_decay" | "position_based"
  >("linear");
  const [days, setDays] = useState(30);

  const attributionReport = useQuery(api.revenueAttribution.getAttributionReport, {
    businessId,
    model: selectedModel,
    days,
  });

  const channelROI = useQuery(api.revenueAttribution.getChannelROI, {
    businessId,
    days,
  });

  const multiTouchComparison = useQuery(api.revenueAttribution.getMultiTouchComparison, {
    businessId,
    days,
  });

  const customerJourneys = useQuery(api.revenueAttribution.getCustomerJourneys, {
    businessId,
    days,
  });

  const channelTrends = useQuery(api.revenueAttribution.getChannelTrends, {
    businessId,
    days,
  });

  const revenueForecast = useQuery(api.revenueAttribution.getRevenueForecast, {
    businessId,
    forecastDays: 30,
  });

  const performanceMetrics = useQuery(api.revenueAttribution.getChannelPerformanceMetrics, {
    businessId,
    days,
  });

  if (!attributionReport || !channelROI || !multiTouchComparison) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Attribution</CardTitle>
          <CardDescription>Loading attribution data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Attribution Model</label>
          <Select value={selectedModel} onValueChange={(v) => setSelectedModel(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(MODEL_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Time Period</label>
          <Select value={days.toString()} onValueChange={(v) => setDays(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${attributionReport.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{days} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Conversions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attributionReport.totalConversions}</div>
            <p className="text-xs text-muted-foreground mt-1">Total conversions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Overall ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{channelROI.overall.roi}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              ${channelROI.overall.profit.toLocaleString()} profit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Route className="h-4 w-4" />
              Avg Journey
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerJourneys?.avgTouchpoints || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Touchpoints</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="attribution" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="attribution">Attribution</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="journeys">Journeys</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        {/* Channel Attribution Tab */}
        <TabsContent value="attribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Channel Attribution - {MODEL_LABELS[selectedModel]}</CardTitle>
              <CardDescription>Revenue attributed to each channel using {MODEL_LABELS[selectedModel]} model</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {attributionReport.channels.map((channel: any) => (
                  <div key={channel.channel} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={CHANNEL_COLORS[channel.channel] || "bg-gray-500"}>
                          {channel.channel}
                        </Badge>
                        <span className="text-sm font-medium">{channel.percentage}%</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">${channel.revenue.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">
                          {channel.conversions} conversions
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${CHANNEL_COLORS[channel.channel] || "bg-gray-500"}`}
                        style={{ width: `${channel.percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Avg: ${channel.avgRevenuePerConversion.toLocaleString()} per conversion
                    </div>
                  </div>
                ))}

                {attributionReport.channels.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No attribution data available yet. Start tracking touchpoints and conversions to see channel performance.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Channel ROI */}
          <Card>
            <CardHeader>
              <CardTitle>Channel ROI Breakdown</CardTitle>
              <CardDescription>Return on investment for each marketing channel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {channelROI.channels.map((channel: any) => (
                  <div key={channel.channel} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge className={CHANNEL_COLORS[channel.channel] || "bg-gray-500"}>
                        {channel.channel}
                      </Badge>
                      <Badge variant={channel.roi > 0 ? "default" : "destructive"}>
                        {channel.roi > 0 ? "+" : ""}
                        {channel.roi}% ROI
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Revenue</div>
                        <div className="font-medium">${channel.revenue.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Cost</div>
                        <div className="font-medium">${channel.cost.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Profit</div>
                        <div className="font-medium">${channel.profit.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">CPA</div>
                        <div className="font-medium">${channel.cpa.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Channel Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Channel Metrics</CardTitle>
              <CardDescription>Detailed performance analysis by channel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceMetrics?.channels.map((channel: any) => (
                  <div key={channel.channel} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className={CHANNEL_COLORS[channel.channel] || "bg-gray-500"}>
                        {channel.channel}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{channel.conversionRate}% conversion rate</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-3 text-sm">
                      <div>
                        <div className="text-muted-foreground">Touchpoints</div>
                        <div className="font-semibold">{channel.touchpoints}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Conversions</div>
                        <div className="font-semibold">{channel.conversions}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Revenue</div>
                        <div className="font-semibold">${channel.revenue.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Avg Revenue</div>
                        <div className="font-semibold">${channel.avgRevenuePerConversion}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Time to Conv.</div>
                        <div className="font-semibold">{channel.avgTimeToConversionDays}d</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customer Journeys Tab */}
        <TabsContent value="journeys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5" />
                Top Customer Journey Paths
              </CardTitle>
              <CardDescription>Most common paths to conversion</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customerJourneys?.topPaths.map((journey: any, idx: number) => (
                  <div key={idx} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">#{idx + 1}</Badge>
                        <span className="text-sm font-mono">{journey.path}</span>
                      </div>
                      <Badge>{journey.count} conversions</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Total Revenue</div>
                        <div className="font-semibold">${journey.revenue.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Avg Revenue</div>
                        <div className="font-semibold">${journey.avgRevenue.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Avg Duration</div>
                        <div className="font-semibold">{journey.avgDurationDays} days</div>
                      </div>
                    </div>
                  </div>
                ))}

                {(!customerJourneys?.topPaths || customerJourneys.topPaths.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    No customer journey data available yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Channel Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends by Channel</CardTitle>
              <CardDescription>Daily revenue performance across channels</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={channelTrends?.trends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {Object.keys(CHART_COLORS).map((channel) => (
                    <Area
                      key={channel}
                      type="monotone"
                      dataKey={channel}
                      stackId="1"
                      stroke={CHART_COLORS[channel]}
                      fill={CHART_COLORS[channel]}
                      name={channel}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Forecast Tab */}
        <TabsContent value="forecast" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Forecast Confidence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{revenueForecast?.confidence || 0}%</div>
                <p className="text-xs text-muted-foreground mt-1">Based on historical data</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {revenueForecast?.trend === "increasing" ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : revenueForecast?.trend === "decreasing" ? (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  ) : (
                    <BarChart3 className="h-5 w-5 text-gray-600" />
                  )}
                  <span className="text-2xl font-bold capitalize">{revenueForecast?.trend || "stable"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Avg Daily Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${revenueForecast?.recentAvgRevenue?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>30-Day Revenue Forecast</CardTitle>
              <CardDescription>Predicted revenue with confidence intervals</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={revenueForecast?.forecast || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="predicted" stroke="#10b981" strokeWidth={2} name="Predicted" />
                  <Line type="monotone" dataKey="upper" stroke="#3b82f6" strokeDasharray="5 5" name="Upper Bound" />
                  <Line type="monotone" dataKey="lower" stroke="#ef4444" strokeDasharray="5 5" name="Lower Bound" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Model Comparison Tab */}
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Touch Attribution Comparison</CardTitle>
              <CardDescription>Compare how different attribution models distribute revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(multiTouchComparison.models).map(([model, channels]) => {
                  const totalRevenue = Object.values(channels as Record<string, number>).reduce(
                    (sum, rev) => sum + rev,
                    0
                  );

                  return (
                    <div key={model} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{MODEL_LABELS[model]}</h4>
                        <span className="text-sm text-muted-foreground">
                          ${Math.round(totalRevenue).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex gap-1 h-8 rounded-lg overflow-hidden">
                        {Object.entries(channels as Record<string, number>).map(([channel, revenue]) => {
                          const percentage = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
                          return (
                            <div
                              key={channel}
                              className={`${CHANNEL_COLORS[channel] || "bg-gray-500"} flex items-center justify-center text-xs text-white font-medium`}
                              style={{ width: `${percentage}%` }}
                              title={`${channel}: $${Math.round(revenue)} (${Math.round(percentage)}%)`}
                            >
                              {percentage > 10 && channel.slice(0, 3)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {Object.keys(multiTouchComparison.models).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No multi-touch data available yet. Attribution models will be compared here once conversions are tracked.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}