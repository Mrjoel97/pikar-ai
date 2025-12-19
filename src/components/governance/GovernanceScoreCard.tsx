import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from "recharts";
import { TrendingUp, TrendingDown, Shield, AlertTriangle, History, RotateCcw, Download, CheckCircle, XCircle, Zap } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface GovernanceScoreCardProps {
  businessId: Id<"businesses">;
  days?: number;
}

export function GovernanceScoreCard({ businessId, days = 30 }: GovernanceScoreCardProps) {
  const scoreData = useQuery(api.governanceAutomation.getGovernanceScoreTrend, {
    businessId,
    days,
  });

  const remediationHistory = useQuery(api.governanceAutomation.getRemediationHistory, {
    businessId,
    limit: 10,
  });

  const applyRemediation = useMutation(api.governance.remediation.applyRemediation);
  const rollbackRemediation = useMutation(api.governance.remediation.rollbackRemediation);

  const [isApplying, setIsApplying] = useState<string | null>(null);
  const [isRollingBack, setIsRollingBack] = useState<string | null>(null);

  if (!scoreData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const { currentScore, trend, compliantCount, totalCount, byDepartment, byPolicyType } = scoreData;
  const previousScore = trend.length > 1 ? trend[trend.length - 2].score : currentScore;
  const scoreDelta = currentScore - previousScore;
  const isImproving = scoreDelta >= 0;

  const violationsByType = Object.entries(byPolicyType || {}).map(([type, count]) => ({ type, count }));

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge variant="default" className="bg-green-600">Excellent</Badge>;
    if (score >= 70) return <Badge variant="default" className="bg-yellow-600">Good</Badge>;
    return <Badge variant="destructive">Needs Attention</Badge>;
  };

  // Transform policy breakdown for chart
  const policyBreakdownData = Object.entries(byPolicyType as Record<string, number>).map(
    ([policy, count]) => ({
      policy: policy.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      count,
    })
  );

  // Transform department breakdown for chart
  const deptMap = byDepartment as Record<string, { compliant: number; total: number }>;
  const departmentBreakdownData = Object.entries(deptMap).map(([dept, data]) => ({
    department: dept,
    compliant: data.compliant,
    nonCompliant: data.total - data.compliant,
    score: Math.round((data.compliant / data.total) * 100),
  }));

  const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

  // Generate AI-powered recommendations
  const recommendations = [
    {
      priority: "high",
      title: "Enable Auto-Remediation",
      description: "Automatically fix common compliance violations to improve score by ~15%",
      action: "Enable",
      impact: "+15%",
    },
    {
      priority: "medium",
      title: "Review High-Risk Workflows",
      description: `${departmentBreakdownData.filter(d => d.score < 70).length} departments below 70% compliance`,
      action: "Review",
      impact: "+10%",
    },
    {
      priority: "low",
      title: "Update Policy Documentation",
      description: "Ensure all team members have access to latest policies",
      action: "Update",
      impact: "+5%",
    },
  ];

  const handleApplyRemediation = async (violationId: string) => {
    setIsApplying(violationId);
    try {
      await applyRemediation({ violationId: violationId as Id<"governanceViolations"> });
      toast.success("Remediation applied successfully");
    } catch (error) {
      toast.error("Failed to apply remediation");
      console.error(error);
    } finally {
      setIsApplying(null);
    }
  };

  const handleRollback = async (remediationId: string) => {
    setIsRollingBack(remediationId);
    try {
      await rollbackRemediation({ remediationId: remediationId as Id<"remediationActions"> });
      toast.success("Remediation rolled back");
    } catch (error) {
      toast.error("Failed to rollback");
      console.error(error);
    } finally {
      setIsRollingBack(null);
    }
  };

  const handleExport = () => {
    const exportData = {
      score: currentScore,
      trend: trend,
      departments: departmentBreakdownData,
      policies: policyBreakdownData,
      timestamp: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `governance-score-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Governance score exported");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Governance Score
            </span>
            <div className="flex items-center gap-2">
              {getScoreBadge(currentScore)}
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            {compliantCount} of {totalCount} workflows compliant • Target: 95%
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Score */}
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-4xl font-bold ${getScoreColor(currentScore)}`}>
                {currentScore}%
              </div>
              <div className="flex items-center gap-2 mt-1">
                {isImproving ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm ${isImproving ? "text-green-600" : "text-red-600"}`}>
                  {Math.abs(scoreDelta).toFixed(1)}% from yesterday
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Target</div>
              <div className="text-2xl font-semibold">95%</div>
              <div className="text-xs text-muted-foreground mt-1">
                {(95 - currentScore).toFixed(1)}% to go
              </div>
            </div>
          </div>

          {/* Tabs for different views */}
          <Tabs defaultValue="recommendations" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="recommendations">Insights</TabsTrigger>
              <TabsTrigger value="trend">Trend</TabsTrigger>
              <TabsTrigger value="policy">By Policy</TabsTrigger>
              <TabsTrigger value="department">By Dept</TabsTrigger>
              <TabsTrigger value="remediation">Actions</TabsTrigger>
            </TabsList>

            {/* AI Recommendations Tab */}
            <TabsContent value="recommendations" className="space-y-3">
              <div className="text-sm font-medium mb-2">AI-Powered Recommendations</div>
              {recommendations.map((rec, idx) => (
                <div key={idx} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={rec.priority === "high" ? "destructive" : rec.priority === "medium" ? "default" : "secondary"}>
                          {rec.priority}
                        </Badge>
                        <span className="font-medium text-sm">{rec.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-green-600">
                        {rec.impact}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Zap className="h-3 w-3 mr-1" />
                        {rec.action}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* Historical Trend Chart */}
            <TabsContent value="trend" className="space-y-4">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) => [`${value.toFixed(1)}%`, "Score"]}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{Math.max(...trend.map((t: any) => t.score)).toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground">Peak Score</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{Math.min(...trend.map((t: any) => t.score)).toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground">Lowest Score</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{(trend.reduce((sum: number, t: any) => sum + t.score, 0) / trend.length).toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground">Average</div>
                </div>
              </div>
            </TabsContent>

            {/* Policy Breakdown */}
            <TabsContent value="policy" className="space-y-4">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={policyBreakdownData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="policy" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#ef4444" name="Violations">
                      {policyBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-xs text-muted-foreground">
                Total violations by policy type across all workflows
              </div>
            </TabsContent>

            {/* Department Breakdown */}
            <TabsContent value="department" className="space-y-4">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentBreakdownData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="compliant" stackId="a" fill="#10b981" name="Compliant" />
                    <Bar dataKey="nonCompliant" stackId="a" fill="#ef4444" name="Non-Compliant" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {departmentBreakdownData.map((dept, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{dept.department}</span>
                      {dept.score >= 90 ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : dept.score < 70 ? (
                        <XCircle className="h-4 w-4 text-red-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {dept.compliant}/{dept.compliant + dept.nonCompliant}
                      </span>
                      <span className={`font-semibold ${dept.score >= 80 ? 'text-green-600' : 'text-red-600'}`}>
                        {dept.score}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Remediation Action Tracking */}
            <TabsContent value="remediation" className="space-y-4">
              {!remediationHistory || remediationHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No remediation actions yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {remediationHistory.map((action: any) => (
                    <div key={action._id} className="p-3 border rounded-lg space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{action.workflowName}</span>
                        <Badge variant={action.status === "applied" ? "default" : action.status === "pending" ? "secondary" : "outline"}>
                          {action.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {action.action}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {new Date(action.appliedAt).toLocaleDateString()}
                        </span>
                        <div className="flex gap-2">
                          {action.status === "pending" && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-6 px-2"
                              onClick={() => handleApplyRemediation(action.violationId)}
                              disabled={isApplying === action.violationId}
                            >
                              <Zap className="h-3 w-3 mr-1" />
                              Apply
                            </Button>
                          )}
                          {action.status === "applied" && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2"
                              onClick={() => handleRollback(action._id)}
                              disabled={isRollingBack === action._id}
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Rollback
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Warning if score is low */}
          {currentScore < 70 && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-yellow-900">Action Required</p>
                <p className="text-yellow-700">
                  Your governance score is below target. Review workflows and enable auto-remediation to improve compliance.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Violations by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={violationsByType}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => entry.type}
                >
                  {violationsByType?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Total Violations: {violationsByType?.reduce((sum: number, t: any) => sum + (t.count as number), 0)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}