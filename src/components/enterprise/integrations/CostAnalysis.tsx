import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { DollarSign, TrendingDown, AlertCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function CostAnalysis({ businessId }: { businessId: Id<"businesses"> }) {
  const costs = useQuery(api.integrationPlatform.getIntegrationCostAnalysis, { businessId });
  const suggestions = useQuery(api.integrationPlatform.costs.getCostOptimizationSuggestions, { businessId });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">${costs?.totalCost.toFixed(2) || "0.00"}</div>
                <div className="text-xs text-muted-foreground mt-1">Total Cost (30d)</div>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">${costs?.projectedMonthlyCost.toFixed(2) || "0.00"}</div>
                <div className="text-xs text-muted-foreground mt-1">Projected Monthly</div>
              </div>
              <TrendingDown className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">${suggestions?.totalPotentialSavings.toFixed(2) || "0.00"}</div>
                <div className="text-xs text-muted-foreground mt-1">Potential Savings</div>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cost by Integration</CardTitle>
          <CardDescription>Breakdown of costs per integration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {costs?.integrations.map((integration: any) => (
              <div key={integration.integrationId} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{integration.name}</div>
                  <div className="text-xs text-muted-foreground">{integration.requests.toLocaleString()} requests</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">${integration.estimatedCost.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">${integration.costPerRequest} per request</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Optimization Recommendations</CardTitle>
          <CardDescription>AI-powered cost reduction suggestions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {suggestions?.suggestions.map((suggestion: any, idx: number) => (
              <div key={idx} className="p-3 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="font-medium">{suggestion.integrationName}</div>
                  <Badge variant={suggestion.priority === "high" ? "destructive" : "secondary"}>
                    {suggestion.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{suggestion.description}</p>
                <div className="text-xs font-medium text-green-600">
                  Potential savings: ${suggestion.potentialSavings.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
