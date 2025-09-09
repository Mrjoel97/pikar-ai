import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StartupDashboardHeader() {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Startup Dashboard</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Growth-oriented view optimized for early teams.
      </CardContent>
    </Card>
  );
}
