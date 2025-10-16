import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Database, Plus, RefreshCw, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

// Add local UI types to make maps/reduces strictly typed
type DataSourceSummary = {
  _id: Id<"dataWarehouseSources">;
  name: string;
  type: string;
  status: string;
  lastSyncTime?: number | null;
};

type EtlJob = {
  _id: Id<"dataWarehouseJobs">;
  jobType: string;
  startTime: number;
  recordsProcessed: number;
  status: string;
};

type QualityMetric = {
  metricType: string;
  score: number;
};

export function DataWarehouseManager({ businessId }: { businessId?: Id<"businesses"> | null }) {
  // Make queries guest-safe by skipping when businessId is absent
  const sources = useQuery(api.dataWarehouse.listDataSources, businessId ? { businessId } : undefined);
  const jobHistory = useQuery(
    api.dataWarehouse.getJobHistory,
    businessId ? { businessId, limit: 10 } : undefined
  );
  const qualityMetrics = useQuery(
    api.dataWarehouse.getQualityMetrics,
    businessId ? { businessId } : undefined
  );
  const triggerSync = useMutation(api.dataWarehouse.triggerSync);

  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  const handleSync = async (sourceId: Id<"dataWarehouseSources">) => {
    try {
      await triggerSync({ sourceId });
      toast.success("Sync initiated");
    } catch (error: any) {
      toast.error(error.message || "Failed to start sync");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-100 text-green-700 border-green-300";
      case "syncing":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "error":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-4 w-4" />;
      case "syncing":
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case "error":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Early return to avoid rendering feature UI without a business context
  if (!businessId) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Database className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <div className="font-medium">Sign in to access the Data Warehouse</div>
          <div className="text-sm text-muted-foreground">This feature requires a business context.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            Data Warehouse Integration
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage external data sources and ETL pipelines
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Data Source
        </Button>
      </div>

      {/* Data Sources */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sources?.map((source: DataSourceSummary) => (
          <Card key={source._id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{source.name}</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {source.type.toUpperCase()}
                  </CardDescription>
                </div>
                <Badge variant="outline" className={getStatusColor(source.status)}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(source.status)}
                    {source.status}
                  </span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-muted-foreground">
                {source.lastSyncTime ? (
                  <div>Last sync: {new Date(source.lastSyncTime).toLocaleString()}</div>
                ) : (
                  <div>Never synced</div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleSync(source._id)}
                  disabled={source.status === "syncing"}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Sync Now
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedSource(source._id)}
                >
                  Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!sources || sources.length === 0) && (
          <Card className="col-span-full">
            <CardContent className="p-12 text-center">
              <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No data sources configured</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connect your first data warehouse to start syncing data
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Data Source
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Job History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sync Jobs</CardTitle>
          <CardDescription>ETL job execution history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {jobHistory?.map((job: EtlJob) => (
              <div
                key={job._id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium">{job.jobType.replace("_", " ")}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(job.startTime).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">{job.recordsProcessed.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">records</div>
                  </div>
                  <Badge variant="outline" className={getStatusColor(job.status)}>
                    {job.status}
                  </Badge>
                </div>
              </div>
            ))}
            {(!jobHistory || jobHistory.length === 0) && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No sync jobs yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Quality Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Data Quality Metrics</CardTitle>
          <CardDescription>Overall data health across all sources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {["completeness", "accuracy", "consistency", "timeliness", "validity"].map((metric) => {
              const metricData = qualityMetrics?.filter((m: QualityMetric) => m.metricType === metric);
              const avgScore =
                metricData && metricData.length > 0
                  ? Math.round(
                      metricData.reduce((sum: number, m: QualityMetric) => sum + m.score, 0) / metricData.length
                    )
                  : 0;

              return (
                <div key={metric} className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{avgScore}%</div>
                  <div className="text-xs text-muted-foreground capitalize mt-1">
                    {metric}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}