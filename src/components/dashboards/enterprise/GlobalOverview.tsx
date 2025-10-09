import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";

type Props = {
  businessId: Id<"businesses"> | null;
  region: string;
  setRegion: (v: string) => void;
  unit: string;
  setUnit: (v: string) => void;
  onRunDiagnostics: () => Promise<void>;
  onEnforceGovernance: () => Promise<void>;
  slaSummaryText?: string | null;
};

// Widget persistence key
const WIDGET_PREFS_KEY = "globalCommandCenter_widgetPrefs";

export function GlobalOverview({
  businessId,
  region,
  setRegion,
  unit,
  setUnit,
  onRunDiagnostics,
  onEnforceGovernance,
  slaSummaryText,
}: Props) {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // Load widget preferences from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(WIDGET_PREFS_KEY);
      if (saved) {
        const prefs = JSON.parse(saved);
        if (prefs.region) setRegion(prefs.region);
        if (prefs.unit) setUnit(prefs.unit);
        if (typeof prefs.autoRefresh === "boolean") setAutoRefresh(prefs.autoRefresh);
      }
    } catch (e) {
      console.error("Failed to load widget preferences:", e);
    }
  }, []);

  // Save widget preferences to localStorage
  useEffect(() => {
    try {
      const prefs = { region, unit, autoRefresh };
      localStorage.setItem(WIDGET_PREFS_KEY, JSON.stringify(prefs));
    } catch (e) {
      console.error("Failed to save widget preferences:", e);
    }
  }, [region, unit, autoRefresh]);

  // Fetch real-time regional metrics
  const regionalMetrics = useQuery(
    api.enterpriseMetrics.getRegionalMetrics,
    businessId ? { businessId, region, unit } : undefined
  );

  // Fetch trend data for sparklines
  const revenueTrend = useQuery(
    api.enterpriseMetrics.getMetricsTrend,
    businessId ? { businessId, region, unit, metric: "revenue", days: 12 } : undefined
  );

  const efficiencyTrend = useQuery(
    api.enterpriseMetrics.getMetricsTrend,
    businessId ? { businessId, region, unit, metric: "efficiency", days: 12 } : undefined
  );

  const complianceTrend = useQuery(
    api.enterpriseMetrics.getMetricsTrend,
    businessId ? { businessId, region, unit, metric: "compliance", days: 12 } : undefined
  );

  const riskTrend = useQuery(
    api.enterpriseMetrics.getMetricsTrend,
    businessId ? { businessId, region, unit, metric: "risk", days: 12 } : undefined
  );

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setLastUpdate(Date.now());
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Update timestamp when data changes
  useEffect(() => {
    if (regionalMetrics) {
      setLastUpdate(Date.now());
    }
  }, [regionalMetrics]);

  const Sparkline = ({ values, color = "bg-emerald-600" }: { values: number[]; color?: string }) => {
    if (!values || values.length === 0) {
      return <div className="text-xs text-muted-foreground">No data</div>;
    }

    return (
      <div className="flex items-end gap-1 h-12">
        {values.map((v, i) => (
          <div key={i} className={`${color} w-2 rounded-sm`} style={{ height: `${Math.max(6, Math.min(100, v))}%` }} />
        ))}
      </div>
    );
  };

  // Use real-time data or fallback to defaults
  const displayRevenue = regionalMetrics?.revenue ?? 0;
  const displayEfficiency = regionalMetrics?.efficiency ?? 0;
  const displayCompliance = regionalMetrics?.complianceScore ?? 94;
  const displayRisk = regionalMetrics?.riskScore ?? 12;

  const formatTimestamp = (ts: number) => {
    const now = Date.now();
    const diff = Math.floor((now - ts) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <section className="rounded-lg border p-4 bg-gradient-to-r from-emerald-50 to-blue-50">
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            {slaSummaryText ?? null}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {formatTimestamp(lastUpdate)}
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="h-7 w-7 p-0"
            >
              <RefreshCw className={`h-3 w-3 ${autoRefresh ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onRunDiagnostics}>
            Run Diagnostics
          </Button>
          <Button size="sm" variant="outline" onClick={onEnforceGovernance}>
            Enforce Governance
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-1">Global Command Center</h2>
          <p className="text-sm text-muted-foreground">
            Multi-region performance and critical system health at a glance
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">🌍 Global</SelectItem>
              <SelectItem value="na">🇺🇸 North America</SelectItem>
              <SelectItem value="eu">🇪🇺 Europe</SelectItem>
              <SelectItem value="apac">🌏 APAC</SelectItem>
            </SelectContent>
          </Select>
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Business Unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Units</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="operations">Operations</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground">Revenue</h3>
            <p className="text-2xl font-bold">${Number(displayRevenue).toLocaleString()}</p>
            <p className="text-xs text-green-600">+12% YoY</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground">Global Efficiency</h3>
            <p className="text-2xl font-bold">{displayEfficiency}%</p>
            <p className="text-xs text-green-600">+3% from last quarter</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground">Compliance Score</h3>
            <p className="text-2xl font-bold">{displayCompliance}%</p>
            <p className="text-xs text-blue-600">
              {displayCompliance >= 90 ? "Excellent" : displayCompliance >= 75 ? "Good" : "Needs attention"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground">Risk Score</h3>
            <p className={`text-2xl font-bold ${displayRisk < 20 ? "text-green-600" : displayRisk < 50 ? "text-yellow-600" : "text-red-600"}`}>
              {displayRisk}
            </p>
            <p className="text-xs text-green-600">
              {displayRisk < 20 ? "Low risk" : displayRisk < 50 ? "Moderate" : "High risk"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-4" />

      <section>
        <h2 className="text-sm font-medium mb-2">Real-Time KPI Trends</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Revenue ({region === "global" ? "Global" : region.toUpperCase()})</h3>
                <span className="text-xs text-emerald-700">${Number(displayRevenue).toLocaleString()}</span>
              </div>
              <Sparkline values={revenueTrend || []} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Efficiency</h3>
                <span className="text-xs text-emerald-700">{displayEfficiency}%</span>
              </div>
              <Sparkline values={efficiencyTrend || []} color="bg-emerald-500" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Compliance</h3>
                <span className="text-xs text-blue-700">{displayCompliance}%</span>
              </div>
              <Sparkline values={complianceTrend || []} color="bg-blue-500" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Risk Score</h3>
                <span className={`text-xs ${displayRisk < 20 ? "text-green-700" : displayRisk < 50 ? "text-yellow-700" : "text-red-700"}`}>
                  {displayRisk}
                </span>
              </div>
              <Sparkline values={riskTrend || []} color={displayRisk < 20 ? "bg-green-500" : displayRisk < 50 ? "bg-yellow-500" : "bg-red-500"} />
            </CardContent>
          </Card>
        </div>
      </section>
    </section>
  );
}