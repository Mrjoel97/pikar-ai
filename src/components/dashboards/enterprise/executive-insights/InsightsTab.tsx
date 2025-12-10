import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, Zap, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface InsightsTabProps {
  insights: Array<{
    title: string;
    description: string;
    impact: string;
    metric: string;
    action: string;
  }>;
}

export function InsightsTab({ insights }: InsightsTabProps) {
  return (
    <div className="space-y-3 mt-4">
      {insights.map((insight, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">{insight.title}</span>
                </div>
                <Badge variant={
                  insight.impact === 'high' ? 'default' :
                  insight.impact === 'medium' ? 'secondary' : 'outline'
                }>
                  {insight.impact}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs font-medium text-green-600">{insight.metric}</span>
                </div>
                <span className="text-xs text-muted-foreground">{insight.action}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <div className="font-medium mb-1 flex items-center gap-2">
                AI Recommendation
                <Badge variant="outline" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  Predictive
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Based on usage patterns, consider enabling auto-scaling for peak hours (2-4 PM) to improve response times by 30%. 
                Current efficiency trends suggest optimal performance with 2 additional agent instances during peak load.
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  Apply Recommendation
                </Button>
                <Button size="sm" variant="ghost">
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
