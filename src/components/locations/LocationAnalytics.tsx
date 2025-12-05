import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, Workflow } from "lucide-react";

interface LocationAnalyticsProps {
  businessId: Id<"businesses">;
}

export function LocationAnalytics({ businessId }: LocationAnalyticsProps) {
  const [selectedLocation, setSelectedLocation] = useState<Id<"locations"> | null>(null);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  const locations = useQuery(api.locations.management.getLocations, { businessId });
  const analytics = useQuery(
    api.locations.analytics.getLocationAnalytics,
    selectedLocation ? { locationId: selectedLocation, timeRange } : "skip"
  );
  const comparison = useQuery(
    api.locations.analytics.compareLocations,
    locations && locations.length > 0
      ? {
          businessId,
          locationIds: locations.map((l) => l._id),
          metric: "workflows",
        }
      : "skip"
  );

  if (!locations) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Location Analytics</h2>
          <p className="text-muted-foreground">Performance metrics by location</p>
        </div>
        <div className="flex gap-2">
          <Select
            value={selectedLocation || ""}
            onValueChange={(v) => setSelectedLocation(v as Id<"locations">)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc._id} value={loc._id}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {analytics && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
              <Workflow className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.workflows.total}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.workflows.completionRate}% completion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.workflows.active}</div>
              <p className="text-xs text-muted-foreground">Currently in progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.employees.total}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.employees.active} active
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {comparison && comparison.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Location Comparison</CardTitle>
            <CardDescription>Workflow count by location</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="locationName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#3b82f6" name="Workflows" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
