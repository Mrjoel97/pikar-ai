import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function IntegrationStatus() {
  return (
    <Card className="xl:col-span-1">
      <CardHeader className="pb-2">
        <CardTitle>Integration Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">CRM</span>
          <Badge variant="outline" className="border-emerald-300 text-emerald-700">Connected</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Analytics</span>
          <Badge variant="outline" className="border-amber-300 text-amber-700">Attention</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Billing</span>
          <Badge variant="outline" className="border-slate-300 text-slate-700">Not linked</Badge>
        </div>
        <div className="text-xs text-muted-foreground">Integration health overview (static preview).</div>
      </CardContent>
    </Card>
  );
}
