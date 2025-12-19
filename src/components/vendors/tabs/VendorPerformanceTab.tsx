import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface VendorPerformanceTabProps {
  performance: any;
}

export function VendorPerformanceTab({ performance }: VendorPerformanceTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Metrics</CardTitle>
        <CardDescription>Average scores across all vendors</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">On-Time Delivery</span>
              <span className="text-sm font-medium">{performance?.onTimeDelivery || 0}%</span>
            </div>
            <Progress value={performance?.onTimeDelivery || 0} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">Quality Score</span>
              <span className="text-sm font-medium">{performance?.qualityScore || 0}%</span>
            </div>
            <Progress value={performance?.qualityScore || 0} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">Responsiveness</span>
              <span className="text-sm font-medium">{performance?.responsiveness || 0}%</span>
            </div>
            <Progress value={performance?.responsiveness || 0} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">Cost Efficiency</span>
              <span className="text-sm font-medium">{performance?.costEfficiency || 0}%</span>
            </div>
            <Progress value={performance?.costEfficiency || 0} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
