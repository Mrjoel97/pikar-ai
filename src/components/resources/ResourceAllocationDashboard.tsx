import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, AlertTriangle, TrendingUp, Activity } from "lucide-react";

interface ResourceAllocationDashboardProps {
  businessId: Id<"businesses">;
}

export function ResourceAllocationDashboard({ businessId }: ResourceAllocationDashboardProps) {
  const allocation = useQuery(api.resources.allocation.getResourceAllocation, { businessId });
  const utilization = useQuery(api.resources.allocation.getResourceUtilization, { businessId });
  const bottlenecks = useQuery(api.resources.allocation.getBottlenecks, { businessId });

  if (!allocation || !utilization || !bottlenecks) {
    return <div>Loading resource allocation data...</div>;
  }

  const overallocated = allocation.filter((r: any) => r.status === "overallocated");
  const underutilized = allocation.filter((r: any) => r.status === "underutilized");

  return (
    <div className="space-y-4">
      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allocation.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Teams tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Avg Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{utilization.averageUtilization}%</div>
            <p className="text-xs text-muted-foreground mt-1">Across all resources</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              Overallocated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overallocated.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Resources at risk</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Underutilized
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{underutilized.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Available capacity</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="allocation" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="allocation">Resource Allocation</TabsTrigger>
          <TabsTrigger value="utilization">Utilization</TabsTrigger>
          <TabsTrigger value="bottlenecks">Bottlenecks</TabsTrigger>
        </TabsList>

        <TabsContent value="allocation" className="space-y-4">
          <div className="space-y-3">
            {allocation.map((resource: any) => (
              <Card key={resource.resourceId}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{resource.resourceName}</CardTitle>
                    <Badge variant={
                      resource.status === "overallocated" ? "destructive" :
                      resource.status === "high" ? "default" :
                      resource.status === "optimal" ? "secondary" : "outline"
                    }>
                      {resource.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Capacity</p>
                      <p className="font-semibold">{resource.totalCapacity}h</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Allocated</p>
                      <p className="font-semibold">{resource.allocated}h</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Available</p>
                      <p className="font-semibold text-green-600">{resource.available}h</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Utilization</span>
                      <span className="font-medium">{resource.utilization}%</span>
                    </div>
                    <Progress value={resource.utilization} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="utilization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Utilization Breakdown</CardTitle>
              <CardDescription>Billable vs non-billable time</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {utilization.data.map((item: any) => (
                <div key={item.resource} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.resource}</span>
                    <span className="text-muted-foreground">
                      {item.billable + item.nonBillable}% utilized
                    </span>
                  </div>
                  <div className="flex h-8 rounded-md overflow-hidden">
                    <div
                      className="bg-green-500 flex items-center justify-center text-xs text-white"
                      style={{ width: `${item.billable}%` }}
                    >
                      {item.billable > 10 && `${item.billable}%`}
                    </div>
                    <div
                      className="bg-blue-500 flex items-center justify-center text-xs text-white"
                      style={{ width: `${item.nonBillable}%` }}
                    >
                      {item.nonBillable > 10 && `${item.nonBillable}%`}
                    </div>
                    <div
                      className="bg-gray-200 flex items-center justify-center text-xs text-gray-600"
                      style={{ width: `${item.available}%` }}
                    >
                      {item.available > 10 && `${item.available}%`}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-500 rounded" />
                      Billable
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-blue-500 rounded" />
                      Non-billable
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-gray-200 rounded" />
                      Available
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bottlenecks" className="space-y-4">
          {bottlenecks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No bottlenecks detected</p>
                <p className="text-sm">Resource allocation is optimal</p>
              </CardContent>
            </Card>
          ) : (
            bottlenecks.map((bottleneck: any, index: number) => (
              <Card key={index} className="border-l-4 border-l-red-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{bottleneck.resource}</CardTitle>
                    <Badge variant={
                      bottleneck.severity === "high" ? "destructive" : "default"
                    }>
                      {bottleneck.severity} severity
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Utilization</p>
                      <p className="font-semibold text-red-600">{bottleneck.utilization}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Impact</p>
                      <p className="font-semibold">{bottleneck.impact}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-1">💡 Recommendation</p>
                    <p className="text-sm text-blue-800">{bottleneck.recommendation}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
