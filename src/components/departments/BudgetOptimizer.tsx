import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";
import { useState } from "react";

interface BudgetOptimizerProps {
  businessId: Id<"businesses">;
}

export function BudgetOptimizer({ businessId }: BudgetOptimizerProps) {
  const suggestions = useQuery(api.departmentBudgets.optimization.getOptimizationSuggestions, {
    businessId,
  });

  const recommendations = useQuery(api.departmentBudgets.optimization.getReallocationRecommendations, {
    businessId,
  });

  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());

  if (!suggestions) {
    return <div>Loading optimization suggestions...</div>;
  }

  const totalPotentialSavings = suggestions.reduce((sum, s) => sum + s.potentialSavings, 0);

  const priorityColors = {
    high: "destructive",
    medium: "default",
    low: "secondary",
  } as const;

  const typeIcons = {
    reallocation: DollarSign,
    efficiency: TrendingUp,
    cost_reduction: AlertTriangle,
    investment: Lightbulb,
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>AI-Powered Budget Optimization</CardTitle>
              <CardDescription>Intelligent suggestions to maximize budget efficiency</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">
                ${(totalPotentialSavings / 1000).toFixed(0)}K
              </p>
              <p className="text-xs text-muted-foreground">Potential Savings</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {suggestions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Lightbulb className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No optimization suggestions at this time</p>
              <p className="text-sm">Your budget allocation is optimal</p>
            </div>
          ) : (
            suggestions.map((suggestion, index) => {
              const Icon = typeIcons[suggestion.type];
              return (
                <Card key={index} className="border-l-4" style={{ borderLeftColor: suggestion.priority === "high" ? "#ef4444" : suggestion.priority === "medium" ? "#f59e0b" : "#6b7280" }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Icon className="h-5 w-5 mt-0.5" />
                        <div>
                          <CardTitle className="text-base">{suggestion.title}</CardTitle>
                          <p className="text-sm text-muted-foreground capitalize">{suggestion.department}</p>
                        </div>
                      </div>
                      <Badge variant={priorityColors[suggestion.priority]}>
                        {suggestion.priority}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm">{suggestion.description}</p>
                    
                    {suggestion.potentialSavings > 0 && (
                      <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                        <DollarSign className="h-4 w-4" />
                        Potential savings: ${(suggestion.potentialSavings / 1000).toFixed(1)}K
                      </div>
                    )}

                    <div className="space-y-1">
                      <p className="text-sm font-medium">Action Items:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {suggestion.actionItems.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button
                      size="sm"
                      variant={selectedSuggestions.has(index) ? "default" : "outline"}
                      onClick={() => {
                        const newSet = new Set(selectedSuggestions);
                        if (newSet.has(index)) {
                          newSet.delete(index);
                        } else {
                          newSet.add(index);
                        }
                        setSelectedSuggestions(newSet);
                      }}
                    >
                      {selectedSuggestions.has(index) ? "Selected" : "Select for Implementation"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
        </CardContent>
      </Card>

      {recommendations && recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reallocation Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendations.map((rec: any, index: number) => (
              <div key={index} className="space-y-3 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{rec.title}</h4>
                  <Badge>AI Recommended</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{rec.description}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium mb-2">From (Under-utilized):</p>
                    <ul className="space-y-1">
                      {rec.from.map((f: any, i: number) => (
                        <li key={i} className="flex justify-between">
                          <span className="capitalize">{f.department}</span>
                          <span className="text-red-600">-${(f.amount / 1000).toFixed(0)}K</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-2">To (Over-utilized):</p>
                    <ul className="space-y-1">
                      {rec.to.map((t: any, i: number) => (
                        <li key={i} className="flex justify-between">
                          <span className="capitalize">{t.department}</span>
                          <span className="text-green-600">+${(t.amount / 1000).toFixed(0)}K</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-sm"><strong>Impact:</strong> {rec.impact}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
