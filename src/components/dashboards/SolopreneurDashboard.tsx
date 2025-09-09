import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SolopreneurDashboardHeader() {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Solopreneur Dashboard</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Focused view tailored for solo operators.
      </CardContent>
    </Card>
  );
}
