import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, TrendingUp, AlertCircle } from "lucide-react";

interface CapacityTabProps {
  capacityPlanning: any;
}

export function CapacityTab({ capacityPlanning }: CapacityTabProps) {
  if (!capacityPlanning) {
    return <div className="text-sm text-muted-foreground">Loading capacity planning...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Capacity</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{capacityPlanning.currentCapacity}</div>
            <p className="text-xs text-muted-foreground">Full-time employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projected Demand</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {capacityPlanning.projectedDemand?.[capacityPlanning.projectedDemand.length - 1]?.demand?.toFixed(0) || 0}
            </div>
            <p className="text-xs text-blue-600">By Q4 2025</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capacity Gap</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {capacityPlanning.capacityGap?.[capacityPlanning.capacityGap.length - 1]?.gap || 0}
            </div>
            <p className="text-xs text-orange-600">Additional headcount needed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quarterly Capacity Forecast</CardTitle>
          <CardDescription>Projected demand vs current capacity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {capacityPlanning.projectedDemand?.map((quarter: any) => (
              <div key={quarter.quarter} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{quarter.quarter}</span>
                    <Badge variant="outline">{quarter.projects} projects</Badge>
                  </div>
                  <span className="text-sm">
                    {quarter.demand.toFixed(0)} FTEs needed
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Workload</span>
                    <span>{quarter.workload}%</span>
                  </div>
                  <Progress 
                    value={quarter.workload} 
                    className={`h-2 ${quarter.workload > 100 ? 'bg-red-100' : ''}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Capacity Gap Analysis</CardTitle>
          <CardDescription>Hiring needs by quarter</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {capacityPlanning.capacityGap?.map((gap: any) => (
              <div key={gap.quarter} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{gap.quarter}</span>
                    <Badge
                      variant={
                        gap.severity === "critical"
                          ? "destructive"
                          : gap.severity === "high"
                          ? "default"
                          : "outline"
                      }
                    >
                      {gap.severity}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Additional headcount needed: {gap.gap}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}