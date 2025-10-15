import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, DollarSign, Target, BarChart3 } from "lucide-react";
import { useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";

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

const MODEL_LABELS: Record<string, string> = {
  first_touch: "First Touch",
  last_touch: "Last Touch",
  linear: "Linear",
  time_decay: "Time Decay",
  position_based: "Position-Based",
};

export function RevenueAttribution({ businessId }: RevenueAttributionProps) {
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
              <BarChart3 className="h-4 w-4" />
              Avg Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {attributionReport.totalConversions > 0
                ? Math.round(attributionReport.totalRevenue / attributionReport.totalConversions)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per conversion</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="attribution" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="attribution">Channel Attribution</TabsTrigger>
          <TabsTrigger value="roi">Channel ROI</TabsTrigger>
          <TabsTrigger value="comparison">Model Comparison</TabsTrigger>
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
        </TabsContent>

        {/* Channel ROI Tab */}
        <TabsContent value="roi" className="space-y-4">
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

                {channelROI.channels.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No ROI data available yet. Channel costs and revenue will appear here as data is collected.
                  </div>
                )}
              </div>
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
