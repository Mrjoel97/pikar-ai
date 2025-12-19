import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function StreamingTab({ businessId }: { businessId: Id<"businesses"> }) {
  const streamingStatus = useQuery(api.dataWarehouse.streaming.getStreamingStatus, { businessId });

  if (!streamingStatus) {
    return <div>Loading streaming status...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Real-time Streaming Pipelines</CardTitle>
        <CardDescription>Monitor and manage streaming data pipelines</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold">{streamingStatus.overall.totalThroughput.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Events/sec</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold">{streamingStatus.overall.avgLatency}ms</div>
              <div className="text-xs text-muted-foreground">Avg Latency</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold">{(streamingStatus.overall.avgErrorRate * 100).toFixed(2)}%</div>
              <div className="text-xs text-muted-foreground">Error Rate</div>
            </div>
          </div>

          <div className="space-y-2">
            {streamingStatus.pipelines.map((pipeline: any) => (
              <div key={pipeline.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{pipeline.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {pipeline.throughput.toLocaleString()} events/sec • {pipeline.latency}ms latency
                  </div>
                </div>
                <Badge variant={pipeline.status === "active" ? "default" : "secondary"}>
                  {pipeline.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
