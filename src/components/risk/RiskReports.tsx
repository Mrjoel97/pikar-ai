import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, TrendingUp, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e"];

export function RiskReports({ businessId }: { businessId: string }) {
  const report = useQuery(api.risk.reporting.generateRiskReport, { businessId: businessId as any });
  const heatmap = useQuery(api.risk.reporting.getRiskHeatmap, { businessId: businessId as any });

  if (!report) {
    return <div>Loading report...</div>;
  }

  const categoryData = Object.entries(report.byCategory).map(([name, value]) => ({
    name,
    value,
  }));

  const severityData = [
    { name: "Critical", value: report.bySeverity.critical, color: "#ef4444" },
    { name: "High", value: report.bySeverity.high, color: "#f97316" },
    { name: "Medium", value: report.bySeverity.medium, color: "#eab308" },
    { name: "Low", value: report.bySeverity.low, color: "#22c55e" },
  ];

  const trendData = [
    { period: "60-90 days ago", count: report.trend.days60to90 },
    { period: "30-60 days ago", count: report.trend.days30to60 },
    { period: "Last 30 days", count: report.trend.last30Days },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Risks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.summary.totalRisks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {report.summary.activeRisks} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Risk Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.summary.avgRiskScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">Out of 25</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {report.bySeverity.critical + report.bySeverity.high}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Require attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution by Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Trend (90 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top 10 Risks</CardTitle>
          <CardDescription>Highest risk scores requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {report.topRisks.map((risk: any, index: number) => (
              <div key={risk.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                  <div>
                    <p className="font-medium">{risk.title}</p>
                    <p className="text-sm text-muted-foreground">{risk.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={risk.riskScore > 15 ? "destructive" : "default"}>
                    Score: {risk.riskScore}
                  </Badge>
                  <Badge variant="outline">{risk.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mitigation Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Identified</p>
              <p className="text-2xl font-bold">{report.mitigationStatus.identified}</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Assessed</p>
              <p className="text-2xl font-bold">{report.mitigationStatus.assessed}</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Mitigated</p>
              <p className="text-2xl font-bold text-green-600">{report.mitigationStatus.mitigated}</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Closed</p>
              <p className="text-2xl font-bold">{report.mitigationStatus.closed}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
