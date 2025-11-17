import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

type CustomSegmentsProps = {
  segments: any[];
  onDelete: (segmentId: Id<"customerSegments">) => void;
};

export function CustomSegments({ segments, onDelete }: CustomSegmentsProps) {
  if (!segments || segments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No custom segments yet. Create one to get started!
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {segments.map((seg: any) => (
        <div
          key={seg._id?.toString() || `segment-${Math.random()}`}
          className="border rounded-lg p-4 hover:bg-accent transition-colors"
          style={{ borderLeftColor: seg.color, borderLeftWidth: "4px" }}
        >
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium">{seg.name}</h4>
              <p className="text-sm text-muted-foreground">{seg.description}</p>
              <div className="flex gap-2 mt-2">
                {seg.criteria.engagement && (
                  <Badge variant="secondary">Engagement: {seg.criteria.engagement}</Badge>
                )}
                {seg.criteria.status && <Badge variant="secondary">Status: {seg.criteria.status}</Badge>}
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => onDelete(seg._id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
