import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface GlobalOverviewProps {
  businessId: string | null;
  region: string;
  setRegion: (region: string) => void;
  unit: string;
  setUnit: (unit: string) => void;
  onRunDiagnostics: () => void;
  onEnforceGovernance: () => void;
  slaSummaryText: string | null;
}

export function GlobalOverview({
  businessId,
  region,
  setRegion,
  unit,
  setUnit,
  onRunDiagnostics,
  onEnforceGovernance,
  slaSummaryText,
}: GlobalOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Global Command Center</span>
          <div className="flex items-center gap-2">
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Global</SelectItem>
                <SelectItem value="us">US</SelectItem>
                <SelectItem value="eu">EU</SelectItem>
                <SelectItem value="apac">APAC</SelectItem>
              </SelectContent>
            </Select>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Units</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="ops">Operations</SelectItem>
                <SelectItem value="eng">Engineering</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Active Initiatives</div>
            <div className="text-2xl font-semibold">24</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Global Efficiency</div>
            <div className="text-2xl font-semibold">87%</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Revenue Impact</div>
            <div className="text-2xl font-semibold">$2.4M</div>
          </div>
        </div>
        {slaSummaryText && (
          <div className="flex items-center gap-2">
            <Badge variant="outline">{slaSummaryText}</Badge>
          </div>
        )}
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onRunDiagnostics}>
            Run Diagnostics
          </Button>
          <Button size="sm" variant="outline" onClick={onEnforceGovernance}>
            Enforce Governance
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}