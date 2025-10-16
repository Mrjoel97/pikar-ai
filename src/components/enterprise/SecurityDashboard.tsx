import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Shield, AlertTriangle, CheckCircle, Clock, FileText } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

// Add local UI types to type map params
type ThreatAlertUI = {
  _id: Id<"threatDetectionAlerts">;
  severity: string;
  alertType: string;
  createdAt: number;
  source: string;
};

type SecurityIncidentUI = {
  _id: Id<"securityIncidents">;
  severity: string;
  title: string;
  type: string;
  status: string;
};

type CertificationUI = {
  _id: Id<"complianceCertifications">;
  certType: string;
  status: string;
  issueDate: number;
  expiryDate: number;
};

export function SecurityDashboard({ businessId }: { businessId?: Id<"businesses"> | null }) {
  // Guest-safe queries; skip when businessId is not present
  const metrics = useQuery(api.enterpriseSecurity.getSecurityMetrics, businessId ? { businessId } : undefined);
  const incidents = useQuery(api.enterpriseSecurity.listIncidents, businessId ? { businessId, limit: 10 } : undefined);
  const alerts = useQuery(
    api.enterpriseSecurity.getThreatAlerts,
    businessId ? { businessId, acknowledged: false, limit: 20 } : undefined
  );
  const certifications = useQuery(api.enterpriseSecurity.getCertifications, businessId ? { businessId } : undefined);
  const audits = useQuery(api.enterpriseSecurity.getSecurityAudits, businessId ? { businessId, limit: 5 } : undefined);

  const acknowledgeAlert = useMutation(api.enterpriseSecurity.acknowledgeAlert);

  const handleAcknowledge = async (alertId: Id<"threatDetectionAlerts">) => {
    try {
      await acknowledgeAlert({ alertId });
      toast.success("Alert acknowledged");
    } catch (error: any) {
      toast.error(error.message || "Failed to acknowledge alert");
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-700 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      default:
        return "bg-blue-100 text-blue-700 border-blue-300";
    }
  };

  // Early return to avoid rendering feature UI without a business context
  if (!businessId) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Shield className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <div className="font-medium">Sign in to access Security & Compliance</div>
          <div className="text-sm text-muted-foreground">This feature requires a business context.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Security & Compliance Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor security posture and compliance status
          </p>
        </div>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{metrics?.activeIncidents || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">Active Incidents</div>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{metrics?.criticalAlerts || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">Critical Alerts</div>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{metrics?.complianceScore || 0}%</div>
                <div className="text-xs text-muted-foreground mt-1">Compliance Score</div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {metrics?.lastAuditDate
                    ? `${Math.floor((Date.now() - metrics.lastAuditDate) / (1000 * 60 * 60 * 24))}d`
                    : "N/A"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Since Last Audit</div>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Threat Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Unacknowledged Threat Alerts</CardTitle>
          <CardDescription>Real-time security threat detection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {alerts?.map((alert: ThreatAlertUI) => (
              <div
                key={alert._id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    <span className="text-sm font-medium">
                      {alert.alertType.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(alert.createdAt).toLocaleString()} • {alert.source}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAcknowledge(alert._id)}
                >
                  Acknowledge
                </Button>
              </div>
            ))}
            {(!alerts || alerts.length === 0) && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No unacknowledged alerts
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Incidents */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Incidents</CardTitle>
          <CardDescription>Incident tracking and management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {incidents?.map((incident: SecurityIncidentUI) => (
              <div
                key={incident._id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getSeverityColor(incident.severity)}>
                      {incident.severity}
                    </Badge>
                    <span className="text-sm font-medium">{incident.title}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {incident.type.replace(/_/g, " ")} • {incident.status}
                  </div>
                </div>
                <Button size="sm" variant="ghost">
                  View Details
                </Button>
              </div>
            ))}
            {(!incidents || incidents.length === 0) && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No recent incidents
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Certifications */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Certifications</CardTitle>
          <CardDescription>Track certification status and renewals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {certifications?.map((cert: CertificationUI) => {
              const daysUntilExpiry = Math.floor(
                (cert.expiryDate - Date.now()) / (1000 * 60 * 60 * 24)
              );
              const isExpiringSoon = daysUntilExpiry < 90;

              return (
                <div key={cert._id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{cert.certType}</span>
                    <Badge
                      variant="outline"
                      className={
                        cert.status === "active"
                          ? "bg-green-100 text-green-700 border-green-300"
                          : "bg-yellow-100 text-yellow-700 border-yellow-300"
                      }
                    >
                      {cert.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Issued: {new Date(cert.issueDate).toLocaleDateString()}</div>
                    <div>Expires: {new Date(cert.expiryDate).toLocaleDateString()}</div>
                    {isExpiringSoon && (
                      <div className="text-orange-600 font-medium mt-2">
                        Expires in {daysUntilExpiry} days
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {(!certifications || certifications.length === 0) && (
              <div className="col-span-full text-center py-8 text-sm text-muted-foreground">
                No certifications tracked
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}