import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Users, Target, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";

interface SegmentInsightsProps {
  businessId: Id<"businesses">;
}

export function SegmentInsights({ businessId }: SegmentInsightsProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  
  const generateSegments = useAction(api.customerSegmentation.analyzeCustomers);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const result = await generateSegments({ businessId });
      setInsights(result);
      toast.success("Analysis complete!");
    } catch (error) {
      toast.error("Failed to analyze segments");
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  if (!insights) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI-Powered Segment Insights
          </CardTitle>
          <CardDescription>
            Get intelligent recommendations for your customer segments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleAnalyze} disabled={analyzing} className="w-full">
            {analyzing ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Analyze My Customers
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { segments, recommendations, totalContacts, healthScore } = insights;

  return (
    <div className="space-y-4">
      {/* Health Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Customer Health Score
            </span>
            <Badge variant={healthScore > 70 ? "default" : healthScore > 40 ? "secondary" : "destructive"}>
              {healthScore}/100
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={healthScore} className="h-2 mb-4" />
          <p className="text-sm text-muted-foreground">
            {healthScore > 70
              ? "🎉 Excellent! Your customer base is healthy and engaged."
              : healthScore > 40
              ? "⚠️ Good, but there's room for improvement in engagement."
              : "🔴 Action needed! Focus on re-engaging your customers."}
          </p>
        </CardContent>
      </Card>

      {/* Segments Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Segment Breakdown
          </CardTitle>
          <CardDescription>{totalContacts} total contacts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {segments.map((segment: any) => (
            <div key={segment.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="font-medium">{segment.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {segment.priority}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {segment.count} ({segment.percentage}%)
                  </span>
                </div>
              </div>
              <Progress value={segment.percentage} className="h-1" />
              <p className="text-xs text-muted-foreground">{segment.description}</p>
              <div className="bg-muted/50 rounded-md p-2 text-xs">
                <span className="font-medium">💡 Suggested Action:</span> {segment.suggestedAction}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Key Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recommendations.map((rec: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Button onClick={handleAnalyze} variant="outline" className="w-full">
        <Sparkles className="h-4 w-4 mr-2" />
        Refresh Analysis
      </Button>
    </div>
  );
}
