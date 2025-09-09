import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SmeDashboardHeader() {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">SME Dashboard</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Operational view for small and medium enterprises.
      </CardContent>
    </Card>
  );
}
