import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Shield, AlertTriangle, CheckCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";
import { ThreatIntelligenceTab } from "./security/ThreatIntelligenceTab";
import { AnomalyDetectionTab } from "./security/AnomalyDetectionTab";
import { IncidentResponseTab } from "./security/IncidentResponseTab";
import { ComplianceMonitoringTab } from "./security/ComplianceMonitoringTab";
import { SecurityScoreCard } from "./security/SecurityScoreCard";

export function SecurityDashboard({ businessId }: { businessId?: Id<"businesses"> | null }) {
  const metrics = useQuery(api.enterpriseSecurity.getSecurityMetrics, businessId ? { businessId } : undefined);
  const alerts = useQuery(
    api.enterpriseSecurity.getThreatAlerts,
    businessId ? { businessId, acknowledged: false, limit: 20 } : undefined
  );

  const threatIntel = useQuery(api.enterpriseSecurity.getThreatIntelligence, businessId ? { businessId } : undefined);
  const anomalyDetection = useQuery(api.enterpriseSecurity.getAnomalyDetection, businessId ? { businessId } : undefined);
  const securityScore = useQuery(api.enterpriseSecurity.getSecurityScore, businessId ? { businessId } : undefined);
  const incidentWorkflow = useQuery(api.enterpriseSecurity.getIncidentResponseWorkflow, businessId ? { businessId } : undefined);
  const complianceMonitoring = useQuery(api.enterpriseSecurity.getComplianceMonitoring, businessId ? { businessId } : undefined);

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

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case "critical": return "bg-red-100 text-red-700 border-red-300";
      case "high": return "bg-orange-100 text-orange-700 border-orange-300";
      case "medium": return "bg-yellow-100 text-yellow-700 border-yellow-300";
      default: return "bg-green-100 text-green-700 border-green-300";
    }
  };

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

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="threats">Threat Intelligence</TabsTrigger>
          <TabsTrigger value="anomalies">Anomaly Detection</TabsTrigger>
          <TabsTrigger value="incidents">Incident Response</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{securityScore?.overallScore || 0}</div>
                    <div className="text-xs text-muted-foreground mt-1">Security Score</div>
                  </div>
                  <Shield className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

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
                    <div className="text-2xl font-bold">{complianceMonitoring?.overallCompliance || 0}%</div>
                    <div className="text-xs text-muted-foreground mt-1">Compliance Score</div>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <SecurityScoreCard securityScore={securityScore} />
        </TabsContent>

        <TabsContent value="threats" className="space-y-4">
          <ThreatIntelligenceTab 
            threatIntel={threatIntel} 
            getSeverityColor={getSeverityColor}
            getThreatLevelColor={getThreatLevelColor}
          />
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-4">
          <AnomalyDetectionTab 
            anomalyDetection={anomalyDetection}
            getSeverityColor={getSeverityColor}
          />
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <IncidentResponseTab 
            incidentWorkflow={incidentWorkflow}
            getSeverityColor={getSeverityColor}
          />
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <ComplianceMonitoringTab complianceMonitoring={complianceMonitoring} />
        </TabsContent>
      </Tabs>
    </div>
  );
}