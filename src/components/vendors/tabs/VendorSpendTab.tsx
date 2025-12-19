import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface VendorSpendTabProps {
  spendAnalytics: any;
}

export function VendorSpendTab({ spendAnalytics }: VendorSpendTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${spendAnalytics?.totalSpend.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">All contracts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${spendAnalytics?.activeSpend.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Active contracts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${Math.round(spendAnalytics?.monthlySpend || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Per month</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Spend by Category</CardTitle>
          <CardDescription>Contract value distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={spendAnalytics?.categoryBreakdown || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
              <Bar dataKey="spend" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Vendors by Spend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {spendAnalytics?.topVendors.slice(0, 5).map((vendor: any) => (
              <div key={vendor.vendorId} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{vendor.name}</span>
                    <span className="text-sm">${vendor.spend.toLocaleString()}</span>
                  </div>
                  <Progress value={vendor.percentage} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
