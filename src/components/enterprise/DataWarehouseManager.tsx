import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Database, Plus, RefreshCw, AlertCircle, CheckCircle, Clock, Workflow, FileDown, Shield, BarChart3, AlertTriangle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";
import { PipelineBuilder } from "./warehouse/PipelineBuilder";
import { TransformationEditor } from "./warehouse/TransformationEditor";
import { ScheduleConfiguration } from "./warehouse/ScheduleConfiguration";
import { QualityDashboard } from "./warehouse/QualityDashboard";
import { ExportHistory } from "./warehouse/ExportHistory";

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
  const sources = useQuery(api.dataWarehouse.listDataSources, businessId ? { businessId } : undefined);
  const jobHistory = useQuery(
    api.dataWarehouse.getJobHistory,
    businessId ? { businessId, limit: 10 } : undefined
  );
  const qualityMetrics = useQuery(
    api.dataWarehouse.getQualityMetrics,
    businessId ? { businessId } : undefined
  );
  const analytics = useQuery(
    api.dataWarehouse.getWarehouseAnalytics,
    businessId ? { businessId, timeRange: "7d" } : undefined
  );
  
  // New queries for advanced features
  const streamingStatus = useQuery(
    api.dataWarehouse.streaming.getStreamingStatus,
    businessId ? { businessId } : undefined
  );
  const dataLineage = useQuery(
    api.dataWarehouse.lineage.getLineageGraph,
    businessId ? { businessId } : undefined
  );
  const governanceRules = useQuery(
    api.dataWarehouse.governance.getDataGovernanceRules,
    businessId ? { businessId } : undefined
  );
  const governanceViolations = useQuery(
    api.dataWarehouse.governance.getGovernanceViolations,
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
            Manage external data sources, ETL pipelines, and data quality
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Data Source
        </Button>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Data Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.sources.total}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {analytics.sources.connected} connected
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Records Processed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.records.processed.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {analytics.records.successRate.toFixed(1)}% success rate
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">ETL Pipelines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.pipelines.total}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {analytics.pipelines.enabled} enabled
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Job Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.jobs.successRate.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground mt-1">
                {analytics.jobs.successful}/{analytics.jobs.total} jobs
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="sources" className="w-full">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="sources">
            <Database className="h-4 w-4 mr-2" />
            Sources
          </TabsTrigger>
          <TabsTrigger value="pipelines">
            <Workflow className="h-4 w-4 mr-2" />
            Pipelines
          </TabsTrigger>
          <TabsTrigger value="streaming">
            <RefreshCw className="h-4 w-4 mr-2" />
            Streaming
          </TabsTrigger>
          <TabsTrigger value="lineage">
            <BarChart3 className="h-4 w-4 mr-2" />
            Lineage
          </TabsTrigger>
          <TabsTrigger value="governance">
            <Shield className="h-4 w-4 mr-2" />
            Governance
          </TabsTrigger>
          <TabsTrigger value="transformations">
            <RefreshCw className="h-4 w-4 mr-2" />
            Transforms
          </TabsTrigger>
          <TabsTrigger value="exports">
            <FileDown className="h-4 w-4 mr-2" />
            Exports
          </TabsTrigger>
          <TabsTrigger value="quality">
            <Shield className="h-4 w-4 mr-2" />
            Quality
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="pipelines">
          <PipelineBuilder businessId={businessId} />
        </TabsContent>

        <TabsContent value="streaming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Streaming Pipelines</CardTitle>
              <CardDescription>Monitor and manage streaming data pipelines</CardDescription>
            </CardHeader>
            <CardContent>
              {streamingStatus && (
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
                    {streamingStatus.pipelines.map((pipeline) => (
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lineage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Lineage</CardTitle>
              <CardDescription>Track data flow and transformations</CardDescription>
            </CardHeader>
            <CardContent>
              {dataLineage && (
                <div className="space-y-4">
                  <div className="p-6 border rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm font-medium">Data Flow Visualization</div>
                      <Button size="sm" variant="outline">
                        <FileDown className="h-3 w-3 mr-1" />
                        Export
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {dataLineage.nodes.map((node, idx) => (
                        <div key={node.id} className="flex items-center gap-3">
                          <div className={`w-32 p-2 rounded border text-center text-sm ${
                            node.type === "input" ? "bg-blue-50 border-blue-200" :
                            node.type === "output" ? "bg-green-50 border-green-200" :
                            "bg-gray-50 border-gray-200"
                          }`}>
                            {node.data.label}
                          </div>
                          {idx < dataLineage.nodes.length - 1 && (
                            <div className="flex-1 border-t-2 border-dashed border-gray-300" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="governance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Governance Rules</CardTitle>
                <CardDescription>Active data governance policies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {governanceRules?.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{rule.name}</h4>
                        <p className="text-sm text-muted-foreground">{rule.description}</p>
                      </div>
                      <Switch checked={rule.enabled} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Governance Violations</CardTitle>
                <CardDescription>Recent policy violations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {governanceViolations?.map((violation) => (
                    <Alert key={violation.id} variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Compliance Violation</AlertTitle>
                      <AlertDescription>
                        {violation.description}
                        <div className="mt-2 text-xs opacity-80">
                          Detected: {new Date(violation.detectedAt).toLocaleString()}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                  {(!governanceViolations || governanceViolations.length === 0) && (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No violations detected
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transformations">
          <TransformationEditor businessId={businessId} />
        </TabsContent>

        <TabsContent value="exports">
          <ExportHistory businessId={businessId} />
        </TabsContent>

        <TabsContent value="quality">
          <QualityDashboard businessId={businessId} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}