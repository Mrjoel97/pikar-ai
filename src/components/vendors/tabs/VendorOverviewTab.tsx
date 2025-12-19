import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { VendorOverviewCharts } from "../VendorOverviewCharts";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface VendorOverviewTabProps {
  riskData: any[];
  performanceTrend: any[];
  performanceTrends: any;
}

export function VendorOverviewTab({ riskData, performanceTrend, performanceTrends }: VendorOverviewTabProps) {
  return (
    <div className="space-y-4">
      <VendorOverviewCharts
        riskData={riskData}
        performanceTrend={performanceTrend}
      />

      {/* Performance Trends */}
      {performanceTrends && performanceTrends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vendor Performance Trends</CardTitle>
            <CardDescription>Last 6 months performance tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceTrends[0]?.dataPoints || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(ts) => new Date(ts).toLocaleDateString()}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  labelFormatter={(ts) => new Date(ts).toLocaleDateString()}
                />
                <Legend />
                {performanceTrends.slice(0, 5).map((trend: any, idx: number) => (
                  <Line
                    key={trend.vendorId}
                    type="monotone"
                    dataKey="score"
                    data={trend.dataPoints}
                    name={trend.vendorName}
                    stroke={`hsl(${idx * 60}, 70%, 50%)`}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
