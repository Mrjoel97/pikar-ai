import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { RiskHeatmap } from "@/components/risk/RiskHeatmap";
import { RiskTrendChart } from "@/components/risk/RiskTrendChart";
import { Id } from "@/convex/_generated/dataModel";

interface ComplianceRiskProps {
  businessId: Id<"businesses"> | undefined;
  isGuest: boolean;
  kpis: any;
  riskAnalyticsEnabled: boolean;
  LockedRibbon: ({ label }: { label?: string }) => React.ReactElement;
}

export function ComplianceRisk({ 
  businessId, 
  isGuest, 
  kpis,
  riskAnalyticsEnabled,
  LockedRibbon 
}: ComplianceRiskProps) {
  const riskMatrix = useQuery(
    api.riskAnalytics.getRiskMatrix,
    isGuest || !businessId || !riskAnalyticsEnabled ? undefined : { businessId }
  );

  const riskTrend30d = useQuery(
    api.riskAnalytics.getRiskTrend,
    isGuest || !businessId || !riskAnalyticsEnabled ? undefined : { businessId, days: 30 }
  );

  // Sparkline utility
  const Sparkline = ({ values, color = "bg-emerald-600" }: { values: number[]; color?: string }) => (
    <div className="flex items-end gap-1 h-12">
      {values.map((v, i) => (
        <div key={i} className={`${color} w-2 rounded-sm`} style={{ height: `${Math.max(6, Math.min(100, v))}%` }} />
      ))}
    </div>
  );

  const mkTrend = (base?: number): number[] => {
    const b = typeof base === "number" && !Number.isNaN(base) ? base : 50;
    const arr: number[] = [];
    for (let i = 0; i < 12; i++) {
      const jitter = ((i % 2 === 0 ? 1 : -1) * (5 + (i % 5))) / 2;
      arr.push(Math.max(5, Math.min(100, b + jitter)));
    }
    return arr;
  };

  const complianceTrend = mkTrend(kpis?.complianceScore ?? 85);
  const riskTrend = mkTrend(100 - (kpis?.riskScore ?? 15));

  return (
    <>
      {/* KPI Trends */}
      <section>
        <h2 className="text-xl font-semibold mb-4">KPI Trends</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Compliance Score</h3>
                <span className="text-xs text-emerald-700">{kpis?.complianceScore ?? 0}%</span>
              </div>
              <Sparkline values={complianceTrend} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Risk (Lower is Better)</h3>
                <span className="text-xs text-emerald-700">{kpis?.riskScore ?? 0}</span>
              </div>
              <Sparkline values={riskTrend} color="bg-emerald-500" />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Risk Analytics Section - gated by feature flag */}
      {!isGuest && riskAnalyticsEnabled && riskMatrix && riskTrend30d && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Risk Analytics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RiskHeatmap 
              matrix={riskMatrix.matrix}
              totalRisks={riskMatrix.totalRisks}
              highRisks={riskMatrix.highRisks}
            />
            <RiskTrendChart 
              trendData={riskTrend30d.trendData}
              byCategory={riskTrend30d.byCategory}
              newRisks={riskTrend30d.newRisks}
              mitigatedRisks={riskTrend30d.mitigatedRisks}
              avgRiskScore={riskTrend30d.avgRiskScore}
              period={riskTrend30d.period}
            />
          </div>
        </section>
      )}

      {/* Show locked ribbon if risk analytics is not enabled */}
      {!isGuest && !riskAnalyticsEnabled && (
        <Card className="border-dashed border-2 border-amber-300">
          <CardContent className="p-4">
            <LockedRibbon label="Risk Analytics requires SME tier or higher" />
          </CardContent>
        </Card>
      )}

      {/* Compliance Summary */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Compliance & Risk</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Recent Compliance Activities</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm">Quarterly audit completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                  <span className="text-sm">New regulation review pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-sm">Policy update scheduled</span>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Hide upgrade prompt for guests */}
          {!isGuest && (
            <Card className="border-dashed border-2 border-gray-300">
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">Executive Controls</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Generate executive reports and automate approvals.
                </p>
                <LockedRibbon label="Executive actions are Enterprise+" />
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </>
  );
}
