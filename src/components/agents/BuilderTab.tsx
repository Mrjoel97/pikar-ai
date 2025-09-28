import React from "react";
import { Id } from "@/convex/_generated/dataModel";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";

export default function BuilderTab({}: { userId?: Id<"users">; selectedTier: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Builder</CardTitle>
        <CardDescription>
          Use templates as a starting point and customize configurations for
          your workflows.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-gray-600">
        Select a template from the Templates tab to begin.
      </CardContent>
    </Card>
  );
}
