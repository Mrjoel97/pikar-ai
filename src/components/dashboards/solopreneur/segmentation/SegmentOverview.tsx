import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Tag, TrendingUp } from "lucide-react";

type SegmentOverviewProps = {
  segments: {
    total: number;
    byStatus: Record<string, number>;
    byTag: Record<string, number>;
    engagementSegments: Record<string, number>;
  };
  selected: { type: "status" | "tag" | "engagement"; value: string } | null;
  onSelect: (type: "status" | "tag" | "engagement", value: string) => void;
};

export function SegmentOverview({ segments, selected, onSelect }: SegmentOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Totals */}
      <div className="text-center p-4 border rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
        <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{segments.total}</div>
        <div className="text-sm text-emerald-600 dark:text-emerald-400">Total Contacts</div>
      </div>

      {/* Status */}
      <div>
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4" />
          By Status
        </h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(segments.byStatus).map(([status, count]) => (
            <Button
              key={status}
              size="sm"
              variant={selected?.type === "status" && selected?.value === status ? "default" : "outline"}
              onClick={() => onSelect("status", status)}
            >
              {status}: {count}
            </Button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <Tag className="h-4 w-4" />
          By Tags
        </h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(segments.byTag).map(([tag, count]) => (
            <Badge
              key={tag}
              variant={selected?.type === "tag" && selected?.value === tag ? "default" : "secondary"}
              className="cursor-pointer hover:bg-secondary/80"
              onClick={() => onSelect("tag", tag)}
            >
              {tag} ({count})
            </Badge>
          ))}
        </div>
      </div>

      {/* Engagement */}
      <div>
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Engagement Level
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Object.entries(segments.engagementSegments).map(([level, count]) => (
            <div
              key={level}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selected?.type === "engagement" && selected?.value === level
                  ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-500"
                  : "hover:bg-accent"
              }`}
              onClick={() => onSelect("engagement", level)}
            >
              <div className="text-sm text-muted-foreground capitalize">{level}</div>
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {Math.round((count / segments.total) * 100)}% of total
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
