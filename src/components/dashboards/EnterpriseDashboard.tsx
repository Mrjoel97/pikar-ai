import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function EnterpriseDashboardHeader() {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-1">
        <CardTitle className="text-base">Enterprise</CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">
        Governance-first view for complex organizations.
      </CardContent>
    </Card>
  );
}