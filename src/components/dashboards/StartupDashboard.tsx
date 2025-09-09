import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StartupDashboardHeader() {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-1">
        <CardTitle className="text-base">Startup</CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">
        Growth-focused view optimized for early teams.
      </CardContent>
    </Card>
  );
}