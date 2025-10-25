import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lightbulb, TrendingUp, AlertTriangle, Info } from "lucide-react";

interface PredictiveInsightsCardProps {
  insights: {
    insights: Array<{
      type: "positive" | "warning" | "info";
      title: string;
      description: string;
      recommendation: string;
    }>;
    trends: {
      openRateTrend: number;
      avgRecentOpenRate: number;
      avgOlderOpenRate: number;
    };
    predictions: {
      projectedMonthlyRevenue: number;
      bestSendTime?: number;
    };
  };
}

export function PredictiveInsightsCard({ insights }: PredictiveInsightsCardProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "positive":
        return <TrendingUp className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getVariant = (type: string): "default" | "destructive" => {
    return type === "warning" ? "destructive" : "default";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          AI-Powered Insights
        </CardTitle>
        <CardDescription>Predictive analytics and recommendations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.insights.map((insight, index) => (
          <Alert key={index} variant={getVariant(insight.type)}>
            <div className="flex items-start gap-2">
              {getIcon(insight.type)}
              <div className="flex-1">
                <AlertTitle>{insight.title}</AlertTitle>
                <AlertDescription className="mt-2 space-y-1">
                  <p>{insight.description}</p>
                  <p className="text-xs font-medium mt-2">💡 {insight.recommendation}</p>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        ))}
        
        <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
          <div className="text-sm font-medium">Projected Monthly Revenue</div>
          <div className="text-2xl font-bold text-green-600">
            ${insights.predictions.projectedMonthlyRevenue.toFixed(2)}
          </div>
          {insights.predictions.bestSendTime !== undefined && (
            <div className="text-xs text-muted-foreground">
              Best send time: {insights.predictions.bestSendTime}:00
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
