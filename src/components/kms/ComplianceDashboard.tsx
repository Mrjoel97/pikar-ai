import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shield, CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface ComplianceDashboardProps {
  businessId: Id<"businesses">;
}

export function ComplianceDashboard({ businessId }: ComplianceDashboardProps) {
  const report = useQuery(api.kms.getComplianceReport, { businessId });

  if (!report) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-600">Excellent</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-600">Good</Badge>;
    return <Badge variant="destructive">Needs Attention</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Compliance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Compliance Score
          </CardTitle>
          <CardDescription>Overall encryption compliance status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={`text-5xl font-bold ${getScoreColor(report.complianceScore)}`}>
                {report.complianceScore}
              </p>
              <p className="text-sm text-muted-foreground">out of 100</p>
            </div>
            {getScoreBadge(report.complianceScore)}
          </div>
          <Progress value={report.complianceScore} className="h-3" />
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Configs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">{report.summary.activeConfigs}</p>
              {report.summary.activeConfigs > 0 ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <XCircle className="h-8 w-8 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Scheduled Rotations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">{report.summary.scheduledRotations}</p>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overdue Rotations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">{report.summary.overdueRotations}</p>
              {report.summary.overdueRotations > 0 ? (
                <AlertTriangle className="h-8 w-8 text-red-600" />
              ) : (
                <CheckCircle className="h-8 w-8 text-green-600" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Policies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">{report.summary.activePolicies}</p>
              <Shield className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KMS Configurations */}
      <Card>
        <CardHeader>
          <CardTitle>KMS Configurations</CardTitle>
          <CardDescription>Active encryption providers</CardDescription>
        </CardHeader>
        <CardContent>
          {report.configs.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No configurations found</p>
          ) : (
            <div className="space-y-2">
              {report.configs.map((config: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{config.provider.toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(config.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {config.active ? (
                    <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline">Inactive</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Encryption Policies */}
      <Card>
        <CardHeader>
          <CardTitle>Encryption Policies</CardTitle>
          <CardDescription>Data protection rules</CardDescription>
        </CardHeader>
        <CardContent>
          {report.policies.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No policies defined</p>
          ) : (
            <div className="space-y-2">
              {report.policies.map((policy: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{policy.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Level: {policy.encryptionLevel} • {policy.mandatory ? "Mandatory" : "Optional"}
                    </p>
                  </div>
                  {policy.active ? (
                    <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline">Inactive</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Rotations */}
      <Card>
        <CardHeader>
          <CardTitle>Key Rotation Status</CardTitle>
          <CardDescription>Scheduled and overdue rotations</CardDescription>
        </CardHeader>
        <CardContent>
          {report.rotations.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No rotations scheduled</p>
          ) : (
            <div className="space-y-2">
              {report.rotations.map((rotation: any, index: number) => {
                const isOverdue = rotation.nextRotationDate < Date.now();
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">Key Rotation</p>
                      <p className="text-xs text-muted-foreground">
                        Next: {new Date(rotation.nextRotationDate).toLocaleDateString()}
                      </p>
                    </div>
                    {isOverdue ? (
                      <Badge variant="destructive">Overdue</Badge>
                    ) : (
                      <Badge variant="outline">Scheduled</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
