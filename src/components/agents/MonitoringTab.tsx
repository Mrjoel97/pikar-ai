import React from "react";
import { Id } from "@/convex/_generated/dataModel";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";

export default function MonitoringTab({}: { userId?: Id<"users"> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monitoring</CardTitle>
        <CardDescription>
          Track performance, usage, and success rates of your agents.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-gray-600">
        Connect agents to workflows to see real-time insights here.
      </CardContent>
    </Card>
  );
}
