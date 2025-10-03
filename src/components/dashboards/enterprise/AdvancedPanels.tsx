import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Props = {
  isGuest: boolean;
  businessId?: string | null;
  crmConnections: any[] | undefined;
  crmConflicts: any[] | undefined;
  onOpenExperiments: () => void;
  onOpenRoi: () => void;
  onOpenCrm: () => void;
};

export function AdvancedPanels({
  isGuest,
  businessId,
  crmConnections,
  crmConflicts,
  onOpenExperiments,
  onOpenRoi,
  onOpenCrm,
}: Props) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Advanced Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>CRM Integration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isGuest ? (
              <div className="text-sm text-muted-foreground">Demo: Enterprise CRM integration available.</div>
            ) : crmConnections === undefined ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Connected</span>
                  <Badge variant="outline">{crmConnections?.length || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Conflicts</span>
                  <Badge variant={crmConflicts && crmConflicts.length > 0 ? "destructive" : "outline"}>
                    {crmConflicts?.length || 0}
                  </Badge>
                </div>
                <Button size="sm" className="w-full" onClick={onOpenCrm} disabled={!businessId}>
                  Manage CRM
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>A/B Testing</CardTitle>
          </CardHeader>
          <CardContent>
            {!isGuest && businessId ? (
              <>
                <div className="text-sm text-muted-foreground mb-3">Run experiments across campaigns</div>
                <Button size="sm" className="w-full" onClick={onOpenExperiments}>
                  Create Experiment
                </Button>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Sign in to manage experiments.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>ROI Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-3">Time-to-revenue analytics</div>
            <Button size="sm" className="w-full" onClick={onOpenRoi} disabled={!businessId}>
              View ROI Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
