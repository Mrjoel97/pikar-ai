import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Play, Shield } from "lucide-react";

interface QualityDashboardProps {
  businessId: Id<"businesses">;
}

export function QualityDashboard({ businessId }: QualityDashboardProps) {
  const qualityChecks = useQuery(api.dataWarehouse.listQualityChecks, { businessId });
  const sources = useQuery(api.dataWarehouse.listDataSources, { businessId });
  const createCheck = useMutation(api.dataWarehouse.createQualityCheck);
  const runCheck = useMutation(api.dataWarehouse.runQualityCheck);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    sourceId: "",
    checkType: "completeness" as "completeness" | "accuracy" | "consistency" | "timeliness" | "validity",
    schedule: "",
    enabled: true,
  });

  const handleCreate = async () => {
    if (!form.name || !form.sourceId) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createCheck({
        businessId,
        sourceId: form.sourceId as Id<"dataWarehouseSources">,
        name: form.name,
        checkType: form.checkType,
        rules: [],
        schedule: form.schedule,
        enabled: form.enabled,
      });
      toast.success("Quality check created successfully");
      setIsCreateOpen(false);
      setForm({ name: "", sourceId: "", checkType: "completeness", schedule: "", enabled: true });
    } catch (error: any) {
      toast.error(error.message || "Failed to create quality check");
    }
  };

  const handleRun = async (checkId: Id<"qualityChecks">) => {
    try {
      const result = await runCheck({ checkId });
      toast.success(`Quality check completed: ${result.score}% score`);
    } catch (error: any) {
      toast.error(error.message || "Failed to run quality check");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Data Quality Checks</h3>
          <p className="text-sm text-muted-foreground">
            Monitor and validate data quality across sources
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Check
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Quality Check</DialogTitle>
              <DialogDescription>
                Configure a new data quality validation
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="check-name">Check Name *</Label>
                <Input
                  id="check-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Customer Email Validation"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="check-source">Data Source *</Label>
                <Select value={form.sourceId} onValueChange={(value) => setForm({ ...form, sourceId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a data source" />
                  </SelectTrigger>
                  <SelectContent>
                    {sources?.map((source: any) => (
                      <SelectItem key={source._id} value={source._id}>
                        {source.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="check-type">Check Type *</Label>
                <Select value={form.checkType} onValueChange={(value: any) => setForm({ ...form, checkType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completeness">Completeness</SelectItem>
                    <SelectItem value="accuracy">Accuracy</SelectItem>
                    <SelectItem value="consistency">Consistency</SelectItem>
                    <SelectItem value="timeliness">Timeliness</SelectItem>
                    <SelectItem value="validity">Validity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="check-schedule">Schedule (cron)</Label>
                <Input
                  id="check-schedule"
                  value={form.schedule}
                  onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                  placeholder="0 */6 * * * (every 6 hours)"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="check-enabled">Enable Check</Label>
                <Switch
                  id="check-enabled"
                  checked={form.enabled}
                  onCheckedChange={(checked) => setForm({ ...form, enabled: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create Check</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {qualityChecks?.map((check: any) => (
          <Card key={check._id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-base">{check.name}</CardTitle>
                    <CardDescription className="mt-1 capitalize">
                      {check.checkType} validation
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={check.enabled ? "default" : "secondary"}>
                  {check.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {check.rules.length} rule(s)
                  {check.schedule && ` • Schedule: ${check.schedule}`}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRun(check._id)}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Run Check
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!qualityChecks || qualityChecks.length === 0) && (
          <Card>
            <CardContent className="p-12 text-center">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No quality checks configured</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first quality check to validate data
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Check
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}