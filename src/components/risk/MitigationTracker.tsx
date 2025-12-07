import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, CheckCircle, Clock, AlertCircle, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface RiskMitigation {
  _id: Id<"riskMitigations">;
  businessId: Id<"businesses">;
  title: string;
  description: string;
  category: string;
  priority: "critical" | "high" | "medium" | "low";
  status: "planned" | "in_progress" | "completed" | "cancelled";
  targetDate: number;
  estimatedCost?: number;
  expectedReduction: number;
  actualReduction: number;
  progress: number;
  createdAt: number;
  updatedAt: number;
}

interface MitigationEffectiveness {
  totalMitigations: number;
  totalExpectedReduction: number;
  totalActualReduction: number;
  effectiveness: number;
}

interface MitigationTrackerProps {
  businessId: Id<"businesses">;
}

export function MitigationTracker({ businessId }: MitigationTrackerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedMitigation, setSelectedMitigation] = useState<RiskMitigation | null>(null);

  const mitigations = useQuery(
    api.risk.mitigation.listMitigations,
    { businessId, status: selectedStatus === "all" ? undefined : selectedStatus }
  );
  const effectiveness = useQuery(api.risk.mitigation.getMitigationEffectiveness, { businessId });

  const createMitigation = useMutation(api.risk.mitigation.createMitigationStrategy);
  const updateProgress = useMutation(api.risk.mitigation.updateMitigationProgress);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "operational",
    priority: "medium" as "critical" | "high" | "medium" | "low",
    targetDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    estimatedCost: "",
    expectedReduction: "",
  });

  const [updateData, setUpdateData] = useState({
    progress: 0,
    status: "in_progress" as "planned" | "in_progress" | "completed" | "cancelled",
    actualReduction: "",
    notes: "",
  });

  const handleCreate = async () => {
    try {
      await createMitigation({
        businessId,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        targetDate: new Date(formData.targetDate).getTime(),
        estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : undefined,
        expectedReduction: parseFloat(formData.expectedReduction),
      });
      toast.success("Mitigation strategy created");
      setIsCreateOpen(false);
      setFormData({
        title: "",
        description: "",
        category: "operational",
        priority: "medium",
        targetDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
        estimatedCost: "",
        expectedReduction: "",
      });
    } catch (error) {
      toast.error("Failed to create mitigation");
    }
  };

  const handleUpdate = async () => {
    if (!selectedMitigation) return;
    try {
      await updateProgress({
        mitigationId: selectedMitigation._id,
        progress: updateData.progress,
        status: updateData.status,
        actualReduction: updateData.actualReduction ? parseFloat(updateData.actualReduction) : undefined,
        notes: updateData.notes,
      });
      toast.success("Progress updated");
      setUpdateDialogOpen(false);
      setSelectedMitigation(null);
    } catch (error) {
      toast.error("Failed to update progress");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "in_progress": return <Clock className="h-4 w-4 text-blue-600" />;
      case "cancelled": return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mitigation Tracker</h2>
          <p className="text-muted-foreground">Track risk mitigation strategies and effectiveness</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Strategy
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Mitigation Strategy</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Implement backup system"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the mitigation strategy..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operational">Operational</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="compliance">Compliance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={formData.priority} onValueChange={(v: any) => setFormData({ ...formData, priority: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Target Date</Label>
                  <Input
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Estimated Cost ($)</Label>
                  <Input
                    type="number"
                    value={formData.estimatedCost}
                    onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Expected Reduction (%)</Label>
                  <Input
                    type="number"
                    value={formData.expectedReduction}
                    onChange={(e) => setFormData({ ...formData, expectedReduction: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
              <Button onClick={handleCreate} className="w-full">
                Create Strategy
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {effectiveness && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Strategies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{effectiveness.totalMitigations}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Expected Reduction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{effectiveness.totalExpectedReduction}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Actual Reduction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{effectiveness.totalActualReduction}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Effectiveness
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{effectiveness.effectiveness}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {mitigations?.map((mitigation: RiskMitigation) => (
          <Card key={mitigation._id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(mitigation.status)}
                    <h3 className="font-semibold">{mitigation.title}</h3>
                    <Badge variant={
                      mitigation.priority === "critical" ? "destructive" :
                      mitigation.priority === "high" ? "default" : "secondary"
                    }>
                      {mitigation.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{mitigation.description}</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{mitigation.progress}%</span>
                    </div>
                    <Progress value={mitigation.progress} className="h-2" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Target: </span>
                      <span className="font-medium">{new Date(mitigation.targetDate).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Expected: </span>
                      <span className="font-medium">{mitigation.expectedReduction}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Actual: </span>
                      <span className="font-medium text-green-600">{mitigation.actualReduction}%</span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedMitigation(mitigation);
                    setUpdateData({
                      progress: mitigation.progress,
                      status: mitigation.status,
                      actualReduction: mitigation.actualReduction.toString(),
                      notes: "",
                    });
                    setUpdateDialogOpen(true);
                  }}
                >
                  Update
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Progress</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Progress (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={updateData.progress}
                onChange={(e) => setUpdateData({ ...updateData, progress: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={updateData.status} onValueChange={(v: any) => setUpdateData({ ...updateData, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Actual Reduction (%)</Label>
              <Input
                type="number"
                value={updateData.actualReduction}
                onChange={(e) => setUpdateData({ ...updateData, actualReduction: e.target.value })}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={updateData.notes}
                onChange={(e) => setUpdateData({ ...updateData, notes: e.target.value })}
                placeholder="Add update notes..."
                rows={3}
              />
            </div>
            <Button onClick={handleUpdate} className="w-full">
              Save Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}