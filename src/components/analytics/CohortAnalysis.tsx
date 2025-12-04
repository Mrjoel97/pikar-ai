import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";

interface CohortAnalysisProps {
  businessId: Id<"businesses">;
}

export function CohortAnalysis({ businessId }: CohortAnalysisProps) {
  const [cohortType, setCohortType] = useState<"weekly" | "monthly" | "quarterly">("monthly");
  
  const now = Date.now();
  const sixMonthsAgo = now - 180 * 24 * 60 * 60 * 1000;
  
  const cohortData = useQuery(api.analytics.cohorts.getCohortAnalysis, {
    businessId,
    startDate: sixMonthsAgo,
    endDate: now,
    cohortType,
  });

  if (!cohortData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cohort Analysis</CardTitle>
          <CardDescription>Loading cohort data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Cohort Analysis</CardTitle>
            <CardDescription>Track user retention by cohort over time</CardDescription>
          </div>
          <Select value={cohortType} onValueChange={(v: any) => setCohortType(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly Cohorts</SelectItem>
              <SelectItem value="monthly">Monthly Cohorts</SelectItem>
              <SelectItem value="quarterly">Quarterly Cohorts</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-medium">Cohort</th>
                <th className="text-right p-2 font-medium">Size</th>
                {[0, 1, 2, 3, 4, 5, 6].map((period) => (
                  <th key={period} className="text-right p-2 font-medium">
                    {cohortType === "weekly" ? `W${period}` : `M${period}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohortData.map((cohort: any) => (
                <tr key={cohort.cohortKey} className="border-b hover:bg-muted/50">
                  <td className="p-2 font-medium">{cohort.cohortKey}</td>
                  <td className="text-right p-2">{cohort.totalUsers}</td>
                  {cohort.retentionRates.slice(0, 7).map((rate: number, idx: number) => (
                    <td
                      key={idx}
                      className="text-right p-2"
                      style={{
                        backgroundColor: `rgba(34, 197, 94, ${rate / 100})`,
                      }}
                    >
                      {rate}%
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {cohortData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No cohort data available for the selected period
          </div>
        )}
      </CardContent>
    </Card>
  );
}
