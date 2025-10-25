import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface CampaignPerformanceChartProps {
  data: Array<{
    timestamp: number;
    opens: number;
    clicks: number;
    conversions: number;
  }>;
}

export function CampaignPerformanceChart({ data }: CampaignPerformanceChartProps) {
  const chartData = data.map((d) => ({
    time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    Opens: d.opens,
    Clicks: d.clicks,
    Conversions: d.conversions,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Real-Time Performance (Last 24 Hours)</CardTitle>
        <CardDescription>Track engagement metrics in real-time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="Opens" stroke="#3b82f6" strokeWidth={2} />
            <Line type="monotone" dataKey="Clicks" stroke="#10b981" strokeWidth={2} />
            <Line type="monotone" dataKey="Conversions" stroke="#f59e0b" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
