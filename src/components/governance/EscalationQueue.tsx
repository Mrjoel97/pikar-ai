import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { AlertCircle, CheckCircle, Clock, TrendingUp, TrendingDown, Target, Activity } from "lucide-react";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface EscalationQueueProps {
  businessId: Id<"businesses">;
}

export function EscalationQueue({ businessId }: EscalationQueueProps) {
  const pendingEscalations = useQuery(api.governanceAutomation.getEscalations, {
    businessId,
    status: "pending",
  });
  const resolvedEscalations = useQuery(api.governanceAutomation.getEscalations, {
    businessId,
    status: "resolved",
  });
  const scoreTrend = useQuery(api.governanceAutomation.getGovernanceScoreTrend, {
    businessId,
    days: 30,
  });
  const remediationHistory = useQuery(api.governanceAutomation.getRemediationHistory, {
    businessId,
    limit: 10,
  });
  
  const resolveEscalation = useMutation(api.governanceAutomation.resolveEscalation);
  const autoRemediate = useMutation(api.governanceAutomation.autoRemediateViolation);

  const [selectedEscalation, setSelectedEscalation] = useState<string | null>(null);
  const [resolution, setResolution] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  const handleResolve = async (escalationId: Id<"governanceEscalations">) => {
    if (!resolution.trim()) {
      toast.error("Please provide a resolution note");
      return;
    }

    try {
      await resolveEscalation({ escalationId, resolution });
      toast.success("Escalation resolved successfully");
      setSelectedEscalation(null);
      setResolution("");
    } catch (error) {
      toast.error("Failed to resolve escalation");
    }
  };

  const handleAutoRemediate = async (workflowId: Id<"workflows">, violationType: string) => {
    try {
      const result = await autoRemediate({ workflowId, violationType });
      if (result.remediated) {
        toast.success(`Auto-remediation applied: ${result.action}`);
      } else {
        toast.info("No automatic remediation available for this violation type");
      }
    } catch (error) {
      toast.error("Failed to apply auto-remediation");
    }
  };

  if (!pendingEscalations || !scoreTrend) {
    return <div>Loading escalation data...</div>;
  }

  const overdueEscalations = pendingEscalations.filter((e: any) => e.isOverdue);
  const criticalEscalations = pendingEscalations.filter((e: any) => 
    e.violationType.includes("critical") || e.count >= 5
  );

  // Calculate metrics
  const totalResolved = resolvedEscalations?.length || 0;
  const avgResolutionTime = resolvedEscalations?.reduce((acc: number, e: any) => {
    if (e.resolvedAt && e.createdAt) {
      return acc + (e.resolvedAt - e.createdAt) / (24 * 60 * 60 * 1000);
    }
    return acc;
  }, 0) / (totalResolved || 1);

  const resolutionRate = totalResolved > 0 
    ? (totalResolved / (totalResolved + pendingEscalations.length)) * 100 
    : 0;

  return (
    <div className="space-y-4">
      {/* Enhanced Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{pendingEscalations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{overdueEscalations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{criticalEscalations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{totalResolved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg Resolution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgResolutionTime.toFixed(1)}d</div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Governance Score Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Current Score</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{scoreTrend.currentScore}</span>
                  {scoreTrend.currentScore >= 80 ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  )}
                </div>
              </div>
              <Progress value={scoreTrend.currentScore} className="h-2" />
            </div>
            {scoreTrend.trend && scoreTrend.trend.length > 0 && (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scoreTrend.trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Resolution Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Resolution Rate</span>
                <span className="font-medium">{resolutionRate.toFixed(1)}%</span>
              </div>
              <Progress value={resolutionRate} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{scoreTrend.compliantCount}</div>
                <div className="text-xs text-muted-foreground">Compliant Workflows</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{scoreTrend.totalCount}</div>
                <div className="text-xs text-muted-foreground">Total Workflows</div>
              </div>
            </div>
            {remediationHistory && remediationHistory.length > 0 && (
              <div className="pt-2 border-t">
                <div className="text-sm font-medium mb-2">Recent Auto-Remediations</div>
                <div className="space-y-1">
                  {remediationHistory.slice(0, 3).map((rem: any) => (
                    <div key={rem._id} className="text-xs text-muted-foreground flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span className="truncate">{rem.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Escalation Queue
              </CardTitle>
              <CardDescription>
                Manage governance violations and compliance issues
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="pending">
                Pending ({pendingEscalations.length})
                {overdueEscalations.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {overdueEscalations.length} overdue
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="resolved">
                Resolved ({totalResolved})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-3 mt-4">
              {pendingEscalations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-600" />
                  <p>No pending escalations</p>
                </div>
              ) : (
                pendingEscalations.map((escalation: any) => (
                  <div
                    key={escalation._id}
                    className={`p-4 border rounded-lg space-y-2 hover:bg-accent/50 transition-colors ${
                      escalation.isOverdue ? "border-red-500 bg-red-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{escalation.workflowName}</h4>
                          <Badge variant="destructive">{escalation.violationType}</Badge>
                          {escalation.isOverdue && (
                            <Badge variant="destructive" className="bg-red-600">
                              Overdue
                            </Badge>
                          )}
                          {escalation.count >= 5 && (
                            <Badge variant="destructive">Critical ({escalation.count})</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Escalated to: {escalation.escalatedTo}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {escalation.isOverdue
                              ? `Overdue by ${Math.abs(escalation.hoursRemaining)}h`
                              : `${escalation.hoursRemaining}h remaining`}
                          </span>
                        </div>
                        {escalation.notes && (
                          <p className="text-sm mt-2 text-muted-foreground italic">
                            "{escalation.notes}"
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {new Date(escalation.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAutoRemediate(escalation.workflowId, escalation.violationType)}
                      >
                        <Target className="h-3 w-3 mr-1" />
                        Auto-Remediate
                      </Button>
                      <Dialog
                        open={selectedEscalation === escalation._id}
                        onOpenChange={(open) => {
                          if (!open) {
                            setSelectedEscalation(null);
                            setResolution("");
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            onClick={() => setSelectedEscalation(escalation._id)}
                          >
                            Resolve
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Resolve Escalation</DialogTitle>
                            <DialogDescription>
                              Provide details about how this escalation was resolved
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="p-3 bg-muted rounded-md text-sm">
                              <div className="font-medium mb-1">Escalation Details</div>
                              <div className="text-muted-foreground">
                                <div>Workflow: {escalation.workflowName}</div>
                                <div>Violation: {escalation.violationType}</div>
                                <div>Count: {escalation.count} violations</div>
                                <div>
                                  Status: {escalation.isOverdue ? (
                                    <span className="text-red-600 font-medium">Overdue</span>
                                  ) : (
                                    <span className="text-green-600">On Time</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Textarea
                              placeholder="Describe the resolution..."
                              value={resolution}
                              onChange={(e) => setResolution(e.target.value)}
                              rows={4}
                            />
                            <Button
                              onClick={() => handleResolve(escalation._id)}
                              className="w-full"
                            >
                              Confirm Resolution
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="resolved" className="space-y-3 mt-4">
              {resolvedEscalations && resolvedEscalations.length > 0 ? (
                resolvedEscalations.map((escalation: any) => (
                  <div key={escalation._id} className="p-4 border rounded-lg space-y-2 bg-green-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <h4 className="font-semibold">{escalation.workflowName}</h4>
                          <Badge variant="outline">{escalation.violationType}</Badge>
                        </div>
                        {escalation.resolution && (
                          <p className="text-sm mt-2 text-muted-foreground">
                            Resolution: {escalation.resolution}
                          </p>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(escalation.resolvedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No resolved escalations yet</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}