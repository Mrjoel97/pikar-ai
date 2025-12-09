import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, XCircle } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface RetryManagerProps {
  businessId: Id<"businesses">;
}

export function RetryManager({ businessId }: RetryManagerProps) {
  const deliveries = useQuery(api.webhooks.listDeliveries, { businessId });

  const failedDeliveries = deliveries?.filter((d: any) => d.status === "failed") || [];
  const pendingRetries = deliveries?.filter((d: any) => d.status === "pending" && d.nextRetryAt) || [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Failed Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedDeliveries.length}</div>
            <p className="text-xs text-muted-foreground">Moved to dead letter queue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pending Retries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRetries.length}</div>
            <p className="text-xs text-muted-foreground">Scheduled for retry</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {deliveries?.slice(0, 20).map((delivery: any) => (
              <div key={delivery._id} className="flex items-start justify-between border-b pb-3 last:border-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={
                        delivery.status === "success"
                          ? "outline"
                          : delivery.status === "failed"
                          ? "destructive"
                          : "default"
                      }
                    >
                      {delivery.status}
                    </Badge>
                    <span className="text-sm font-medium">{delivery.event}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Attempts: {delivery.attempts} | Last: {new Date(delivery.lastAttemptAt).toLocaleString()}
                  </p>
                  {delivery.errorMessage && (
                    <p className="text-xs text-red-600 mt-1">{delivery.errorMessage}</p>
                  )}
                  {delivery.nextRetryAt && (
                    <p className="text-xs text-blue-600 mt-1">
                      Next retry: {new Date(delivery.nextRetryAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {delivery.status === "failed" && (
                    <Button size="sm" variant="ghost">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {(!deliveries || deliveries.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                No webhook deliveries yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
