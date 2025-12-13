import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowRight, 
  Users, 
  TrendingUp, 
  Clock, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Info,
  Target,
  BarChart3,
  Filter
} from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { toast } from "sonner";
import { OptimizationRecommendations } from "./OptimizationRecommendations";

interface CustomerJourneyMapProps {
  businessId: Id<"businesses">;
}

const STAGE_CONFIG = {
  awareness: { label: "Awareness", color: "bg-blue-500", icon: Users },
  consideration: { label: "Consideration", color: "bg-purple-500", icon: Activity },
  decision: { label: "Decision", color: "bg-orange-500", icon: TrendingUp },
  retention: { label: "Retention", color: "bg-green-500", icon: Clock },
  advocacy: { label: "Advocacy", color: "bg-pink-500", icon: TrendingUp },
};

export function CustomerJourneyMap({ businessId }: CustomerJourneyMapProps) {
  const [selectedDays, setSelectedDays] = useState(30);
  
  // Core analytics queries
  const analytics = useQuery(api.customerJourney.getJourneyAnalytics, { 
    businessId, 
    days: selectedDays 
  });
  
  const touchpointAnalytics = useQuery(api.customerJourney.getTouchpointAnalytics, { 
    businessId, 
    days: selectedDays 
  });
  
  const funnelData = useQuery(api.customerJourney.getConversionFunnel, { 
    businessId, 
    days: selectedDays 
  });
  
  const dropoffAnalysis = useQuery(api.customerJourney.getDropoffAnalysis, { 
    businessId, 
    days: selectedDays 
  });
  
  const suggestions = useQuery(api.customerJourney.getOptimizationSuggestions, { 
    businessId 
  });

  // New analytics queries
  const dropoffPoints = useQuery(api.customerJourney.analytics.getDropoffPoints, {
    businessId,
    days: selectedDays,
  });

  const conversionRates = useQuery(api.customerJourney.analytics.getConversionRates, {
    businessId,
    days: selectedDays,
  });

  const optimizationRecommendations = useQuery(
    api.customerJourney.analytics.getOptimizationRecommendations,
    { businessId }
  );

  if (!analytics || !touchpointAnalytics || !funnelData || !dropoffAnalysis || !suggestions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Journey Map</CardTitle>
          <CardDescription>Loading journey analytics...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { stageDistribution, averageDurations, transitionFlow, totalContacts, recentTransitions } = analytics;

  return (
    <div className="space-y-6">
      {/* Time Range Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Customer Journey Analytics</h2>
        <div className="flex gap-2">
          {[7, 30, 90].map((days) => (
            <Button
              key={days}
              variant={selectedDays === days ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDays(days)}
            >
              {days}d
            </Button>
          ))}
        </div>
      </div>

      {/* AI-Powered Optimization Recommendations */}
      {optimizationRecommendations && optimizationRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              AI-Powered Optimization Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {optimizationRecommendations.map((rec: any, idx: number) => {
              const Icon = rec.type === "critical" ? AlertTriangle : 
                          rec.type === "warning" ? Info : CheckCircle;
              const colorClass = rec.type === "critical" ? "text-red-500" : 
                                rec.type === "warning" ? "text-orange-500" : "text-green-500";
              
              return (
                <div key={idx} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Icon className={`h-5 w-5 mt-0.5 ${colorClass}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{rec.title}</h4>
                      <Badge variant={rec.impact === "high" ? "destructive" : "secondary"}>
                        <span>{rec.impact} impact</span>
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{rec.description}</p>
                    <p className="text-sm font-medium text-blue-600">{rec.suggestion}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="touchpoints">Touchpoints</TabsTrigger>
          <TabsTrigger value="dropoffs">Drop-offs</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalContacts}</div>
                <p className="text-xs text-muted-foreground mt-1">Active in journey</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Recent Transitions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recentTransitions}</div>
                <p className="text-xs text-muted-foreground mt-1">Last {selectedDays} days</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Avg Touchpoints</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {touchpointAnalytics.averageTouchpointsPerContact.toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Per contact</p>
              </CardContent>
            </Card>
          </div>

          {/* Journey Stages Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Journey Stages</CardTitle>
              <CardDescription>Current distribution across customer journey</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-2">
                {Object.entries(STAGE_CONFIG).map(([stage, config], idx: number) => {
                  const count = stageDistribution[stage] || 0;
                  const percentage = totalContacts !== 0 ? Math.round((count / totalContacts) * 100) : 0;
                  const Icon = config.icon;

                  return (
                    <div key={stage} className="flex items-center gap-2">
                      <div className="flex-1 text-center">
                        <div className={`${config.color} text-white rounded-lg p-4 mb-2`}>
                          <Icon className="h-6 w-6 mx-auto mb-2" />
                          <div className="text-2xl font-bold">{count}</div>
                          <div className="text-xs opacity-90">{percentage}%</div>
                        </div>
                        <div className="text-sm font-medium">{config.label}</div>
                        {averageDurations[stage] !== 0 && averageDurations[stage] && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Avg: {averageDurations[stage]}d
                          </div>
                        )}
                      </div>
                      
                      {idx < Object.keys(STAGE_CONFIG).length - 1 && (
                        <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Conversion Rates */}
          {conversionRates && conversionRates.length !== 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Stage Conversion Rates</CardTitle>
                <CardDescription>Conversion performance between stages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {conversionRates.map((conversion: any) => (
                  <div key={`${conversion.from}-${conversion.to}`} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium capitalize">{conversion.from}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium capitalize">{conversion.to}</span>
                      </div>
                      <div className="text-right">
                        <Badge variant={conversion.rate >= 50 ? "default" : "secondary"}>
                          {conversion.rate}%
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {conversion.count} / {conversion.total}
                        </p>
                      </div>
                    </div>
                    <Progress value={conversion.rate} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Stage Transitions */}
          <Card>
            <CardHeader>
              <CardTitle>Stage Transitions</CardTitle>
              <CardDescription>Recent movement between stages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(transitionFlow).map(([fromStage, toStages]) => (
                  <div key={fromStage} className="space-y-2">
                    {Object.entries(toStages as Record<string, number>).map(([toStage, count]) => {
                      const fromConfig = fromStage === "none" 
                        ? { label: "New", color: "bg-gray-500" }
                        : STAGE_CONFIG[fromStage as keyof typeof STAGE_CONFIG];
                      const toConfig = STAGE_CONFIG[toStage as keyof typeof STAGE_CONFIG];

                      return (
                        <div key={`${fromStage}-${toStage}`} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <Badge className={fromConfig.color}>{fromConfig.label}</Badge>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <Badge className={toConfig.color}>{toConfig.label}</Badge>
                          <span className="ml-auto text-sm font-medium">{count} contacts</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
                
                {Object.keys(transitionFlow).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No transitions recorded yet. Stage transitions will appear here as contacts move through the journey.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversion Funnel Tab */}
        <TabsContent value="funnel" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Conversion Funnel Analysis
              </CardTitle>
              <CardDescription>
                Overall conversion rate: {funnelData.overallConversionRate.toFixed(1)}%
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {funnelData.funnel.map((stage: any, idx: number) => {
                const config = STAGE_CONFIG[stage.stage as keyof typeof STAGE_CONFIG];
                const Icon = config.icon;
                
                return (
                  <div key={stage.stage} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`${config.color} text-white rounded-lg p-2`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-semibold">{config.label}</div>
                          <div className="text-sm text-muted-foreground">
                            {stage.count} contacts
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {stage.conversionRate.toFixed(1)}%
                        </div>
                        {stage.dropoff !== 0 && (
                          <div className="text-sm text-red-500">
                            -{stage.dropoff} dropped
                          </div>
                        )}
                      </div>
                    </div>
                    <Progress value={stage.conversionRate} className="h-2" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Touchpoints Tab */}
        <TabsContent value="touchpoints" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Channel Distribution</CardTitle>
                <CardDescription>Total: {touchpointAnalytics.totalTouchpoints} touchpoints</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(touchpointAnalytics.channelDistribution).map(([channel, count]) => {
                  const numCount = count as number;
                  const percentage = (numCount / touchpointAnalytics.totalTouchpoints) * 100;
                  return (
                    <div key={channel} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium capitalize">{channel}</span>
                        <span className="text-muted-foreground">{numCount} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Touchpoints by Stage</CardTitle>
                <CardDescription>Channel effectiveness per journey stage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(touchpointAnalytics.channelByStage).map(([stage, channels]) => {
                  const config = STAGE_CONFIG[stage as keyof typeof STAGE_CONFIG];
                  return (
                    <div key={stage} className="space-y-2">
                      <div className="font-semibold text-sm">{config.label}</div>
                      <div className="space-y-1">
                        {Object.entries(channels as Record<string, number>).map(([channel, count]) => (
                          <div key={channel} className="flex items-center justify-between text-xs">
                            <span className="capitalize">{channel}</span>
                            <Badge variant="secondary">{count}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Drop-offs Tab */}
        <TabsContent value="dropoffs" className="space-y-6">
          {/* Drop-off Points */}
          {dropoffPoints && dropoffPoints.length !== 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Critical Drop-off Points
                </CardTitle>
                <CardDescription>
                  Stages with significant customer drop-off (greater than 20%)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {dropoffPoints.map((dropoff: any, idx: number) => (
                  <div key={idx} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">
                        {dropoff.from} → {dropoff.to}
                      </div>
                      <Badge variant={
                        dropoff.severity === "high" ? "destructive" : 
                        dropoff.severity === "medium" ? "default" : "secondary"
                      }>
                        {dropoff.dropoffRate}% drop-off
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {dropoff.entered} contacts entered this transition
                    </div>
                    <Progress value={100 - dropoff.dropoffRate} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Bottleneck Detection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Bottleneck Detection
              </CardTitle>
              <CardDescription>
                Transitions with low conversion rates (below 50%)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dropoffAnalysis.bottlenecks.length !== 0 ? (
                <div className="space-y-3">
                  {dropoffAnalysis.bottlenecks.map((bottleneck: any, idx: number) => (
                    <div key={idx} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">
                          {bottleneck.transition.replace(/_/g, " ").replace(/to/g, "→")}
                        </div>
                        <Badge variant="destructive">
                          {bottleneck.conversionRate.toFixed(1)}% conversion
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {bottleneck.totalAttempts} attempts tracked
                      </div>
                      <Progress value={bottleneck.conversionRate} className="h-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>No significant bottlenecks detected!</p>
                  <p className="text-sm mt-1">Your conversion rates are healthy across all stages.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}