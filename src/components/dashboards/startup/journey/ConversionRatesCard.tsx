import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowRight } from "lucide-react";

interface ConversionRate {
  from: string;
  to: string;
  rate: number;
  count: number;
  total: number;
}

interface ConversionRatesCardProps {
  conversionRates: ConversionRate[];
}

export function ConversionRatesCard({ conversionRates }: ConversionRatesCardProps) {
  if (!conversionRates || conversionRates.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stage Conversion Rates</CardTitle>
        <CardDescription>Conversion performance between stages</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {conversionRates.map((conversion) => (
          <div key={`${conversion.from}-${conversion.to}`} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium capitalize">{conversion.from}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium capitalize">{conversion.to}</span>
              </div>
              <div className="text-right">
                <Badge variant={conversion.rate >= 50 ? "default" : "secondary"}>
                  {conversion.rate}%
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {conversion.count} / {conversion.total}
                </p>
              </div>
            </div>
            <Progress value={conversion.rate} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
