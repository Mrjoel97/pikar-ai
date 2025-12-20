import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface KpiSnapshotProps {
  kpis: {
    admins: number;
    pending: number;
    flagsEnabled: number;
    flagsTotal: number;
    emailQueueDepth: number;
    overdueApprovals: number;
  };
}

export function KpiSnapshot({ kpis }: KpiSnapshotProps) {
  return (
    <div id="section-kpis" className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Admins</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{kpis.admins}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Pending Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{kpis.pending}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Flags Enabled</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{kpis.flagsEnabled}</div>
          <div className="text-xs text-muted-foreground">of {kpis.flagsTotal}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Email Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{kpis.emailQueueDepth}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">SLA Overdue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{kpis.overdueApprovals}</div>
        </CardContent>
      </Card>
    </div>
  );
}
