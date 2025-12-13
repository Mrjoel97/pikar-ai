import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, ArrowRight, TrendingUp } from "lucide-react";
import { useState } from "react";

interface AllocationOptimizerProps {
  businessId: Id<"businesses">;
}

export function AllocationOptimizer({ businessId }: AllocationOptimizerProps) {
  const suggestions = useQuery(api.resources.optimization.getOptimalAllocation, { businessId });
  const [selectedSuggestion, setSelectedSuggestion] = useState<number | null>(null);

  if (!suggestions) {
    return <div>Loading optimization suggestions...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Resource Optimization</CardTitle>
          <CardDescription>Intelligent suggestions to maximize resource efficiency</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {suggestions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Lightbulb className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No optimization suggestions at this time</p>
              <p className="text-sm">Your resource allocation is optimal</p>
            </div>
          ) : (
            suggestions.map((suggestion: any, index: number) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{suggestion.resource}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{suggestion.reasoning}</p>
                    </div>
                    <Badge>AI Recommended</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-2">Current Allocation</p>
                      <div className="space-y-1">
                        {Object.entries(suggestion.currentAllocation).map(([project, percent]) => (
                          <div key={project} className="flex items-center justify-between text-sm">
                            <span className="capitalize">{project}</span>
                            <span className="font-medium">{percent}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <ArrowRight className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                    
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-2">Optimal Allocation</p>
                      <div className="space-y-1">
                        {Object.entries(suggestion.optimalAllocation).map(([project, percent]) => (
                          <div key={project} className="flex items-center justify-between text-sm">
                            <span className="capitalize">{project}</span>
                            <span className="font-medium text-green-600">{percent}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <p className="text-sm text-green-900">
                      <strong>Expected Impact:</strong> {suggestion.expectedImpact}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant={selectedSuggestion === index ? "default" : "outline"}
                    onClick={() => setSelectedSuggestion(selectedSuggestion === index ? null : index)}
                    className="w-full"
                  >
                    {selectedSuggestion === index ? "Selected for Implementation" : "Select Suggestion"}
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
