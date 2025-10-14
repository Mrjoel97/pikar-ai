import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Tag, Activity } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

type Segments = {
  total: number;
  byStatus: Record<string, number>;
  byTag: Record<string, number>;
  engagementSegments: Record<string, number>;
};

export function CustomerSegmentation({ businessId }: { businessId: Id<"businesses"> }) {
  const segments = useQuery(api.contacts.getContactSegments as any, { businessId }) as
    | Segments
    | undefined
    | null;

  const [selected, setSelected] = useState<{
    type: "status" | "tag" | "engagement";
    value: string;
  } | null>(null);

  const contacts = useQuery(
    api.contacts.getContactsBySegment as any,
    selected
      ? {
          businessId,
          segmentType: selected.type,
          segmentValue: selected.value,
        }
      : undefined
  ) as any[] | undefined | null;

  if (!segments) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customer Segmentation
          </CardTitle>
        </CardHeader>
        <CardContent>Loading segments...</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Customer Segmentation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Totals */}
        <div className="text-center p-4 border rounded-lg">
          <div className="text-3xl font-bold">{segments.total}</div>
          <div className="text-sm text-muted-foreground">Total Contacts</div>
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
                variant="outline"
                onClick={() => setSelected({ type: "status", value: status })}
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
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80"
                onClick={() => setSelected({ type: "tag", value: tag })}
              >
                {tag} ({count})
              </Badge>
            ))}
          </div>
        </div>

        {/* Engagement */}
        <div>
          <h3 className="font-medium mb-3">Engagement Level</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.entries(segments.engagementSegments).map(([level, count]) => (
              <div
                key={level}
                className="border rounded-lg p-3 cursor-pointer hover:bg-accent"
                onClick={() => setSelected({ type: "engagement", value: level })}
              >
                <div className="text-sm text-muted-foreground capitalize">{level}</div>
                <div className="text-xl font-bold">{count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected segment details */}
        {selected && contacts && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">
                {selected.type}: {selected.value} ({contacts.length})
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setSelected(null)}>
                Clear
              </Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {contacts.map((c: any) => (
                <div key={String(c._id)} className="flex items-center justify-between p-2 border rounded text-sm">
                  <div>
                    <div className="font-medium">{c.name || c.email}</div>
                    <div className="text-xs text-muted-foreground">{c.email}</div>
                  </div>
                  <Badge variant="outline">{c.status}</Badge>
                </div>
              ))}
              {contacts.length === 0 && (
                <div className="text-sm text-muted-foreground">No contacts found for this segment.</div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
