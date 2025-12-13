import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Users, Clock, Target } from "lucide-react";

interface JourneyMetrics {
  totalContacts: number;
  avgTimeInJourney: number;
  completionRate: number;
  dropoffRate: number;
  topPerformingStage?: string;
  bottleneckStage?: string;
}

interface JourneyAnalyticsProps {
  metrics: JourneyMetrics;
  abTestResults?: Array<{
    variant: string;
    conversionRate: number;
    sampleSize: number;
  }>;
}

export function JourneyAnalytics({ metrics, abTestResults }: JourneyAnalyticsProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Journey Performance Metrics</CardTitle>
          <CardDescription>Overall journey effectiveness and engagement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                Total Contacts
              </div>
              <div className="text-2xl font-bold">{metrics.totalContacts}</div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Avg Time
              </div>
              <div className="text-2xl font-bold">{metrics.avgTimeInJourney}d</div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4" />
                Completion
              </div>
              <div className="text-2xl font-bold text-green-600">{metrics.completionRate}%</div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Drop-off
              </div>
              <div className="text-2xl font-bold text-red-600">{metrics.dropoffRate}%</div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {metrics.topPerformingStage && (
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <span className="text-sm font-medium">Top Performing Stage</span>
                <Badge variant="default">{metrics.topPerformingStage}</Badge>
              </div>
            )}

            {metrics.bottleneckStage && (
              <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <span className="text-sm font-medium">Bottleneck Stage</span>
                <Badge variant="destructive">{metrics.bottleneckStage}</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {abTestResults && abTestResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>A/B Test Results</CardTitle>
            <CardDescription>Compare journey variant performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {abTestResults.map((result, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{result.variant}</span>
                    <Badge variant="outline">{result.sampleSize} contacts</Badge>
                  </div>
                  <span className="text-lg font-bold">{result.conversionRate}%</span>
                </div>
                <Progress value={result.conversionRate} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
