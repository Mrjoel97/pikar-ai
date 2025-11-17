import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Download, Sparkles } from "lucide-react";
import { toast } from "sonner";

type SegmentDetailsProps = {
  selected: { type: "status" | "tag" | "engagement"; value: string };
  contacts: any[];
  recommendations: any[];
  onGetRecommendations: () => void;
  onClear: () => void;
};

export function SegmentDetails({
  selected,
  contacts,
  recommendations,
  onGetRecommendations,
  onClear,
}: SegmentDetailsProps) {
  const handleExport = () => {
    const csv = [
      ["Name", "Email", "Status", "Tags", "Last Engaged"].join(","),
      ...contacts.map((c: any) =>
        [
          c.name || "",
          c.email,
          c.status,
          (c.tags || []).join(";"),
          c.lastEngagedAt ? new Date(c.lastEngagedAt).toLocaleDateString() : "Never",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `segment-${selected.value}-${Date.now()}.csv`;
    a.click();
    toast.success("Segment exported!");
  };

  return (
    <div className="border-t pt-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">
          {selected.type}: {selected.value} ({contacts.length})
        </h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onGetRecommendations}>
            <Sparkles className="h-4 w-4 mr-1" />
            Get Recommendations
          </Button>
          <Button size="sm" variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button size="sm" variant="ghost" onClick={onClear}>
            Clear
          </Button>
        </div>
      </div>

      {recommendations.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Recommended Actions
          </h4>
          {recommendations.map((rec, idx) => (
            <div key={idx} className="border-l-2 border-blue-500 pl-3 py-1">
              <div className="flex items-center gap-2">
                <Badge variant={rec.priority === "high" ? "destructive" : "secondary"}>
                  {rec.priority}
                </Badge>
                <span className="font-medium">{rec.action}</span>
              </div>
              <p className="text-sm text-muted-foreground">{rec.description}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                Expected: {rec.expectedImpact}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {contacts.map((c: any) => (
          <div
            key={c._id?.toString() || `contact-${Math.random()}`}
            className="flex items-center justify-between p-3 border rounded hover:bg-accent transition-colors"
          >
            <div>
              <div className="font-medium">{c.name || c.email}</div>
              <div className="text-xs text-muted-foreground">{c.email}</div>
              {c.tags && c.tags.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {c.tags.map((tag: string, idx: number) => (
                    <Badge key={`${c._id}-${tag}-${idx}`} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <Badge variant="outline">{c.status}</Badge>
          </div>
        ))}
        {contacts.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-8">
            No contacts found for this segment.
          </div>
        )}
      </div>
    </div>
  );
}
