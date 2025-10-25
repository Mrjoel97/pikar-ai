import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Play, Trash2, Edit } from "lucide-react";

interface PipelineBuilderProps {
  businessId: Id<"businesses">;
}

export function PipelineBuilder({ businessId }: PipelineBuilderProps) {
  const pipelines = useQuery(api.dataWarehouse.listPipelines, { businessId });
  const sources = useQuery(api.dataWarehouse.listDataSources, { businessId });
  const createPipeline = useMutation(api.dataWarehouse.createPipeline);
  const executePipeline = useMutation(api.dataWarehouse.executePipeline);
  const deletePipeline = useMutation(api.dataWarehouse.deletePipeline);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    sourceId: "",
    schedule: "",
    enabled: true,
  });

  const handleCreate = async () => {
    if (!form.name || !form.sourceId) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createPipeline({
        businessId,
        sourceId: form.sourceId as Id<"dataWarehouseSources">,
        name: form.name,
        description: form.description,
        transformations: [],
        schedule: form.schedule,
        enabled: form.enabled,
      });
      toast.success("Pipeline created successfully");
      setIsCreateOpen(false);
      setForm({ name: "", description: "", sourceId: "", schedule: "", enabled: true });
    } catch (error: any) {
      toast.error(error.message || "Failed to create pipeline");
    }
  };

  const handleExecute = async (pipelineId: Id<"etlPipelines">) => {
    try {
      await executePipeline({ pipelineId });
      toast.success("Pipeline execution started");
    } catch (error: any) {
      toast.error(error.message || "Failed to execute pipeline");
    }
  };

  const handleDelete = async (pipelineId: Id<"etlPipelines">) => {
    try {
      await deletePipeline({ pipelineId });
      toast.success("Pipeline deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete pipeline");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">ETL Pipelines</h3>
          <p className="text-sm text-muted-foreground">
            Build and manage data transformation pipelines
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Pipeline
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create ETL Pipeline</DialogTitle>
              <DialogDescription>
                Configure a new data transformation pipeline
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="pipeline-name">Pipeline Name *</Label>
                <Input
                  id="pipeline-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Customer Data Enrichment"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pipeline-source">Data Source *</Label>
                <Select value={form.sourceId} onValueChange={(value) => setForm({ ...form, sourceId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a data source" />
                  </SelectTrigger>
                  <SelectContent>
                    {sources?.map((source) => (
                      <SelectItem key={source._id} value={source._id}>
                        {source.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pipeline-description">Description</Label>
                <Textarea
                  id="pipeline-description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe what this pipeline does"
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pipeline-schedule">Schedule (cron)</Label>
                <Input
                  id="pipeline-schedule"
                  value={form.schedule}
                  onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                  placeholder="0 0 * * * (daily at midnight)"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="pipeline-enabled">Enable Pipeline</Label>
                <Switch
                  id="pipeline-enabled"
                  checked={form.enabled}
                  onCheckedChange={(checked) => setForm({ ...form, enabled: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create Pipeline</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {pipelines?.map((pipeline) => (
          <Card key={pipeline._id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{pipeline.name}</CardTitle>
                  {pipeline.description && (
                    <CardDescription className="mt-1">{pipeline.description}</CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={pipeline.enabled ? "default" : "secondary"}>
                    {pipeline.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                  <Badge variant="outline">{pipeline.status}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {pipeline.transformations.length} transformation(s)
                  {pipeline.schedule && ` • Schedule: ${pipeline.schedule}`}
                  {pipeline.lastRunTime && (
                    <> • Last run: {new Date(pipeline.lastRunTime).toLocaleString()}</>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExecute(pipeline._id)}
                    disabled={pipeline.status === "running"}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Run
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(pipeline._id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!pipelines || pipelines.length === 0) && (
          <Card>
            <CardContent className="p-12 text-center">
              <h3 className="font-semibold mb-2">No pipelines configured</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first ETL pipeline to transform data
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Pipeline
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
