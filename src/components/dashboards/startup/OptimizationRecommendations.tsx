import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info, CheckCircle, Zap } from "lucide-react";

interface Recommendation {
  type: "critical" | "warning" | "success";
  title: string;
  description: string;
  suggestion: string;
  impact: string;
  priority: number;
}

interface OptimizationRecommendationsProps {
  recommendations: Recommendation[];
}

export function OptimizationRecommendations({ recommendations }: OptimizationRecommendationsProps) {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          AI-Powered Optimization Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((rec, idx) => {
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
  );
}
