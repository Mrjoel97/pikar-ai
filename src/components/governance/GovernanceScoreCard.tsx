import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Shield, AlertTriangle } from "lucide-react";

interface GovernanceScoreCardProps {
  businessId: Id<"businesses">;
  days?: number;
}

export function GovernanceScoreCard({ businessId, days = 30 }: GovernanceScoreCardProps) {
  const scoreData = useQuery(api.governanceAutomation.getGovernanceScoreTrend, {
    businessId,
    days,
  });

  if (!scoreData) {
    return <div>Loading governance score...</div>;
  }

  const { currentScore, trend, compliantCount, totalCount } = scoreData;
  const previousScore = trend.length > 1 ? trend[trend.length - 2].score : currentScore;
  const scoreDelta = currentScore - previousScore;
  const isImproving = scoreDelta >= 0;

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge variant="default" className="bg-green-600">Excellent</Badge>;
    if (score >= 70) return <Badge variant="default" className="bg-yellow-600">Good</Badge>;
    return <Badge variant="destructive">Needs Attention</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Governance Score
          </span>
          {getScoreBadge(currentScore)}
        </CardTitle>
        <CardDescription>
          {compliantCount} of {totalCount} workflows compliant
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Score */}
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-4xl font-bold ${getScoreColor(currentScore)}`}>
              {currentScore}%
            </div>
            <div className="flex items-center gap-2 mt-1">
              {isImproving ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm ${isImproving ? "text-green-600" : "text-red-600"}`}>
                {Math.abs(scoreDelta).toFixed(1)}% from yesterday
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Target</div>
            <div className="text-2xl font-semibold">95%</div>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(1)}%`, "Score"]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Warning if score is low */}
        {currentScore < 70 && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-yellow-900">Action Required</p>
              <p className="text-yellow-700">
                Your governance score is below target. Review workflows and enable auto-remediation.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
