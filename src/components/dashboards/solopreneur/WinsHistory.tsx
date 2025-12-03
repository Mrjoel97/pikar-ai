import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Win {
  id?: string;
  title?: string;
  date?: string;
  impact?: string;
}

interface WinsHistoryProps {
  wins: Win[];
  streak: number;
  timeSavedTotal: number;
  onClearWins: () => void;
}

export function WinsHistory({ wins, streak, timeSavedTotal, onClearWins }: WinsHistoryProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold">Wins History</h2>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Streak: {streak}d</Badge>
          <Badge variant="outline">Time saved: {timeSavedTotal}m</Badge>
          <Button size="sm" variant="outline" onClick={onClearWins}>
            Clear
          </Button>
        </div>
      </div>
      {wins.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {wins.map((w: Win) => (
            <Card key={String(w.id ?? w.title)}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium text-sm">
                      {String(w.title ?? "Win")}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {w?.date ? `${w.date}` : ""}
                      {w?.impact ? ` • ${w.impact}` : ""}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-4 text-sm text-muted-foreground">
            No wins recorded yet. Celebrate your achievements here!
          </CardContent>
        </Card>
      )}
    </section>
  );
}
