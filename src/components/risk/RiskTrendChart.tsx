import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface RiskTrendChartProps {
  trendData: Array<{ date: string; score: number; count: number }>;
  byCategory: Record<string, number>;
  newRisks: number;
  mitigatedRisks: number;
  avgRiskScore: number;
  period: string;
}

export function RiskTrendChart({ 
  trendData, 
  byCategory, 
  newRisks, 
  mitigatedRisks, 
  avgRiskScore,
  period 
}: RiskTrendChartProps) {
  const categories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Trend Analysis</CardTitle>
        <CardDescription>
          {period} overview • Avg Score: {avgRiskScore}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{newRisks}</div>
            <div className="text-xs text-muted-foreground">New Risks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{mitigatedRisks}</div>
            <div className="text-xs text-muted-foreground">Mitigated</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{avgRiskScore}</div>
            <div className="text-xs text-muted-foreground">Avg Score</div>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: any) => [value.toFixed(2), "Risk Score"]}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Risk Score"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Risk Categories */}
        <div>
          <h4 className="text-sm font-medium mb-3">Top Risk Categories</h4>
          <div className="space-y-2">
            {categories.map(([category, score]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm capitalize">{category}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${Math.min(100, (score / 25) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{score.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
