import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shield, AlertTriangle, CheckCircle, Clock, TrendingUp } from "lucide-react";

interface OverviewTabProps {
  scoreTrend: any;
  openViolations: any[];
  criticalViolations: any[];
  rules: any[];
  escalations: any[];
}

export function OverviewTab({ 
  scoreTrend, 
  openViolations, 
  criticalViolations, 
  rules, 
  escalations 
}: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Compliance Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Compliance Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{scoreTrend.currentScore}%</div>
            <Progress value={scoreTrend.currentScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {scoreTrend.compliantCount} of {scoreTrend.totalCount} workflows compliant
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Open Violations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{openViolations.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {criticalViolations.length} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Active Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {rules.filter(r => r.enabled).length}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              of {rules.length} total rules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              Escalations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{escalations?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Pending review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Compliance Trend (30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end gap-1">
            {scoreTrend.trend.map((point: any, idx: number) => (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-emerald-500 rounded-t"
                  style={{ height: `${point.score}%` }}
                />
                {idx % 5 === 0 && (
                  <span className="text-xs text-muted-foreground mt-1">
                    {new Date(point.date).getDate()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Policy Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Violations by Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(scoreTrend.byPolicyType).map(([type, count]: [string, any]) => (
              <div key={type} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize">{type.replace(/_/g, " ")}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
                <Progress 
                  value={(count / openViolations.length) * 100} 
                  className="h-2" 
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance by Department</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(scoreTrend.byDepartment).map(([dept, data]: [string, any]) => {
              const score = Math.round((data.compliant / data.total) * 100);
              return (
                <div key={dept} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize">{dept}</span>
                    <span className="text-muted-foreground">{score}%</span>
                  </div>
                  <Progress value={score} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
