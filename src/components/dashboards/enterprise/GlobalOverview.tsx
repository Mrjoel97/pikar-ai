import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

type Props = {
  region: string;
  setRegion: (v: string) => void;
  unit: string;
  setUnit: (v: string) => void;
  unifiedRevenue: number;
  unifiedGlobalEfficiency: number;
  revenueTrend: number[];
  efficiencyTrend: number[];
  onRunDiagnostics: () => Promise<void>;
  onEnforceGovernance: () => Promise<void>;
  slaSummaryText?: string | null;
};

export function GlobalOverview({
  region,
  setRegion,
  unit,
  setUnit,
  unifiedRevenue,
  unifiedGlobalEfficiency,
  revenueTrend,
  efficiencyTrend,
  onRunDiagnostics,
  onEnforceGovernance,
  slaSummaryText,
}: Props) {
  const Sparkline = ({ values, color = "bg-emerald-600" }: { values: number[]; color?: string }) => (
    <div className="flex items-end gap-1 h-12">
      {values.map((v, i) => (
        <div key={i} className={`${color} w-2 rounded-sm`} style={{ height: `${Math.max(6, Math.min(100, v))}%` }} />
      ))}
    </div>
  );

  return (
    <section className="rounded-lg border p-4 bg-gradient-to-r from-emerald-50 to-blue-50">
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          {slaSummaryText ?? null}
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
          <h2 className="text-xl font-semibold mb-1">Global Overview</h2>
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
              <SelectItem value="global">Global</SelectItem>
              <SelectItem value="na">North America</SelectItem>
              <SelectItem value="eu">Europe</SelectItem>
              <SelectItem value="apac">APAC</SelectItem>
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
            <p className="text-2xl font-bold">${Number(unifiedRevenue || 0).toLocaleString()}</p>
            <p className="text-xs text-green-600">+12% YoY</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground">Global Efficiency</h3>
            <p className="text-2xl font-bold">{unifiedGlobalEfficiency ?? 0}%</p>
            <p className="text-xs text-green-600">+3% from last quarter</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground">Compliance Score</h3>
            <p className="text-2xl font-bold">—</p>
            <p className="text-xs text-blue-600">Stable</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground">Risk Score</h3>
            <p className="text-2xl font-bold text-green-600">—</p>
            <p className="text-xs text-green-600">Low risk profile</p>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-4" />

      <section>
        <h2 className="text-sm font-medium mb-2">Global KPI Trends</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Revenue (Global)</h3>
                <span className="text-xs text-emerald-700">${Number(unifiedRevenue || 0).toLocaleString()}</span>
              </div>
              <Sparkline values={revenueTrend} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Global Efficiency</h3>
                <span className="text-xs text-emerald-700">{unifiedGlobalEfficiency ?? 0}%</span>
              </div>
              <Sparkline values={efficiencyTrend} color="bg-emerald-500" />
            </CardContent>
          </Card>
        </div>
      </section>
    </section>
  );
}
