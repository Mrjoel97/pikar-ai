import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Mail, TrendingUp, MousePointer, Eye, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface EmailCampaignAnalyticsProps {
  businessId: Id<"businesses">;
}

export function EmailCampaignAnalytics({ businessId }: EmailCampaignAnalyticsProps) {
  const [selectedCampaigns, setSelectedCampaigns] = useState<Id<"emailCampaigns">[]>([]);
  
  const metrics = useQuery(api.emailAnalytics.getBusinessCampaignMetrics, {
    businessId,
    limit: 20,
  });

  const comparison = useQuery(
    api.emailAnalytics.compareCampaigns,
    selectedCampaigns.length > 0 ? { campaignIds: selectedCampaigns } : "skip"
  );

  if (!metrics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Loading campaign analytics...</p>
        </CardContent>
      </Card>
    );
  }

  const { campaigns, totals } = metrics;

  const toggleCampaignSelection = (campaignId: Id<"emailCampaigns">) => {
    setSelectedCampaigns((prev) =>
      prev.includes(campaignId)
        ? prev.filter((id) => id !== campaignId)
        : [...prev, campaignId]
    );
  };

  // Prepare chart data
  const chartData = campaigns.map((c) => ({
    name: c.subject.substring(0, 20) + (c.subject.length > 20 ? "..." : ""),
    openRate: c.openRate,
    clickRate: c.clickRate,
    sent: c.sent,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalSent}</div>
            <p className="text-xs text-muted-foreground">
              Across {campaigns.length} campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.avgOpenRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {totals.totalOpened} total opens
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Click Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.avgClickRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {totals.totalClicked} total clicks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totals.avgOpenRate > 20 ? (
                <span className="text-green-600 flex items-center gap-1">
                  <ArrowUpRight className="h-5 w-5" />
                  Good
                </span>
              ) : (
                <span className="text-amber-600 flex items-center gap-1">
                  <ArrowDownRight className="h-5 w-5" />
                  Fair
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Industry avg: 20-25%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="compare">Compare</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
              <CardDescription>Open and click rates across recent campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="openRate" fill="#10b981" name="Open Rate %" />
                  <Bar dataKey="clickRate" fill="#3b82f6" name="Click Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign List</CardTitle>
              <CardDescription>Detailed metrics for each campaign</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.campaignId}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Checkbox
                        checked={selectedCampaigns.includes(campaign.campaignId)}
                        onCheckedChange={() => toggleCampaignSelection(campaign.campaignId)}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{campaign.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(campaign.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{campaign.sent} sent</p>
                        <p className="text-xs text-muted-foreground">
                          {campaign.opened} opens · {campaign.clicked} clicks
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">
                          <Eye className="h-3 w-3 mr-1" />
                          {campaign.openRate.toFixed(1)}%
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <MousePointer className="h-3 w-3 mr-1" />
                          {campaign.clickRate.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
                {campaigns.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No campaigns yet. Create your first campaign to see analytics.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compare" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Comparison</CardTitle>
              <CardDescription>
                Select campaigns from the list to compare their performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedCampaigns.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Select at least one campaign from the Campaigns tab to compare
                </p>
              ) : comparison ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={comparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="subject"
                      tickFormatter={(value) =>
                        value.substring(0, 15) + (value.length > 15 ? "..." : "")
                      }
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="openRate"
                      stroke="#10b981"
                      name="Open Rate %"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="clickRate"
                      stroke="#3b82f6"
                      name="Click Rate %"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">Loading comparison...</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
