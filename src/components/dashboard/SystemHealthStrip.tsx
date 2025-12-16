import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, CheckCircle, Clock, Mail, Server, AlertTriangle } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SystemHealthStripProps {
  businessId?: string;
  isGuest?: boolean;
}

export function SystemHealthStrip({ businessId, isGuest }: SystemHealthStripProps) {
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  const envStatus = useQuery(
    api.health.envStatus,
    !isGuest && businessId ? {} : undefined
  ) as any;

  const status = envStatus ?? {};

  // Parse health metrics
  const baseUrlOk = Boolean(status.hasBASE_URL ?? status.hasPublicBaseUrl);
  const hasSalesInbox = Boolean(
    (status.hasSALES_INBOX ?? status.hasSalesInbox) ||
      (status.hasPUBLIC_SALES_INBOX ?? status.hasPublicSalesInbox)
  );
  const hasResend = Boolean(status.hasRESEND ?? status.hasResend);
  const queueDepth = Number(status.emailQueueDepth ?? 0);
  const cronLastProcessed: number | null =
    typeof status.cronLastProcessed === "number" ? status.cronLastProcessed : null;
  const overdueApprovals: number = Number(status.overdueApprovalsCount ?? 0);
  const devSafe = Boolean(status.devSafeEmails ?? status.devSafeEmailsEnabled);

  const cronAgo = useMemo(() => {
    if (!cronLastProcessed) return null;
    const mins = Math.max(0, Math.floor((Date.now() - cronLastProcessed) / 60000));
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }, [cronLastProcessed]);

  // Calculate overall health score
  const healthScore = useMemo(() => {
    let score = 0;
    let total = 0;

    // Email configuration (30%)
    total += 30;
    if (hasResend && hasSalesInbox) score += 30;
    else if (hasResend || hasSalesInbox) score += 15;

    // Base URL (20%)
    total += 20;
    if (baseUrlOk) score += 20;

    // Queue health (20%)
    total += 20;
    if (queueDepth < 50) score += 20;
    else if (queueDepth < 100) score += 10;

    // Cron freshness (15%)
    total += 15;
    if (cronLastProcessed) {
      const minsAgo = Math.floor((Date.now() - cronLastProcessed) / 60000);
      if (minsAgo < 15) score += 15;
      else if (minsAgo < 60) score += 10;
      else if (minsAgo < 240) score += 5;
    }

    // Approvals (15%)
    total += 15;
    if (overdueApprovals === 0) score += 15;
    else if (overdueApprovals < 5) score += 10;
    else if (overdueApprovals < 10) score += 5;

    return Math.round((score / total) * 100);
  }, [hasResend, hasSalesInbox, baseUrlOk, queueDepth, cronLastProcessed, overdueApprovals]);

  const healthStatus = useMemo(() => {
    if (healthScore >= 90) return { label: "Excellent", color: "emerald", icon: CheckCircle };
    if (healthScore >= 70) return { label: "Good", color: "green", icon: CheckCircle };
    if (healthScore >= 50) return { label: "Fair", color: "amber", icon: AlertTriangle };
    return { label: "Needs Attention", color: "red", icon: AlertCircle };
  }, [healthScore]);

  const metrics = [
    {
      key: "email",
      label: "Email Config",
      status: hasResend && hasSalesInbox ? "ok" : hasResend || hasSalesInbox ? "warning" : "error",
      icon: Mail,
      tooltip: hasResend && hasSalesInbox
        ? "Email provider and inbox configured"
        : "Missing email configuration",
      details: {
        resend: hasResend ? "✓ Resend API configured" : "✗ Resend API missing",
        inbox: hasSalesInbox ? "✓ Sales inbox configured" : "✗ Sales inbox missing",
        mode: devSafe ? "⚠ DEV Safe Mode (emails stubbed)" : "✓ Production mode",
      },
    },
    {
      key: "baseUrl",
      label: "Base URL",
      status: baseUrlOk ? "ok" : "error",
      icon: Server,
      tooltip: baseUrlOk ? "Public base URL configured" : "Base URL not set",
      details: {
        configured: baseUrlOk ? "✓ VITE_PUBLIC_BASE_URL set" : "✗ VITE_PUBLIC_BASE_URL missing",
        purpose: "Required for unsubscribe links and webhooks",
      },
    },
    {
      key: "queue",
      label: `Queue: ${queueDepth}`,
      status: queueDepth < 50 ? "ok" : queueDepth < 100 ? "warning" : "error",
      icon: Mail,
      tooltip: `${queueDepth} emails in queue`,
      details: {
        depth: `${queueDepth} emails pending`,
        status:
          queueDepth < 50
            ? "✓ Normal queue depth"
            : queueDepth < 100
            ? "⚠ Elevated queue depth"
            : "✗ High queue depth - check cron jobs",
      },
    },
    {
      key: "cron",
      label: cronAgo ? `Cron: ${cronAgo}` : "Cron: N/A",
      status: cronLastProcessed
        ? Date.now() - cronLastProcessed < 15 * 60 * 1000
          ? "ok"
          : Date.now() - cronLastProcessed < 60 * 60 * 1000
          ? "warning"
          : "error"
        : "warning",
      icon: Clock,
      tooltip: cronAgo ? `Last processed ${cronAgo}` : "Cron status unknown",
      details: {
        lastRun: cronAgo || "Unknown",
        status:
          cronLastProcessed && Date.now() - cronLastProcessed < 15 * 60 * 1000
            ? "✓ Running on schedule"
            : "⚠ May be delayed",
      },
    },
    {
      key: "approvals",
      label: `Approvals: ${overdueApprovals}`,
      status: overdueApprovals === 0 ? "ok" : overdueApprovals < 5 ? "warning" : "error",
      icon: AlertCircle,
      tooltip: `${overdueApprovals} overdue approvals`,
      details: {
        overdue: `${overdueApprovals} overdue`,
        status:
          overdueApprovals === 0
            ? "✓ No overdue approvals"
            : overdueApprovals < 5
            ? "⚠ Some approvals overdue"
            : "✗ Many approvals overdue - review SLA",
      },
    },
  ];

  const handleMetricClick = (metricKey: string) => {
    setSelectedMetric(metricKey);
    setDrillDownOpen(true);
  };

  const selectedMetricData = metrics.find((m) => m.key === selectedMetric);

  if (isGuest) {
    return null;
  }

  const HealthIcon = healthStatus.icon;

  return (
    <>
      <Card className="border-l-4 border-l-emerald-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <HealthIcon
                  className={`h-5 w-5 text-${healthStatus.color}-600`}
                />
                <div>
                  <div className="text-sm font-medium">System Health</div>
                  <div className="text-xs text-muted-foreground">
                    {healthStatus.label} ({healthScore}%)
                  </div>
                </div>
              </div>
            </div>

            <TooltipProvider>
              <div className="flex items-center gap-2 flex-wrap">
                {metrics.map((metric) => {
                  const Icon = metric.icon;
                  const statusColors: Record<string, string> = {
                    ok: "border-emerald-300 text-emerald-700 bg-emerald-50",
                    warning: "border-amber-300 text-amber-700 bg-amber-50",
                    error: "border-red-300 text-red-700 bg-red-50",
                  };

                  return (
                    <Tooltip key={metric.key}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-8 gap-1.5 ${statusColors[metric.status] || statusColors.warning}`}
                          onClick={() => handleMetricClick(metric.key)}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">{metric.label}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{metric.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </TooltipProvider>
          </div>

          {devSafe && (
            <div className="mt-3 pt-3 border-t">
              <Badge variant="outline" className="border-amber-400 text-amber-700 bg-amber-50">
                DEV Safe Mode Active - Emails are stubbed
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drill-down dialog */}
      <Dialog open={drillDownOpen} onOpenChange={setDrillDownOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedMetricData?.label} - Details
            </DialogTitle>
            <DialogDescription>
              Detailed health information and remediation guidance
            </DialogDescription>
          </DialogHeader>
          {selectedMetricData && (
            <div className="space-y-4">
              <div className="space-y-2">
                {Object.entries(selectedMetricData.details).map(([key, value]) => (
                  <div key={key} className="flex items-start gap-2 text-sm">
                    <span className="font-mono text-xs text-muted-foreground min-w-24">
                      {key}:
                    </span>
                    <span className="flex-1">{value}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t">
                <div className="text-sm font-medium mb-2">Remediation</div>
                <div className="text-sm text-muted-foreground space-y-1">
                  {selectedMetricData.key === "email" && (
                    <>
                      <p>• Set RESEND_API_KEY in Integrations → API Keys</p>
                      <p>• Set SALES_INBOX or PUBLIC_SALES_INBOX</p>
                      <p>• Verify your domain in Resend dashboard</p>
                    </>
                  )}
                  {selectedMetricData.key === "baseUrl" && (
                    <>
                      <p>• Set VITE_PUBLIC_BASE_URL to your app's public URL</p>
                      <p>• Example: https://app.yourdomain.com</p>
                      <p>• Required for unsubscribe links and webhooks</p>
                    </>
                  )}
                  {selectedMetricData.key === "queue" && (
                    <>
                      <p>• Check cron job execution frequency</p>
                      <p>• Review email sending rate limits</p>
                      <p>• Consider increasing worker capacity</p>
                    </>
                  )}
                  {selectedMetricData.key === "cron" && (
                    <>
                      <p>• Verify cron jobs are running on schedule</p>
                      <p>• Check Convex dashboard for function logs</p>
                      <p>• Review deployment status</p>
                    </>
                  )}
                  {selectedMetricData.key === "approvals" && (
                    <>
                      <p>• Review pending approvals in workflow queue</p>
                      <p>• Notify approval stakeholders</p>
                      <p>• Consider adjusting SLA thresholds</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
