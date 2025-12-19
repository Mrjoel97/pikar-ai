import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitCompare } from "lucide-react";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import { Id } from "@/convex/_generated/dataModel";

interface VendorCompareTabProps {
  compareVendors: Id<"vendors">[];
  vendorComparison: any;
  getRiskBadgeVariant: (level: string) => "destructive" | "default" | "secondary";
}

export function VendorCompareTab({ compareVendors, vendorComparison, getRiskBadgeVariant }: VendorCompareTabProps) {
  return (
    <div className="space-y-4">
      {compareVendors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitCompare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Select vendors from the Vendors tab to compare</p>
            <p className="text-sm text-muted-foreground mt-2">You can compare up to 4 vendors</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Vendor Comparison</CardTitle>
              <CardDescription>Comparing {compareVendors.length} vendors</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={vendorComparison?.map((v: any) => ({
                  vendor: v.name,
                  "On-Time": v.onTimeDelivery,
                  Quality: v.qualityScore,
                  Responsive: v.responsiveness,
                  "Cost Eff.": v.costEfficiency,
                }))[0] ? [
                  { metric: "On-Time", ...Object.fromEntries(vendorComparison.map((v: any) => [v.name, v.onTimeDelivery])) },
                  { metric: "Quality", ...Object.fromEntries(vendorComparison.map((v: any) => [v.name, v.qualityScore])) },
                  { metric: "Responsive", ...Object.fromEntries(vendorComparison.map((v: any) => [v.name, v.responsiveness])) },
                  { metric: "Cost Eff.", ...Object.fromEntries(vendorComparison.map((v: any) => [v.name, v.costEfficiency])) },
                ] : []}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  {vendorComparison?.map((vendor: any, idx: number) => (
                    <Radar
                      key={vendor.vendorId}
                      name={vendor.name}
                      dataKey={vendor.name}
                      stroke={`hsl(${idx * 90}, 70%, 50%)`}
                      fill={`hsl(${idx * 90}, 70%, 50%)`}
                      fillOpacity={0.3}
                    />
                  ))}
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comparison Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Metric</th>
                      {vendorComparison?.map((vendor: any) => (
                        <th key={vendor.vendorId} className="text-left p-2">{vendor.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Performance Score</td>
                      {vendorComparison?.map((vendor: any) => (
                        <td key={vendor.vendorId} className="p-2">{vendor.performanceScore}%</td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Contract Value</td>
                      {vendorComparison?.map((vendor: any) => (
                        <td key={vendor.vendorId} className="p-2">${vendor.contractValue.toLocaleString()}</td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Risk Level</td>
                      {vendorComparison?.map((vendor: any) => (
                        <td key={vendor.vendorId} className="p-2">
                          <Badge variant={getRiskBadgeVariant(vendor.riskLevel)}>{vendor.riskLevel}</Badge>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Category</td>
                      {vendorComparison?.map((vendor: any) => (
                        <td key={vendor.vendorId} className="p-2">{vendor.category}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
