import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { AlertCircle, CheckCircle, Clock, TrendingUp, FileText, Target, BarChart3 } from "lucide-react";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface CapaConsoleProps {
  businessId: Id<"businesses">;
}

export function CapaConsole({ businessId }: CapaConsoleProps) {
  const [selectedStatus, setSelectedStatus] = useState<"open" | "in_progress" | "verification" | "closed" | undefined>();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  const capaItems = useQuery(api.capa.listCapaItems, { 
    businessId,
    status: selectedStatus 
  });
  const capaStats = useQuery(api.capa.getCapaStats, { businessId });
  const capaTrends = useQuery(api.capa.getCapaTrends, { businessId, days: 30 });
  
  const createCapa = useMutation(api.capa.createCapaItem);
  const updateCapa = useMutation(api.capa.updateCapaItem);
  const verifyCapa = useMutation(api.capa.verifyCapaItem);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    severity: "medium" as "low" | "medium" | "high" | "critical",
    assigneeId: "",
    slaDeadline: Date.now() + 7 * 24 * 60 * 60 * 1000,
    verificationRequired: true,
  });

  const handleCreate = async () => {
    if (!formData.title || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createCapa({
        businessId,
        ...formData,
      });
      toast.success("CAPA item created successfully");
      setIsCreateOpen(false);
      setFormData({
        title: "",
        description: "",
        severity: "medium",
        assigneeId: "",
        slaDeadline: Date.now() + 7 * 24 * 60 * 60 * 1000,
        verificationRequired: true,
      });
    } catch (error) {
      toast.error("Failed to create CAPA item");
    }
  };

  if (!capaItems || !capaStats) {
    return <div>Loading CAPA data...</div>;
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "destructive";
      case "high": return "default";
      case "medium": return "secondary";
      default: return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "closed": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "verification": return <Target className="h-4 w-4 text-blue-600" />;
      case "in_progress": return <Clock className="h-4 w-4 text-orange-600" />;
      default: return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const completionRate = capaStats.total > 0 ? (capaStats.closed / capaStats.total) * 100 : 0;
  const onTimeRate = capaStats.total > 0 ? ((capaStats.total - capaStats.overdue) / capaStats.total) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Enhanced Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{capaStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Open</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{capaStats.open}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{capaStats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{capaStats.overdue}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{capaStats.critical}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{completionRate.toFixed(0)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              CAPA Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            {capaTrends && capaTrends.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={capaTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="opened" stroke="#ef4444" name="Opened" />
                    <Line type="monotone" dataKey="closed" stroke="#10b981" name="Closed" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                No trend data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Completion Rate</span>
                <span className="font-medium">{completionRate.toFixed(1)}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>On-Time Rate</span>
                <span className="font-medium">{onTimeRate.toFixed(1)}%</span>
              </div>
              <Progress value={onTimeRate} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{capaStats.avgResolutionTime || 0}</div>
                <div className="text-xs text-muted-foreground">Avg Days to Close</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{capaStats.verification || 0}</div>
                <div className="text-xs text-muted-foreground">Pending Verification</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>CAPA Management</CardTitle>
              <CardDescription>
                Corrective and Preventive Action tracking system
              </CardDescription>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>Create CAPA</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New CAPA Item</DialogTitle>
                  <DialogDescription>
                    Document a corrective or preventive action
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Title *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Brief description of the issue"
                    />
                  </div>
                  <div>
                    <Label>Description *</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Detailed description of the issue and context"
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Severity</Label>
                      <Select
                        value={formData.severity}
                        onValueChange={(value: any) => setFormData({ ...formData, severity: value })}
                      >
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
                      <Label>SLA Deadline</Label>
                      <Input
                        type="date"
                        value={new Date(formData.slaDeadline).toISOString().split('T')[0]}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          slaDeadline: new Date(e.target.value).getTime() 
                        })}
                      />
                    </div>
                  </div>
                  <Button onClick={handleCreate} className="w-full">
                    Create CAPA Item
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all" onClick={() => setSelectedStatus(undefined)}>
                All ({capaStats.total})
              </TabsTrigger>
              <TabsTrigger value="open" onClick={() => setSelectedStatus("open")}>
                Open ({capaStats.open})
              </TabsTrigger>
              <TabsTrigger value="in_progress" onClick={() => setSelectedStatus("in_progress")}>
                In Progress ({capaStats.inProgress})
              </TabsTrigger>
              <TabsTrigger value="verification" onClick={() => setSelectedStatus("verification")}>
                Verification ({capaStats.verification})
              </TabsTrigger>
              <TabsTrigger value="closed" onClick={() => setSelectedStatus("closed")}>
                Closed ({capaStats.closed})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3 mt-4">
              {capaItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No CAPA items found</p>
                </div>
              ) : (
                capaItems.map((item: any) => {
                  const isOverdue = item.status !== "closed" && item.slaDeadline < Date.now();
                  const daysRemaining = Math.ceil((item.slaDeadline - Date.now()) / (24 * 60 * 60 * 1000));
                  
                  return (
                    <Card key={item._id} className={isOverdue ? "border-red-500" : ""}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getStatusIcon(item.status)}
                              <CardTitle className="text-base">{item.title}</CardTitle>
                            </div>
                            <CardDescription>{item.description}</CardDescription>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant={getSeverityColor(item.severity)}>
                              {item.severity}
                            </Badge>
                            {isOverdue && (
                              <Badge variant="destructive">Overdue</Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Assignee</p>
                            <p className="font-medium">{item.assigneeName}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Status</p>
                            <p className="font-medium capitalize">{item.status.replace('_', ' ')}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">SLA</p>
                            <p className={`font-medium ${isOverdue ? 'text-red-600' : daysRemaining <= 2 ? 'text-orange-600' : ''}`}>
                              {isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days remaining`}
                            </p>
                          </div>
                        </div>
                        
                        {item.rootCause && (
                          <div className="p-2 bg-muted rounded text-sm">
                            <p className="font-semibold mb-1">Root Cause:</p>
                            <p>{item.rootCause}</p>
                          </div>
                        )}
                        
                        {item.correctiveAction && (
                          <div className="p-2 bg-blue-50 rounded text-sm">
                            <p className="font-semibold mb-1">Corrective Action:</p>
                            <p>{item.correctiveAction}</p>
                          </div>
                        )}
                        
                        {item.preventiveAction && (
                          <div className="p-2 bg-green-50 rounded text-sm">
                            <p className="font-semibold mb-1">Preventive Action:</p>
                            <p>{item.preventiveAction}</p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          {item.status !== "closed" && (
                            <Button size="sm" variant="outline">
                              Update Status
                            </Button>
                          )}
                          {item.status === "verification" && item.verificationRequired && (
                            <Button size="sm">
                              Verify & Close
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default CapaConsole;