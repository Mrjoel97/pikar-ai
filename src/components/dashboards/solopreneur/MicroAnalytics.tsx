import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Users, Activity } from "lucide-react";

interface MicroAnalyticsProps {
  businessId: Id<"businesses">;
}

export function MicroAnalytics({ businessId }: MicroAnalyticsProps) {
  const quickAnalytics = useQuery(api.solopreneur.runQuickAnalytics, { businessId });

  const metrics = [
    {
      label: "Revenue (90d)",
      value: `$${(quickAnalytics?.revenue90d ?? 0).toLocaleString()}`,
      delta: quickAnalytics?.deltas?.revenue ?? 0,
      icon: DollarSign,
    },
    {
      label: "Subscribers",
      value: "—",
      delta: quickAnalytics?.deltas?.subscribers ?? 0,
      icon: Users,
    },
    {
      label: "Engagement",
      value: "—",
      delta: quickAnalytics?.deltas?.engagement ?? 0,
      icon: Activity,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Micro-Analytics (7-day trends)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            const isPositive = metric.delta >= 0;
            const TrendIcon = isPositive ? TrendingUp : TrendingDown;
            
            return (
              <div key={metric.label} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="p-2 bg-primary/10 rounded">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="text-xl font-semibold">{metric.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendIcon
                      className={`h-3 w-3 ${
                        isPositive ? "text-green-600" : "text-red-600"
                      }`}
                    />
                    <span
                      className={`text-xs font-medium ${
                        isPositive ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {metric.delta}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {quickAnalytics?.churnAlert && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Churn Alert:</strong> Consider re-engagement campaigns
            </p>
          </div>
        )}

        {quickAnalytics?.topProducts && quickAnalytics.topProducts.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Top Products</p>
            <div className="flex flex-wrap gap-2">
              {quickAnalytics.topProducts.map((product: any, idx: number) => (
                <Badge key={idx} variant="secondary">
                  {product.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
