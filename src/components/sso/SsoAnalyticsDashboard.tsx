import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, Activity, Users, CheckCircle, XCircle } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface SsoAnalyticsDashboardProps {
  businessId: Id<"businesses">;
}

export function SsoAnalyticsDashboard({ businessId }: SsoAnalyticsDashboardProps) {
  const samlAnalytics = useQuery(api.saml.getSSOAnalytics, { businessId });
  const oidcAnalytics = useQuery(api.oidc.getSSOAnalytics, { businessId });
  const samlConfigs = useQuery(api.saml.listSAMLConfigs, { businessId });
  const oidcConfigs = useQuery(api.oidc.listOIDCConfigs, { businessId });

  if (!samlAnalytics || !oidcAnalytics) {
    return <div className="animate-pulse space-y-4">
      <div className="h-32 bg-gray-200 rounded"></div>
      <div className="h-64 bg-gray-200 rounded"></div>
    </div>;
  }

  // Aggregate analytics from both SAML and OIDC
  const analytics = {
    totalLogins: samlAnalytics.totalLogins + oidcAnalytics.totalLogins,
    successfulLogins: samlAnalytics.successfulLogins + oidcAnalytics.successfulLogins,
    failedLogins: samlAnalytics.failedLogins + oidcAnalytics.failedLogins,
    successRate: 
      (samlAnalytics.totalLogins + oidcAnalytics.totalLogins) > 0
        ? ((samlAnalytics.successfulLogins + oidcAnalytics.successfulLogins) / 
           (samlAnalytics.totalLogins + oidcAnalytics.totalLogins)) * 100
        : 0,
    jitProvisions: samlAnalytics.jitProvisions + oidcAnalytics.jitProvisions,
    byConfig: [...samlAnalytics.byConfig, ...oidcAnalytics.byConfig],
    recentEvents: [...samlAnalytics.recentEvents, ...oidcAnalytics.recentEvents]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10),
  };

  const allConfigs = [
    ...(samlConfigs?.map((c) => ({ ...c, type: "saml" as const })) || []),
    ...(oidcConfigs?.map((c) => ({ ...c, type: "oidc" as const })) || []),
  ];

  const configMap = new Map(allConfigs.map((c) => [c._id, c]));

  const pieData = [
    { name: "Successful", value: analytics.successfulLogins, color: "#10b981" },
    { name: "Failed", value: analytics.failedLogins, color: "#ef4444" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Logins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">{analytics.totalLogins}</p>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">{analytics.successRate.toFixed(1)}%</p>
              {analytics.successRate >= 95 ? (
                <TrendingUp className="h-8 w-8 text-green-600" />
              ) : (
                <TrendingDown className="h-8 w-8 text-amber-600" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">JIT Provisions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">{analytics.jitProvisions}</p>
              <Users className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Failed Logins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">{analytics.failedLogins}</p>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Login Success vs Failure</CardTitle>
            <CardDescription>Distribution of login attempts</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
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
            <CardTitle>Logins by Identity Provider</CardTitle>
            <CardDescription>Login activity per IdP</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.byConfig.map((c: any) => {
                const config = configMap.get(c.configId);
                return {
                  name: config?.name || "Unknown",
                  successful: c.successfulLogins,
                  failed: c.failedLogins,
                };
              })}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="successful" fill="#10b981" name="Successful" />
                <Bar dataKey="failed" fill="#ef4444" name="Failed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent SSO Events</CardTitle>
          <CardDescription>Latest authentication attempts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analytics.recentEvents.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent events</p>
            ) : (
              analytics.recentEvents.map((event: any, index: number) => {
                const config = configMap.get(event.configId);
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {event.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <p className="font-medium">{event.eventType}</p>
                        <p className="text-sm text-gray-600">
                          {config?.name || "Unknown"} ({event.configType.toUpperCase()})
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={event.success ? "default" : "destructive"}>
                        {event.success ? "Success" : "Failed"}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}