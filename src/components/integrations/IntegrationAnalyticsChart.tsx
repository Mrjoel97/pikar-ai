import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Activity, AlertCircle } from "lucide-react";

interface IntegrationAnalyticsChartProps {
  businessId: Id<"businesses">;
  isGuest?: boolean;
}

export function IntegrationAnalyticsChart({ businessId, isGuest = false }: IntegrationAnalyticsChartProps) {
  const integrationHealth = useQuery(
    api.analyticsEngine.getIntegrationHealth,
    isGuest ? "skip" : { businessId }
  );

  const businessAnalytics = useQuery(
    api.analyticsEngine.getBusinessAnalytics,
    isGuest ? "skip" : { businessId, timeRange: "30d" }
  );

  // Mock data for guest mode
  const mockHealthData = [
    { name: "CRM", healthy: 3, total: 3, healthPercentage: 100 },
    { name: "Social", healthy: 4, total: 5, healthPercentage: 80 },
    { name: "Email", healthy: 1, total: 1, healthPercentage: 100 },
  ];

  const mockUsageData = [
    { date: "Week 1", apiCalls: 2400, workflows: 45, emails: 120 },
    { date: "Week 2", apiCalls: 3200, workflows: 52, emails: 145 },
    { date: "Week 3", apiCalls: 2800, workflows: 48, emails: 135 },
    { date: "Week 4", apiCalls: 3600, workflows: 58, emails: 160 },
  ];

  const healthData = isGuest
    ? mockHealthData
    : [
        {
          name: "CRM",
          healthy: integrationHealth?.crm.healthy || 0,
          total: integrationHealth?.crm.total || 0,
          healthPercentage: integrationHealth?.crm.healthPercentage || 0,
        },
        {
          name: "Social",
          healthy: integrationHealth?.social.healthy || 0,
          total: integrationHealth?.social.total || 0,
          healthPercentage: integrationHealth?.social.healthPercentage || 0,
        },
        {
          name: "Email",
          healthy: integrationHealth?.email.configured ? 1 : 0,
          total: 1,
          healthPercentage: integrationHealth?.email.configured ? 100 : 0,
        },
      ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Overall Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isGuest
                ? "93%"
                : `${Math.round(
                    ((integrationHealth?.overall.healthyIntegrations || 0) /
                      Math.max(integrationHealth?.overall.totalIntegrations || 1, 1)) *
                      100
                  )}%`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isGuest ? "8/9" : `${integrationHealth?.overall.healthyIntegrations || 0}/${integrationHealth?.overall.totalIntegrations || 0}`} integrations healthy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              Workflow Success
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isGuest ? "94%" : `${businessAnalytics?.workflows.successRate || 0}%`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isGuest ? "47/50" : `${businessAnalytics?.workflows.successful || 0}/${businessAnalytics?.workflows.total || 0}`} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              Issues Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isGuest ? "2" : healthData.filter((h) => h.healthPercentage < 100).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Require attention</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Integration Health Status</CardTitle>
          <CardDescription>Health percentage by integration type</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={healthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="healthPercentage" fill="#10b981" name="Health %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integration Usage Trends</CardTitle>
          <CardDescription>API calls, workflows, and email activity over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockUsageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="apiCalls" stroke="#3b82f6" name="API Calls" />
              <Line type="monotone" dataKey="workflows" stroke="#10b981" name="Workflows" />
              <Line type="monotone" dataKey="emails" stroke="#f59e0b" name="Emails" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
