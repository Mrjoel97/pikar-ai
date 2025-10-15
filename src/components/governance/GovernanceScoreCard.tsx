import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { TrendingUp, TrendingDown, Shield, AlertTriangle, History, RotateCcw } from "lucide-react";

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

  if (!scoreData) {
    return <div>Loading governance score...</div>;
  }

  const { currentScore, trend, compliantCount, totalCount, byDepartment, byPolicyType } = scoreData;
  const previousScore = trend.length > 1 ? trend[trend.length - 2].score : currentScore;
  const scoreDelta = currentScore - previousScore;
  const isImproving = scoreDelta >= 0;

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

  // Transform policy breakdown for chart (cast to a typed record)
  const policyBreakdownData = Object.entries(byPolicyType as Record<string, number>).map(
    ([policy, count]) => ({
      policy: policy.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      count,
    })
  );

  // Transform department breakdown for chart (cast to a typed record)
  const deptMap = byDepartment as Record<string, { compliant: number; total: number }>;
  const departmentBreakdownData = Object.entries(deptMap).map(([dept, data]) => ({
    department: dept,
    compliant: data.compliant,
    nonCompliant: data.total - data.compliant,
    score: Math.round((data.compliant / data.total) * 100),
  }));

  const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Governance Score
          </span>
          {getScoreBadge(currentScore)}
        </CardTitle>
        <CardDescription>
          {compliantCount} of {totalCount} workflows compliant
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
          </div>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="trend" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trend">Trend</TabsTrigger>
            <TabsTrigger value="policy">By Policy</TabsTrigger>
            <TabsTrigger value="department">By Dept</TabsTrigger>
            <TabsTrigger value="remediation">Actions</TabsTrigger>
          </TabsList>

          {/* Historical Trend Chart */}
          <TabsContent value="trend" className="space-y-4">
            <div className="h-48">
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
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{dept.department}</span>
                  <span className={`font-semibold ${dept.score >= 80 ? 'text-green-600' : 'text-red-600'}`}>
                    {dept.score}%
                  </span>
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
                      <Badge variant={action.status === "applied" ? "default" : "secondary"}>
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
                      {action.status === "applied" && (
                        <Button variant="ghost" size="sm" className="h-6 px-2">
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Rollback
                        </Button>
                      )}
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
                Your governance score is below target. Review workflows and enable auto-remediation.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}