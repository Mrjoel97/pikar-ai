import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AdvancedPanelsProps {
  isGuest: boolean;
  businessId: string | null;
  crmConnections: any[] | undefined;
  crmConflicts: any[] | undefined;
  onOpenExperiments: () => void;
  onOpenRoi: () => void;
  onOpenCrm: () => void;
}

export function AdvancedPanels({
  isGuest,
  businessId,
  crmConnections,
  crmConflicts,
  onOpenExperiments,
  onOpenRoi,
  onOpenCrm,
}: AdvancedPanelsProps) {
  if (isGuest) {
    return null;
  }

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Advanced Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>A/B Testing & Experiments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Run controlled experiments to optimize workflows and campaigns
            </p>
            <Button size="sm" onClick={onOpenExperiments}>
              Create Experiment
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ROI Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Track return on investment across all initiatives
            </p>
            <Button size="sm" onClick={onOpenRoi}>
              View ROI Dashboard
            </Button>
          </CardContent>
        </Card>

        {businessId && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>CRM Bidirectional Sync</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Connections</span>
                <Badge variant="outline">
                  {crmConnections?.length ?? 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sync Conflicts</span>
                <Badge variant={crmConflicts && crmConflicts.length > 0 ? "destructive" : "outline"}>
                  {crmConflicts?.length ?? 0}
                </Badge>
              </div>
              <Button size="sm" variant="outline" onClick={onOpenCrm}>
                Manage CRM Sync
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
