import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface ConversionFunnelChartProps {
  funnel: {
    stages: Array<{
      stage: string;
      count: number;
      percentage: number;
    }>;
    dropoff: {
      sentToOpened: number;
      openedToClicked: number;
      clickedToConverted: number;
    };
  };
}

export function ConversionFunnelChart({ funnel }: ConversionFunnelChartProps) {
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Funnel</CardTitle>
        <CardDescription>Track user journey from send to conversion</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={funnel.stages} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="stage" type="category" width={100} />
            <Tooltip />
            <Bar dataKey="count" radius={[0, 8, 8, 0]}>
              {funnel.stages.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sent → Opened Drop-off:</span>
            <span className="font-medium">{funnel.dropoff.sentToOpened.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Opened → Clicked Drop-off:</span>
            <span className="font-medium">{funnel.dropoff.openedToClicked.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Clicked → Converted Drop-off:</span>
            <span className="font-medium">{funnel.dropoff.clickedToConverted.toFixed(1)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
