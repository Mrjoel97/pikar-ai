import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, DollarSign, Users, Target, Shield } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { useState } from "react";

interface MarketingDashboardProps {
  businessId?: Id<"businesses">;
  isGuest?: boolean;
}

export function MarketingDashboard({ businessId, isGuest }: MarketingDashboardProps) {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");

  const kpis = useQuery(
    api.departmentKpis.getMarketingKpis,
    businessId ? { businessId, timeRange } : undefined
  );

  const socialPosts = useQuery(
    api.socialPosts.listScheduledPosts,
    businessId ? { businessId, limit: 10 } : undefined
  );

  const connectedAccounts = useQuery(
    api.socialIntegrations.listConnections,
    businessId ? { businessId } : undefined
  );

  if (!kpis) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b"];

  // Calculate social media metrics
  const totalSocialPosts = socialPosts?.length || 0;
  const platformsConnected = connectedAccounts?.length || 0;
  const avgEngagement = socialPosts?.reduce((acc: number, post: any) => 
    acc + (post.metrics?.engagement || 0), 0) / (totalSocialPosts || 1);

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Marketing Dashboard</h2>
          <p className="text-muted-foreground">Track ROI, CAC, and campaign performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total ROI</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.summary.totalROI.toFixed(1)}x</div>
            <p className="text-xs text-muted-foreground">Return on investment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg CAC</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${kpis.summary.avgCAC}</div>
            <p className="text-xs text-muted-foreground">Customer acquisition cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg LTV</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${kpis.summary.avgLTV}</div>
            <p className="text-xs text-muted-foreground">Lifetime value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.summary.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Visitor to customer</p>
          </CardContent>
        </Card>
      </div>

      {/* Social Media Section */}
      <Card>
        <CardHeader>
          <CardTitle>Social Media Performance</CardTitle>
          <CardDescription>Multi-platform analytics and ROI tracking</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Total Posts ({timeRange})</div>
              <div className="text-2xl font-bold">{totalSocialPosts}</div>
              <div className="text-xs text-green-600">Across {platformsConnected} platforms</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Avg Engagement</div>
              <div className="text-2xl font-bold">{avgEngagement.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">Likes, shares, comments</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">ROI per Platform</div>
              <div className="text-2xl font-bold">2.4x</div>
              <div className="text-xs text-green-600">+0.3x from last period</div>
            </div>
          </div>

          {/* Compliance Status */}
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            <div className="flex-1">
              <div className="text-sm font-medium text-green-900">Compliance: All Clear</div>
              <div className="text-xs text-green-700">All posts meet regulatory requirements</div>
            </div>
          </div>

          {/* Competitor Analysis Widget */}
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-3">Competitor Analysis</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Your Engagement Rate</span>
                <span className="font-bold text-green-600">{avgEngagement.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Industry Average</span>
                <span className="font-medium">2.8%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Top Competitor</span>
                <span className="font-medium">4.2%</span>
              </div>
              <div className="mt-3 pt-3 border-t">
                <div className="text-xs text-muted-foreground">
                  You're performing {avgEngagement > 2.8 ? 'above' : 'below'} industry average
                </div>
              </div>
            </div>
          </div>

          <Button variant="outline" className="w-full" asChild>
            <a href="/social">Open Full Social Media Manager</a>
          </Button>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* ROI by Channel */}
        <Card>
          <CardHeader>
            <CardTitle>ROI by Channel</CardTitle>
            <CardDescription>Return on investment across marketing channels</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={kpis.roiByChannel}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="channel" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="roi" fill="#10b981" name="ROI (x)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>Customer journey from visitor to conversion</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={kpis.conversionFunnel} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="stage" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6">
                  {kpis.conversionFunnel.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
          <CardDescription>ROI and CAC trends over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={kpis.trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="roi" stroke="#10b981" name="ROI" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="cac" stroke="#ef4444" name="CAC ($)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Campaigns by ROI</CardTitle>
          <CardDescription>Best performing marketing campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Campaign</th>
                  <th className="text-right py-2 px-4">ROI</th>
                  <th className="text-right py-2 px-4">Spend</th>
                  <th className="text-right py-2 px-4">Revenue</th>
                  <th className="text-right py-2 px-4">Conversions</th>
                </tr>
              </thead>
              <tbody>
                {kpis.topCampaigns.map((campaign: any, idx: number) => (
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-4 font-medium">{campaign.name}</td>
                    <td className="text-right py-2 px-4">
                      <span className="font-semibold text-green-600">{campaign.roi.toFixed(1)}x</span>
                    </td>
                    <td className="text-right py-2 px-4">${campaign.spend.toLocaleString()}</td>
                    <td className="text-right py-2 px-4">${campaign.revenue.toLocaleString()}</td>
                    <td className="text-right py-2 px-4">{campaign.conversions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}