import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function EnterpriseDashboardHeader() {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Enterprise Dashboard</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Governance-first view for complex organizations.
      </CardContent>
    </Card>
  );
}
