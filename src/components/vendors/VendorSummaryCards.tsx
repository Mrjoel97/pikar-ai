import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Calendar, TrendingUp, AlertTriangle } from "lucide-react";

interface VendorSummaryCardsProps {
  totalVendors: number;
  upcomingRenewals: number;
  averagePerformance: number;
  highRiskCount: number;
}

export function VendorSummaryCards({
  totalVendors,
  upcomingRenewals,
  averagePerformance,
  highRiskCount,
}: VendorSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
          <DollarSign className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalVendors}</div>
          <p className="text-xs text-muted-foreground">Active contracts</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Renewals Due</CardTitle>
          <Calendar className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{upcomingRenewals}</div>
          <p className="text-xs text-muted-foreground">Next 90 days</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{averagePerformance}%</div>
          <p className="text-xs text-muted-foreground">Overall score</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">High Risk</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{highRiskCount}</div>
          <p className="text-xs text-muted-foreground">Vendors flagged</p>
        </CardContent>
      </Card>
    </div>
  );
}
