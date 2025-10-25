import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Id } from "@/convex/_generated/dataModel";

interface ScheduleConfigurationProps {
  businessId: Id<"businesses">;
}

export function ScheduleConfiguration({ businessId }: ScheduleConfigurationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule Configuration</CardTitle>
        <CardDescription>Configure automated sync and export schedules</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Schedule configuration coming soon...</p>
      </CardContent>
    </Card>
  );
}
