import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Activity, Lock, Unlock, TrendingUp, Database } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface KmsAnalyticsDashboardProps {
  businessId: Id<"businesses">;
}

export function KmsAnalyticsDashboard({ businessId }: KmsAnalyticsDashboardProps) {
  const [dateRange] = useState({
    start: Date.now() - 30 * 24 * 60 * 60 * 1000,
    end: Date.now(),
  });

  const analytics = useQuery(api.kms.getKmsAnalytics, {
    businessId,
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  if (!analytics) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const pieData = [
    { name: "Encrypt", value: analytics.encryptOperations, color: "#10b981" },
    { name: "Decrypt", value: analytics.decryptOperations, color: "#3b82f6" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">{analytics.totalOperations}</p>
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
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Encryptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">{analytics.encryptOperations}</p>
              <Lock className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Data Encrypted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">
                {(analytics.totalDataSize / 1024 / 1024).toFixed(2)} MB
              </p>
              <Database className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Operations Distribution</CardTitle>
            <CardDescription>Encrypt vs Decrypt operations</CardDescription>
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
            <CardTitle>Operations by Data Type</CardTitle>
            <CardDescription>Encryption activity per data type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.byDataType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dataType" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" name="Operations" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Daily Operations Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Operations Trend</CardTitle>
          <CardDescription>Encryption and decryption activity over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.dailyOps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="encrypts" stroke="#10b981" name="Encryptions" />
              <Line type="monotone" dataKey="decrypts" stroke="#3b82f6" name="Decryptions" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Data Type Details */}
      <Card>
        <CardHeader>
          <CardTitle>Data Type Statistics</CardTitle>
          <CardDescription>Detailed breakdown by data type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analytics.byDataType.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No data available</p>
            ) : (
              analytics.byDataType.map((item: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{item.dataType}</p>
                    <p className="text-sm text-muted-foreground">
                      {(item.dataSize / 1024).toFixed(2)} KB encrypted
                    </p>
                  </div>
                  <Badge variant="outline">{item.count} operations</Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
