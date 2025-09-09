import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SolopreneurDashboardHeader() {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-1">
        <CardTitle className="text-base">Solopreneur</CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">
        Streamlined view tailored for solo operators.
      </CardContent>
    </Card>
  );
}