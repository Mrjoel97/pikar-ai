import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface CrossPlatformMetricsProps {
  businessId: Id<"businesses">;
}

export function CrossPlatformMetrics({ businessId }: CrossPlatformMetricsProps) {
  const metrics = useQuery(
    api.socialAnalyticsAdvanced.getCrossPlatformMetrics,
    { businessId, days: 30 }
  );

  if (!metrics) {
    return <div>Loading cross-platform metrics...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Cross-Platform Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="platform" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgEngagement" fill="#3b82f6" name="Avg Engagement" />
              <Bar dataKey="engagementRate" fill="#10b981" name="Engagement Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metrics.map((platform: any) => (
            <div key={platform.platform} className="p-3 border rounded-lg">
              <div className="text-xs text-muted-foreground capitalize mb-1">{platform.platform}</div>
              <div className="text-lg font-bold">{platform.posts}</div>
              <div className="text-xs text-muted-foreground">posts</div>
              <div className="text-xs text-green-600 mt-1">
                {platform.engagementRate.toFixed(2)}% rate
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
