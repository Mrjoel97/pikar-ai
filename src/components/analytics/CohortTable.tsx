import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CohortData {
  cohort: string;
  size: number;
  retentionRates: number[];
  ltv?: number;
}

interface CohortTableProps {
  cohorts: CohortData[];
  maxPeriods?: number;
}

export function CohortTable({ cohorts, maxPeriods = 12 }: CohortTableProps) {
  if (!cohorts || cohorts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cohort Retention Heatmap</CardTitle>
          <CardDescription>No cohort data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getHeatmapColor = (rate: number) => {
    if (rate >= 80) return "bg-green-500";
    if (rate >= 60) return "bg-green-400";
    if (rate >= 40) return "bg-yellow-400";
    if (rate >= 20) return "bg-orange-400";
    return "bg-red-400";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cohort Retention Heatmap</CardTitle>
        <CardDescription>Track retention rates by cohort over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-medium sticky left-0 bg-background">Cohort</th>
                <th className="text-right p-2 font-medium">Size</th>
                {Array.from({ length: Math.min(maxPeriods, 12) }, (_, i) => (
                  <th key={i} className="text-center p-2 font-medium min-w-[60px]">
                    M{i}
                  </th>
                ))}
                {cohorts[0]?.ltv !== undefined && (
                  <th className="text-right p-2 font-medium">LTV</th>
                )}
              </tr>
            </thead>
            <tbody>
              {cohorts.map((cohort) => (
                <tr key={cohort.cohort} className="border-b hover:bg-muted/50">
                  <td className="p-2 font-medium sticky left-0 bg-background">
                    {cohort.cohort}
                  </td>
                  <td className="text-right p-2">
                    <Badge variant="outline">{cohort.size}</Badge>
                  </td>
                  {cohort.retentionRates.slice(0, maxPeriods).map((rate, idx) => (
                    <td
                      key={idx}
                      className="text-center p-2"
                    >
                      <div
                        className={`${getHeatmapColor(rate)} text-white rounded px-2 py-1 text-xs font-semibold`}
                      >
                        {rate}%
                      </div>
                    </td>
                  ))}
                  {cohort.ltv !== undefined && (
                    <td className="text-right p-2 font-semibold">
                      ${cohort.ltv}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span>Retention Rate:</span>
          <div className="flex items-center gap-2">
            <div className="bg-green-500 w-4 h-4 rounded" />
            <span>80%+</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-yellow-400 w-4 h-4 rounded" />
            <span>40-60%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-red-400 w-4 h-4 rounded" />
            <span>&lt;20%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
