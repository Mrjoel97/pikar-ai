import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface GrowthMetricsProps {
  businessId: string;
}

export function GrowthMetrics({ businessId }: GrowthMetricsProps) {
  const [timeRange, setTimeRange] = useState(30);

  const growthMetrics = useQuery(
    api.analytics.retention.getGrowthMetrics,
    businessId ? { businessId: businessId as any, timeRange } : "skip"
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Growth Metrics
        </CardTitle>
        <CardDescription>Track user acquisition and engagement</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Total Contacts</div>
            <div className="text-2xl font-bold">{growthMetrics?.totalContacts || 0}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">New Contacts</div>
            <div className="text-2xl font-bold text-green-600">
              +{growthMetrics?.newContacts || 0}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Growth Rate</div>
            <div className={`text-2xl font-bold ${(growthMetrics?.growthRate || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
              {growthMetrics?.growthRate || 0}%
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Engagement</div>
            <div className="text-2xl font-bold">{growthMetrics?.engagementRate || 0}%</div>
          </div>
        </div>

        {/* Growth Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={growthMetrics?.dailyGrowth || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="newContacts"
                stroke="#10b981"
                strokeWidth={2}
                name="New Contacts"
              />
              <Line
                type="monotone"
                dataKey="totalContacts"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Total Contacts"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}