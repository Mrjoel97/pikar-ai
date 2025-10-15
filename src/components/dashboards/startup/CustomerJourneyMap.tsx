import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users, TrendingUp, Clock, Activity } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

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
  const analytics = useQuery(api.customerJourney.getJourneyAnalytics, { businessId, days: 30 });

  if (!analytics) {
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
            <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalContacts > 0 
                ? Math.round(((stageDistribution.decision || 0) / totalContacts) * 100) 
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">To decision stage</p>
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
            {Object.entries(STAGE_CONFIG).map(([stage, config], idx) => {
              const count = stageDistribution[stage] || 0;
              const percentage = totalContacts > 0 ? Math.round((count / totalContacts) * 100) : 0;
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
                    {averageDurations[stage] > 0 && (
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

      {/* Transition Flow */}
      <Card>
        <CardHeader>
          <CardTitle>Stage Transitions</CardTitle>
          <CardDescription>Recent movement between stages (last 30 days)</CardDescription>
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
    </div>
  );
}