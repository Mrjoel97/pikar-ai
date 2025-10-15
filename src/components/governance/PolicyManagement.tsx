import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FileText, Plus, CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface PolicyManagementProps {
  businessId: Id<"businesses"> | undefined;
}

export function PolicyManagement({ businessId }: PolicyManagementProps) {
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isExceptionOpen, setIsExceptionOpen] = useState(false);

  const policies = useQuery(api.policyManagement.listPolicies, businessId ? { businessId } : undefined);
  const pendingApprovals = useQuery(api.policyManagement.getPendingApprovals, businessId ? { businessId } : undefined);
  const compliance = useQuery(api.policyManagement.getPolicyCompliance, businessId ? { businessId } : undefined);
  const exceptions = useQuery(api.policyManagement.getExceptions, businessId ? { businessId } : undefined);

  const createPolicy = useMutation(api.policyManagement.createPolicy);
  const updatePolicy = useMutation(api.policyManagement.updatePolicy);
  const approvePolicy = useMutation(api.policyManagement.approvePolicy);
  const rejectPolicy = useMutation(api.policyManagement.rejectPolicy);
  const createException = useMutation(api.policyManagement.createException);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "security",
    content: "",
    severity: "medium" as "low" | "medium" | "high" | "critical",
    requiresApproval: true,
  });

  const [editData, setEditData] = useState({
    content: "",
    changeNotes: "",
  });

  const [exceptionData, setExceptionData] = useState({
    reason: "",
    expiresAt: "",
  });

  const handleCreate = async () => {
    if (!businessId) return;
    try {
      await createPolicy({ businessId, ...formData });
      toast.success("Policy created successfully");
      setIsCreateOpen(false);
      setFormData({
        title: "",
        description: "",
        category: "security",
        content: "",
        severity: "medium",
        requiresApproval: true,
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to create policy");
    }
  };

  const handleUpdate = async () => {
    if (!selectedPolicy) return;
    try {
      await updatePolicy({
        policyId: selectedPolicy._id,
        content: editData.content,
        changeNotes: editData.changeNotes,
      });
      toast.success("Policy updated successfully");
      setIsEditOpen(false);
      setSelectedPolicy(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to update policy");
    }
  };

  const handleApprove = async (approvalId: Id<"policyApprovals">) => {
    try {
      await approvePolicy({ approvalId });
      toast.success("Policy approved");
    } catch (error: any) {
      toast.error(error.message || "Failed to approve policy");
    }
  };

  const handleReject = async (approvalId: Id<"policyApprovals">, reason: string) => {
    try {
      await rejectPolicy({ approvalId, reason });
      toast.success("Policy rejected");
    } catch (error: any) {
      toast.error(error.message || "Failed to reject policy");
    }
  };

  const handleCreateException = async () => {
    if (!businessId || !selectedPolicy) return;
    try {
      await createException({
        businessId,
        policyId: selectedPolicy._id,
        reason: exceptionData.reason,
        expiresAt: exceptionData.expiresAt ? new Date(exceptionData.expiresAt).getTime() : undefined,
      });
      toast.success("Exception created");
      setIsExceptionOpen(false);
      setExceptionData({ reason: "", expiresAt: "" });
    } catch (error: any) {
      toast.error(error.message || "Failed to create exception");
    }
  };

  if (!businessId) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Sign in to manage policies</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Compliant Policies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">{compliance?.compliant || 0}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Non-Compliant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="text-2xl font-bold">{compliance?.nonCompliant || 0}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Exceptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span className="text-2xl font-bold">{compliance?.exceptions || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals */}
      {pendingApprovals && pendingApprovals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Approvals ({pendingApprovals.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingApprovals.map((approval: any) => (
              <div key={approval._id} className="flex items-center justify-between border rounded-md p-3">
                <div>
                  <p className="font-medium">Policy Approval Request</p>
                  <p className="text-sm text-muted-foreground">
                    Requested {new Date(approval.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleApprove(approval._id)}>
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      const reason = prompt("Reason for rejection:");
                      if (reason) handleReject(approval._id, reason);
                    }}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Policies List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Policies ({policies?.length || 0})
            </CardTitle>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Policy
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Policy</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Policy title"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description"
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
                          <SelectItem value="security">Security</SelectItem>
                          <SelectItem value="privacy">Privacy</SelectItem>
                          <SelectItem value="compliance">Compliance</SelectItem>
                          <SelectItem value="operations">Operations</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Severity</Label>
                      <Select value={formData.severity} onValueChange={(v: any) => setFormData({ ...formData, severity: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Policy Content</Label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Full policy content..."
                      rows={8}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.requiresApproval}
                      onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
                    />
                    <Label>Requires approval before activation</Label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreate}>Create Policy</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!policies ? (
            <p className="text-sm text-muted-foreground">Loading policies...</p>
          ) : policies.length === 0 ? (
            <p className="text-sm text-muted-foreground">No policies yet. Create your first policy.</p>
          ) : (
            policies.map((policy: any) => (
              <div key={policy._id} className="border rounded-md p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{policy.title}</h4>
                      <Badge variant={policy.status === "active" ? "default" : "secondary"}>
                        {policy.status}
                      </Badge>
                      <Badge variant="outline">{policy.severity}</Badge>
                      <span className="text-xs text-muted-foreground">v{policy.version}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{policy.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Category: {policy.category} • Updated {new Date(policy.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedPolicy(policy);
                        setEditData({ content: policy.content, changeNotes: "" });
                        setIsEditOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedPolicy(policy);
                        setIsExceptionOpen(true);
                      }}
                    >
                      Exception
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Edit Policy Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Policy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Policy Content</Label>
              <Textarea
                value={editData.content}
                onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                rows={8}
              />
            </div>
            <div>
              <Label>Change Notes</Label>
              <Textarea
                value={editData.changeNotes}
                onChange={(e) => setEditData({ ...editData, changeNotes: e.target.value })}
                placeholder="Describe what changed in this version..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate}>Update Policy</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Exception Dialog */}
      <Dialog open={isExceptionOpen} onOpenChange={setIsExceptionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Policy Exception</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason</Label>
              <Textarea
                value={exceptionData.reason}
                onChange={(e) => setExceptionData({ ...exceptionData, reason: e.target.value })}
                placeholder="Why is this exception needed?"
              />
            </div>
            <div>
              <Label>Expires At (Optional)</Label>
              <Input
                type="date"
                value={exceptionData.expiresAt}
                onChange={(e) => setExceptionData({ ...exceptionData, expiresAt: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsExceptionOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateException}>Create Exception</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Active Exceptions */}
      {exceptions && exceptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Exceptions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {exceptions.map((exception: any) => (
              <div key={exception._id} className="border rounded-md p-3">
                <p className="text-sm font-medium">{exception.reason}</p>
                <p className="text-xs text-muted-foreground">
                  Created {new Date(exception.createdAt).toLocaleDateString()}
                  {exception.expiresAt && ` • Expires ${new Date(exception.expiresAt).toLocaleDateString()}`}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
