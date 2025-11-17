import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

type AIInsightsProps = {
  insights: string;
  segments: any[];
};

export function AIInsights({ insights, segments }: AIInsightsProps) {
  if (!insights) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Click "AI Analyze" to generate insights about your customer segments.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border rounded-lg p-4">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          AI Analysis
        </h4>
        <pre className="text-sm whitespace-pre-wrap font-mono">{insights}</pre>
      </div>

      {segments.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Suggested Segments</h4>
          <div className="grid gap-3">
            {segments.map((seg: any, idx: number) => (
              <div
                key={idx}
                className="border rounded-lg p-4"
                style={{ borderLeftColor: seg.color, borderLeftWidth: "4px" }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-medium">{seg.name}</h5>
                    <p className="text-sm text-muted-foreground">{seg.description}</p>
                    <div className="text-sm mt-2">
                      <Badge variant="secondary">{seg.count} contacts</Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
