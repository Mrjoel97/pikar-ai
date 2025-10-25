import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Minus, BarChart3, GitCompare } from "lucide-react";
import { useState } from "react";
import { VendorSummaryCards } from "./VendorSummaryCards";
import { VendorCreateDialog } from "./VendorCreateDialog";
import { VendorPerformanceDialog } from "./VendorPerformanceDialog";
import { VendorOverviewCharts } from "./VendorOverviewCharts";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Checkbox } from "@/components/ui/checkbox";

interface VendorManagementProps {
  businessId?: Id<"businesses">;
  isGuest?: boolean;
}

export function VendorManagement({ businessId, isGuest }: VendorManagementProps) {
  const [performanceDialogOpen, setPerformanceDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Id<"vendors"> | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [compareVendors, setCompareVendors] = useState<Id<"vendors">[]>([]);

  const vendors = useQuery(
    api.vendors.listVendors,
    businessId ? { businessId } : undefined
  );

  const upcomingRenewals = useQuery(
    api.vendors.getUpcomingRenewals,
    businessId ? { businessId, daysAhead: 90 } : undefined
  );

  const riskAssessment = useQuery(
    api.vendors.getVendorRiskAssessment,
    businessId ? { businessId } : undefined
  );

  const performance = useQuery(
    api.vendors.getVendorPerformance,
    businessId ? { businessId } : undefined
  );

  const spendAnalytics = useQuery(
    api.vendors.getSpendAnalytics,
    businessId ? { businessId } : undefined
  );

  const contractTimeline = useQuery(
    api.vendors.getContractTimeline,
    businessId ? { businessId } : undefined
  );

  const vendorComparison = useQuery(
    api.vendors.compareVendors,
    compareVendors.length > 0 ? { vendorIds: compareVendors } : "skip"
  );

  const performanceTrends = useQuery(
    api.vendors.getVendorPerformanceTrends,
    businessId ? { businessId, days: 180 } : undefined
  );

  const getRiskBadgeVariant = (level: string): "destructive" | "default" | "secondary" => {
    switch (level) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "default";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving": return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "declining": return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const riskChartData = riskAssessment ? [
    { name: "High Risk", value: riskAssessment.highRisk, color: "#ef4444" },
    { name: "Medium Risk", value: riskAssessment.mediumRisk, color: "#f59e0b" },
    { name: "Low Risk", value: riskAssessment.lowRisk, color: "#10b981" },
  ] : [];

  const toggleVendorComparison = (vendorId: Id<"vendors">) => {
    setCompareVendors((prev) =>
      prev.includes(vendorId)
        ? prev.filter((id) => id !== vendorId)
        : [...prev, vendorId].slice(0, 4) // Max 4 vendors
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Vendor Management</h2>
          <p className="text-muted-foreground">Track vendors, contracts, and performance</p>
        </div>
        <VendorCreateDialog businessId={businessId} />
      </div>

      {/* Summary Cards */}
      <VendorSummaryCards
        totalVendors={vendors?.length || 0}
        upcomingRenewals={upcomingRenewals?.length || 0}
        averagePerformance={performance?.averageScore || 0}
        highRiskCount={riskAssessment?.highRisk || 0}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="spend">Spend Analysis</TabsTrigger>
          <TabsTrigger value="risk">Risk</TabsTrigger>
          <TabsTrigger value="compare">
            Compare
            {compareVendors.length > 0 && (
              <Badge variant="secondary" className="ml-2">{compareVendors.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <VendorOverviewCharts
            riskData={riskChartData}
            performanceTrend={performance?.trend || []}
          />

          {/* Performance Trends */}
          {performanceTrends && performanceTrends.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Vendor Performance Trends</CardTitle>
                <CardDescription>Last 6 months performance tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceTrends[0]?.dataPoints || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(ts) => new Date(ts).toLocaleDateString()}
                    />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      labelFormatter={(ts) => new Date(ts).toLocaleDateString()}
                    />
                    <Legend />
                    {performanceTrends.slice(0, 5).map((trend, idx) => (
                      <Line
                        key={trend.vendorId}
                        type="monotone"
                        dataKey="score"
                        data={trend.dataPoints}
                        name={trend.vendorName}
                        stroke={`hsl(${idx * 60}, 70%, 50%)`}
                        strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="vendors" className="space-y-4">
          <div className="grid gap-4">
            {vendors && vendors.length > 0 ? (
              vendors.map((vendor: any) => (
                <Card key={vendor._id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Checkbox
                          checked={compareVendors.includes(vendor._id)}
                          onCheckedChange={() => toggleVendorComparison(vendor._id)}
                        />
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{vendor.name}</h3>
                            <Badge variant={getRiskBadgeVariant(vendor.riskLevel)}>{vendor.riskLevel} risk</Badge>
                            <Badge variant="outline">{vendor.category}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Contact: {vendor.contactName} ({vendor.contactEmail})
                          </p>
                          <p className="text-sm">
                            Contract: {new Date(vendor.contractStart).toLocaleDateString()} - {new Date(vendor.contractEnd).toLocaleDateString()}
                          </p>
                          <p className="text-sm font-medium">Value: ${vendor.contractValue.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                          <div className="text-2xl font-bold">{vendor.performanceScore}%</div>
                          <div className="text-xs text-muted-foreground">Performance</div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedVendor(vendor._id);
                            setPerformanceDialogOpen(true);
                          }}
                        >
                          Record Performance
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No vendors found. Add your first vendor to get started.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Average scores across all vendors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">On-Time Delivery</span>
                    <span className="text-sm font-medium">{performance?.onTimeDelivery || 0}%</span>
                  </div>
                  <Progress value={performance?.onTimeDelivery || 0} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Quality Score</span>
                    <span className="text-sm font-medium">{performance?.qualityScore || 0}%</span>
                  </div>
                  <Progress value={performance?.qualityScore || 0} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Responsiveness</span>
                    <span className="text-sm font-medium">{performance?.responsiveness || 0}%</span>
                  </div>
                  <Progress value={performance?.responsiveness || 0} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Cost Efficiency</span>
                    <span className="text-sm font-medium">{performance?.costEfficiency || 0}%</span>
                  </div>
                  <Progress value={performance?.costEfficiency || 0} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contract Timeline</CardTitle>
              <CardDescription>Active contracts and renewal status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contractTimeline?.map((contract: any) => (
                  <div key={contract.vendorId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{contract.vendorName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(contract.contractStart).toLocaleDateString()} - {new Date(contract.contractEnd).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={contract.status === "expiring" ? "destructive" : contract.status === "warning" ? "default" : "secondary"}>
                        {contract.remainingDays} days left
                      </Badge>
                    </div>
                    <Progress value={contract.progress} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spend" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment Summary</CardTitle>
              <CardDescription>Vendor risk breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg bg-red-50">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="font-medium">High Risk Vendors</span>
                  </div>
                  <span className="text-2xl font-bold text-red-600">{riskAssessment?.highRisk || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg bg-orange-50">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <span className="font-medium">Medium Risk Vendors</span>
                  </div>
                  <span className="text-2xl font-bold text-orange-600">{riskAssessment?.mediumRisk || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Low Risk Vendors</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">{riskAssessment?.lowRisk || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compare" className="space-y-4">
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
        </TabsContent>
      </Tabs>

      {/* Performance Recording Dialog */}
      <VendorPerformanceDialog
        open={performanceDialogOpen}
        onOpenChange={setPerformanceDialogOpen}
        vendorId={selectedVendor}
      />
    </div>
  );
}