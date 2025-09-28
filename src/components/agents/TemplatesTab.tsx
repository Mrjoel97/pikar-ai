import React, { useEffect, useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TemplatesTab({
  userId,
  selectedTier,
}: {
  userId?: Id<"users">;
  selectedTier: string;
}) {
  const seedEnterprise = useAction(api.aiAgents.seedEnterpriseTemplates);
  const [attemptedSeed, setAttemptedSeed] = useState(false);

  const templates = useQuery(api.aiAgents.listTemplates, { tier: selectedTier });

  useEffect(() => {
    if (
      selectedTier === "enterprise" &&
      templates !== undefined &&
      templates.length === 0 &&
      !attemptedSeed
    ) {
      (async () => {
        try {
          await seedEnterprise({});
        } catch {
          // ignore errors (e.g., already seeded)
        } finally {
          setAttemptedSeed(true);
        }
      })();
    }
  }, [selectedTier, templates, attemptedSeed, seedEnterprise]);

  if (templates === undefined) {
    return <div className="text-gray-600">Loading templates...</div>;
  }

  if (!templates.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No templates found</CardTitle>
          <CardDescription>
            Try a different tier or refresh to load the latest templates.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {templates.map((t: any) => (
        <Card key={t._id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t.name}</span>
              <Badge variant="secondary">{t.tier ?? selectedTier}</Badge>
            </CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {(t.tags || []).map((tag: string) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
