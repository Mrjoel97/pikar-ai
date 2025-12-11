import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface QuickTeamActionsProps {
  onCreateCampaign: () => void;
  onRunDiagnostics: () => void;
  hasSMETier: boolean;
  businessId?: string;
}

export function QuickTeamActions({
  onCreateCampaign,
  onRunDiagnostics,
  hasSMETier,
  businessId,
}: QuickTeamActionsProps) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Quick Team Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">Start New Campaign</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Assign owners, set objectives, and launch with a template.
            </p>
            <Button size="sm" onClick={onCreateCampaign}>
              Create Campaign
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">Review Pending Approvals</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Unblock initiatives awaiting review or sign-off.
            </p>
            <Button variant="outline" size="sm" disabled={!hasSMETier}>
              Open Approvals
            </Button>
            {!hasSMETier && (
              <div className="mt-3">
                <Badge variant="outline" className="border-amber-300 text-amber-700">
                  SME+ Feature
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">Schedule Team Meeting</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Align on goals, blockers, and next actions.
            </p>
            <Button variant="outline" size="sm" disabled={!hasSMETier}>
              Schedule
            </Button>
            {!hasSMETier && (
              <div className="mt-3">
                <Badge variant="outline" className="border-amber-300 text-amber-700">
                  SME+ Feature
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">Run Phase 0 Diagnostics</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Generate a discovery snapshot from your onboarding profile.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onRunDiagnostics}
              disabled={!businessId}
            >
              Run Diagnostics
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
