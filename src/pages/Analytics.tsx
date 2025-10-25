import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { exportData, formatters } from "@/lib/exportUtils";

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { isLoading: authLoading, isAuthenticated } = useAuth();

  // Add: period selector local state
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  const businesses = useQuery(api.businesses.getUserBusinesses, {});
  const firstBizId = businesses?.[0]?._id;
  const initiatives = useQuery(
    api.initiatives.getByBusiness,
    firstBizId ? { businessId: firstBizId } : "skip"
  );
  const agents = useQuery(
    api.aiAgents.getByBusiness,
    firstBizId ? ({ businessId: firstBizId } as any) : undefined
  );
  const workflows = useQuery(
    api.workflows.listWorkflows,
    firstBizId ? ({ businessId: firstBizId } as any) : undefined
  );

  // Normalize initiatives to an array for counting
  const initiativesList = Array.isArray(initiatives) ? initiatives : (initiatives ? [initiatives] : []);

  const workflowExecutions = useQuery(
    api.workflows.getExecutions,
    firstBizId && workflows?.[0]
      ? {
          workflowId: workflows[0]._id,
          paginationOpts: { numItems: 5, cursor: null },
        }
      : undefined
  );

  if (authLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse h-8 w-40 rounded bg-muted mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-28 rounded-lg bg-muted" />
          <div className="h-28 rounded-lg bg-muted" />
          <div className="h-28 rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Sign in to view analytics.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button onClick={() => navigate("/auth")}>Sign In</Button>
            <Button variant="outline" onClick={() => navigate("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = [
    { label: "Initiatives", value: initiativesList.length },
    { label: "AI Agents", value: agents?.length ?? 0 },
    { label: "Workflows", value: workflows?.length ?? 0 },
    { label: "Executions", value: workflowExecutions?.page?.length ?? 0 },
  ];

  // Add: local multi-series sparkline generator (simple, no extra deps)
  const mkTrend = (points: number) => {
    const arr: number[] = [];
    for (let i = 0; i < points; i++) {
      const base = 60 + Math.sin(i / 2) * 10;
      const jitter = (i % 3) * 2 - 2; // -2,0,2
      arr.push(Math.max(5, Math.min(100, base + jitter)));
    }
    return arr;
  };
  const points = period === "7d" ? 7 : period === "30d" ? 12 : 18;
  const revenueSeries = useMemo(() => mkTrend(points), [points]);
  const efficiencySeries = useMemo(() => mkTrend(points).map((v, i) => Math.max(5, Math.min(100, v - (i % 2 === 0 ? 6 : -4)))), [points]);

  const MultiSparkline = ({ a, b }: { a: number[]; b: number[] }) => (
    <div className="flex items-end gap-1 h-20">
      {a.map((v, i) => (
        <div key={`a-${i}`} className="w-1.5 rounded-sm bg-emerald-600/70" style={{ height: `${v}%` }} />
      ))}
      {b.map((v, i) => (
        <div key={`b-${i}`} className="w-1.5 rounded-sm bg-blue-600/60 -ml-1" style={{ height: `${v}%` }} />
      ))}
    </div>
  );

  // Add: universal export
  const handleExport = (format: "csv" | "xlsx" | "pdf") => {
    try {
      exportData({
        filename: `analytics_${period}`,
        format,
        columns: [
          { key: "label", label: "Metric" },
          { key: "value", label: "Value" },
        ],
        data: stats,
        title: "Analytics Overview",
        subtitle: `Period: ${period}`,
      });
    } catch (e: any) {
      toast.error(e?.message || "Export failed");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-sm text-muted-foreground">Overview metrics.</p>
        </div>
        {/* Header actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => handleExport("csv")}>Export CSV</Button>
          <Button variant="outline" onClick={() => handleExport("xlsx")}>Export Excel</Button>
          <Button variant="outline" onClick={() => handleExport("pdf")}>Export PDF</Button>
          <Button variant="outline" onClick={() => navigate("/pricing")}>View Plans</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="bg-white">
            <CardHeader className="pb-2">
              <CardDescription>{s.label}</CardDescription>
              <CardTitle className="text-2xl">{s.value}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs text-muted-foreground">Updated in real time</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add: KPI multi-series block with legends and period selector */}
      <Card>
        <CardHeader className="pb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Revenue vs Efficiency</CardTitle>
            <CardDescription>Lightweight multi-series preview</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-sm bg-emerald-600/70" />
              <span>Revenue</span>
              <div className="w-3 h-3 rounded-sm bg-blue-600/60 ml-3" />
              <span>Efficiency</span>
            </div>
            <div className="flex rounded-md border overflow-hidden">
              {(["7d","30d","90d"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`px-2 py-1 text-xs ${period === p ? "bg-emerald-600 text-white" : "bg-background text-foreground"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <MultiSparkline a={revenueSeries} b={efficiencySeries} />
          <div className="mt-2 text-[11px] text-muted-foreground">
            Benchmarks and precise time-series can be enabled with data sources; this preview adapts to the selected period.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}