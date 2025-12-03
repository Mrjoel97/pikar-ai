import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Tip {
  id: string;
  text: string;
}

interface HelpCoachProps {
  visibleTips: Tip[];
  onDismissTip: (tipId: string) => void;
}

export function HelpCoach({ visibleTips, onDismissTip }: HelpCoachProps) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Help Coach</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {visibleTips.map((t) => (
          <Card key={t.id} className="border-emerald-200">
            <CardContent className="p-3 flex items-start justify-between gap-2">
              <span className="text-sm">{t.text}</span>
              <Button
                size="icon"
                variant="outline"
                className="h-6 w-6 text-xs"
                onClick={() => onDismissTip(t.id)}
                aria-label="Dismiss tip"
              >
                ×
              </Button>
            </CardContent>
          </Card>
        ))}
        {visibleTips.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-3 text-sm text-muted-foreground">
              All tips dismissed. They'll refresh later.
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
