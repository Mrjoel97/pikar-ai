import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface SentimentAnalysisProps {
  businessId: Id<"businesses">;
}

export function SentimentAnalysis({ businessId }: SentimentAnalysisProps) {
  const sentimentData = useQuery(
    api.socialAnalyticsAdvanced.getSentimentAnalysis,
    { businessId, days: 30 }
  );

  if (!sentimentData) {
    return <div>Loading sentiment analysis...</div>;
  }

  const chartData = [
    { name: "Positive", value: sentimentData.overall.positive, color: "#10b981" },
    { name: "Neutral", value: sentimentData.overall.neutral, color: "#94a3b8" },
    { name: "Negative", value: sentimentData.overall.negative, color: "#ef4444" },
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving": return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "declining": return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Sentiment Analysis</CardTitle>
          <Badge variant="outline" className="gap-1">
            {getTrendIcon(sentimentData.trend)}
            {sentimentData.trend}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Overall Sentiment</div>
              <div className="space-y-2">
                {chartData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <span>{item.name}</span>
                    <span className="font-bold">{item.value.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-3 border-t">
              <div className="text-sm text-muted-foreground mb-1">Total Posts Analyzed</div>
              <div className="text-2xl font-bold">{sentimentData.totalPosts}</div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="text-sm font-semibold mb-2">By Platform</div>
          <div className="space-y-2">
            {Object.entries(sentimentData.byPlatform).map(([platform, data]: [string, any]) => (
              <div key={platform} className="flex items-center justify-between text-xs p-2 border rounded">
                <span className="font-medium capitalize">{platform}</span>
                <div className="flex gap-3">
                  <span className="text-green-600">{((data.positive / data.total) * 100).toFixed(0)}% pos</span>
                  <span className="text-gray-600">{((data.neutral / data.total) * 100).toFixed(0)}% neu</span>
                  <span className="text-red-600">{((data.negative / data.total) * 100).toFixed(0)}% neg</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
