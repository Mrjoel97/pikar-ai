import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Filter,
  TrendingUp,
  FileText,
  User,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

interface CapaConsoleProps {
  businessId: Id<"businesses">;
}

export function CapaConsole({ businessId }: CapaConsoleProps) {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [severityFilter, setSeverityFilter] = useState<string | undefined>(undefined);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCapaId, setSelectedCapaId] = useState<Id<"capaItems"> | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [assigneeId, setAssigneeId] = useState<Id<"users"> | null>(null);
  const [slaDeadline, setSlaDeadline] = useState("");
  const [verificationRequired, setVerificationRequired] = useState(true);

  // Queries
  const capaItems = useQuery(api.capa.listCapaItems, {
    businessId,
    status: statusFilter as any,
    severity: severityFilter as any,
  });
  const stats = useQuery(api.capa.getCapaStats, { businessId });
  const selectedCapa = useQuery(
    api.capa.getCapaItem,
    selectedCapaId ? { capaId: selectedCapaId } : "skip"
  );
  const teamMembers = useQuery(api.teamChat.listTeamMembers, { businessId });

  // Mutations
  const createCapa = useMutation(api.capa.createCapaItem);
  const updateCapa = useMutation(api.capa.updateCapaItem);
  const verifyCapa = useMutation(api.capa.verifyCapaItem);
  const deleteCapa = useMutation(api.capa.deleteCapaItem);

  const handleCreateCapa = async () => {
    if (!title.trim() || !description.trim() || !assigneeId || !slaDeadline) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createCapa({
        businessId,
        title,
        description,
        severity,
        assigneeId,
        slaDeadline: new Date(slaDeadline).getTime(),
        verificationRequired,
      });
      toast.success("CAPA item created successfully");
      setCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(`Failed to create CAPA: ${error.message}`);
    }
  };

  const handleUpdateStatus = async (capaId: Id<"capaItems">, status: string) => {
    try {
      await updateCapa({ capaId, status: status as any });
      toast.success("Status updated");
    } catch (error: any) {
      toast.error(`Failed to update: ${error.message}`);
    }
  };

  const handleVerify = async (capaId: Id<"capaItems">, approved: boolean) => {
    try {
      await verifyCapa({ capaId, approved });
      toast.success(approved ? "CAPA approved and closed" : "CAPA verification rejected");
      setSelectedCapaId(null);
    } catch (error: any) {
      toast.error(`Failed to verify: ${error.message}`);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSeverity("medium");
    setAssigneeId(null);
    setSlaDeadline("");
    setVerificationRequired(true);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "default";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "destructive";
      case "in_progress":
        return "default";
      case "verification":
        return "secondary";
      case "closed":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total CAPA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.open || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.inProgress || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.overdue || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Actions and Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create CAPA
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create CAPA Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief description of the issue"
                />
              </div>
              <div>
                <Label>Description *</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Severity *</Label>
                  <Select value={severity} onValueChange={(v) => setSeverity(v as any)}>
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
                <div>
                  <Label>Assignee *</Label>
                  <Select value={assigneeId || ""} onValueChange={(v) => setAssigneeId(v as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers?.map((member: { _id: string; name: string }) => (
                        <SelectItem key={member._id} value={member._id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
=======
                  </Select>
                </div>
              </div>
              <div>
                <Label>SLA Deadline *</Label>
                <Input
                  type="datetime-local"
                  value={slaDeadline}
                  onChange={(e) => setSlaDeadline(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={verificationRequired}
                  onChange={(e) => setVerificationRequired(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label>Verification Required</Label>
              </div>
              <Button onClick={handleCreateCapa} className="w-full">
                Create CAPA Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? undefined : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="verification">Verification</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={severityFilter || "all"} onValueChange={(v) => setSeverityFilter(v === "all" ? undefined : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* CAPA Items List */}
      <Card>
        <CardHeader>
          <CardTitle>CAPA Items</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {capaItems?.map((item: { _id: Id<"capaItems">; title: string; description: string; severity: string; status: string; slaDeadline: number; assigneeName: string }) => (
                <Card key={item._id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedCapaId(item._id)}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{item.title}</h3>
                          <Badge variant={getSeverityColor(item.severity)}>{item.severity}</Badge>
                          <Badge variant={getStatusColor(item.status)}>{item.status}</Badge>
                          {item.slaDeadline < Date.now() && item.status !== "closed" && (
                            <Badge variant="destructive">
                              <Clock className="h-3 w-3 mr-1" />
                              Overdue
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {item.assigneeName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Due: {new Date(item.slaDeadline).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {capaItems?.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No CAPA items found
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedCapaId} onOpenChange={(open) => !open && setSelectedCapaId(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>CAPA Item Details</DialogTitle>
          </DialogHeader>
          {selectedCapa && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{selectedCapa.title}</h3>
                <div className="flex gap-2 mb-4">
                  <Badge variant={getSeverityColor(selectedCapa.severity)}>{selectedCapa.severity}</Badge>
                  <Badge variant={getStatusColor(selectedCapa.status)}>{selectedCapa.status}</Badge>
                </div>
              </div>
              <Separator />
              <div>
                <Label>Description</Label>
                <p className="text-sm mt-1">{selectedCapa.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Assignee</Label>
                  <p className="text-sm mt-1">{selectedCapa.assigneeName}</p>
                </div>
                <div>
                  <Label>Created By</Label>
                  <p className="text-sm mt-1">{selectedCapa.creatorName}</p>
                </div>
                <div>
                  <Label>SLA Deadline</Label>
                  <p className="text-sm mt-1">{new Date(selectedCapa.slaDeadline).toLocaleString()}</p>
                </div>
                <div>
                  <Label>Created At</Label>
                  <p className="text-sm mt-1">{new Date(selectedCapa.createdAt).toLocaleString()}</p>
                </div>
              </div>
              {selectedCapa.rootCause && (
                <div>
                  <Label>Root Cause</Label>
                  <p className="text-sm mt-1">{selectedCapa.rootCause}</p>
                </div>
              )}
              {selectedCapa.correctiveAction && (
                <div>
                  <Label>Corrective Action</Label>
                  <p className="text-sm mt-1">{selectedCapa.correctiveAction}</p>
                </div>
              )}
              {selectedCapa.preventiveAction && (
                <div>
                  <Label>Preventive Action</Label>
                  <p className="text-sm mt-1">{selectedCapa.preventiveAction}</p>
                </div>
              )}
              <Separator />
              <div className="flex gap-2">
                {selectedCapa.status !== "closed" && (
                  <>
                    <Select
                      value={selectedCapa.status}
                      onValueChange={(v) => handleUpdateStatus(selectedCapa._id, v)}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="verification">Verification</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    {selectedCapa.status === "verification" && selectedCapa.verificationRequired && (
                      <>
                        <Button onClick={() => handleVerify(selectedCapa._id, true)} variant="default">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button onClick={() => handleVerify(selectedCapa._id, false)} variant="destructive">
                          Reject
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CapaConsole;