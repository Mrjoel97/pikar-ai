import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ABTestingSummaryProps {
  testsRunning: number;
  lastUplift: number;
  winnersCount: number;
  onCreateTest: () => void;
  onViewAnalytics: () => void;
  showAnalyticsButton?: boolean;
}

export function ABTestingSummary({
  testsRunning,
  lastUplift,
  winnersCount,
  onCreateTest,
  onViewAnalytics,
  showAnalyticsButton = false,
}: ABTestingSummaryProps) {
  return (
    <section className="mb-4">
      <h2 className="text-lg font-semibold mb-3">A/B Testing Summary</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Tests Running</div>
            <div className="text-2xl font-bold">{testsRunning}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Last Uplift</div>
            <div className="text-2xl font-bold">{lastUplift}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Winners</div>
            <div className="text-2xl font-bold">{winnersCount}</div>
          </CardContent>
        </Card>
      </div>
      <div className="mt-4 flex gap-2">
        <Button onClick={onCreateTest}>Create A/B Test</Button>
        {showAnalyticsButton && (
          <Button variant="outline" size="sm" onClick={onViewAnalytics}>
            View Analytics
          </Button>
        )}
      </div>
    </section>
  );
}
