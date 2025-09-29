import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Star } from "lucide-react";

export default function MarketplaceTab({ userId }: { userId?: Id<"users"> }) {
  const items = useQuery(api.aiAgents.listMarketplaceAgents, {} as any);

  if (items === undefined) {
    return <div className="text-gray-600">Loading marketplace...</div>;
  }

  if (!items.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No approved marketplace agents yet</CardTitle>
          <CardDescription>
            Check back soon for curated agents from the community.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map((m: any) => (
        <Card key={m._id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{m.agent?.name ?? "Untitled Agent"}</span>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>{(m.avgRating ?? 0).toFixed(1)}</span>
                <span>({m.ratingsCount ?? 0})</span>
              </div>
            </CardTitle>
            <CardDescription>{m.agent?.description}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-gray-600">
            Runs: {m.stats?.runs ?? 0} • Successes: {m.stats?.successes ?? 0}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}