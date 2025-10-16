import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, TrendingUp, Users, Activity, RefreshCw } from "lucide-react";

interface SocialCommandCenterProps {
  businessId: Id<"businesses"> | null;
}

export function SocialCommandCenter({ businessId }: SocialCommandCenterProps) {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const [refreshKey, setRefreshKey] = useState(0);

  // Early return before any hooks if no businessId
  if (!businessId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Sign in to access the Social Command Center</p>
        </CardContent>
      </Card>
    );
  }

  // Map time range to minutes for crisis time window
  const timeWindowMinutes =
    timeRange === "7d" ? 7 * 24 * 60 : timeRange === "90d" ? 90 * 24 * 60 : 30 * 24 * 60;

  // Multi-brand metrics use selected timeRange
  const multiBrand = useQuery(
    api.socialAnalytics.getMultiBrandMetrics,
    { businessId, timeRange }
  );

  // Cross-platform summary uses selected timeRange
  const crossPlatform = useQuery(
    api.socialAnalytics.getCrossPlatformSummary,
    { businessId, timeRange }
  );

  // Crisis detection uses time window mapped from timeRange (minutes)
  const crisisSummary = useQuery(
    api.crisisManagement.detectCrisis,
    { businessId, timeWindow: timeWindowMinutes }
  );

  // NEW: Fetch crisis playbooks
  const playbooks = useQuery(
    api.crisisManagement.getCrisisPlaybooks,
    { businessId }
  );

  // NEW: Fetch resolution tracking
  const resolutionTracking = useQuery(
    api.crisisManagement.getCrisisResolutionTracking,
    { businessId }
  );

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const criticalAlerts = crisisSummary?.alerts.filter((a: any) => a.severity === "critical") || [];
  const highAlerts = crisisSummary?.alerts.filter((a: any) => a.severity === "high") || [];

  return (
    <div className="space-y-4">
      {/* Crisis Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical Crisis Alert</AlertTitle>
          <AlertDescription>
            {criticalAlerts[0].message}
            <Button variant="outline" size="sm" className="ml-4">
              Respond Now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Social Command Center</h2>
          <p className="text-sm text-muted-foreground">Multi-brand social media monitoring and crisis management</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2">
        {(["7d", "30d", "90d"] as const).map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange(range)}
          >
            {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
          </Button>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="brands">Multi-Brand</TabsTrigger>
          <TabsTrigger value="crisis">Crisis Management</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="playbooks">Playbooks</TabsTrigger>
          <TabsTrigger value="resolution">Resolution Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{multiBrand?.totals.posts || 0}</div>
                <p className="text-xs text-muted-foreground">Across all brands</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(multiBrand?.totals.impressions || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Impressions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(multiBrand?.totals.engagements || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Total interactions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Crisis Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{crisisSummary?.summary.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {crisisSummary?.summary.critical || 0} critical
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="brands" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Brand Performance Comparison</CardTitle>
              <CardDescription>Compare metrics across all your brands</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {multiBrand?.brands.map((brand: any) => (
                  <div key={brand.brandId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: brand.brandColor }}
                      />
                      <div>
                        <p className="font-medium">{brand.brandName}</p>
                        <p className="text-sm text-muted-foreground">{brand.posts} posts</p>
                      </div>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <div>
                        <p className="text-muted-foreground">Impressions</p>
                        <p className="font-medium">{brand.impressions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Engagement</p>
                        <p className="font-medium">{brand.engagements.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Rate</p>
                        <p className="font-medium">{brand.engagementRate}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crisis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Crisis Alerts</CardTitle>
              <CardDescription>Real-time monitoring and threat detection</CardDescription>
            </CardHeader>
            <CardContent>
              {crisisSummary?.alerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active alerts. All systems normal.</p>
              ) : (
                <div className="space-y-3">
                  {crisisSummary?.alerts.map((alert: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg">
                      <Badge
                        variant={
                          alert.severity === "critical"
                            ? "destructive"
                            : alert.severity === "high"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {alert.severity}
                      </Badge>
                      <div className="flex-1">
                        <p className="font-medium">{alert.type.replace(/_/g, " ").toUpperCase()}</p>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        Investigate
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform Status</CardTitle>
              <CardDescription>Connected platforms and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {crossPlatform?.platforms.map((platform: any) => (
                  <div key={platform.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={platform.connected ? "default" : "secondary"}>
                        {platform.connected ? "Connected" : "Not Connected"}
                      </Badge>
                      <p className="font-medium capitalize">{platform.name}</p>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Posts</p>
                        <p className="font-medium">{platform.posts}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg Engagement</p>
                        <p className="font-medium">{platform.avgEngagement}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="playbooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Crisis Response Playbooks</CardTitle>
              <CardDescription>Pre-defined response strategies for different crisis types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {playbooks?.map((playbook: any) => (
                  <div key={playbook.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{playbook.name}</h3>
                        <p className="text-sm text-muted-foreground">Duration: {playbook.estimatedDuration}</p>
                      </div>
                      <Badge>{playbook.crisisType}</Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Response Steps:</p>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        {playbook.steps.map((step: string, idx: number) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                      <div className="mt-3">
                        <p className="text-sm font-medium">Stakeholders:</p>
                        <div className="flex gap-2 mt-1">
                          {playbook.stakeholders.map((s: string) => (
                            <Badge key={s} variant="outline">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Crisis Resolution Tracking</CardTitle>
              <CardDescription>Track resolution times and outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {resolutionTracking?.map((track: any) => (
                  <div key={track.alertId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{track.type.replace(/_/g, " ").toUpperCase()}</p>
                      <p className="text-sm text-muted-foreground">
                        Status: {track.status} | 
                        {track.timeToResolve ? ` Resolved in ${Math.floor(track.timeToResolve / (60 * 60 * 1000))}h` : " In progress"}
                      </p>
                    </div>
                    <Badge variant={track.status === "resolved" ? "default" : "secondary"}>
                      {track.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}