import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";
import { useState } from "react";
import { VendorSummaryCards } from "./VendorSummaryCards";
import { VendorCreateDialog } from "./VendorCreateDialog";
import { VendorPerformanceDialog } from "./VendorPerformanceDialog";
import { VendorOverviewCharts } from "./VendorOverviewCharts";

interface VendorManagementProps {
  businessId?: Id<"businesses">;
  isGuest?: boolean;
}

export function VendorManagement({ businessId, isGuest }: VendorManagementProps) {
  const [performanceDialogOpen, setPerformanceDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Id<"vendors"> | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

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

  const getRiskBadgeVariant = (level: string): "destructive" | "default" | "secondary" => {
    switch (level) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "default";
    }
  };

  const riskChartData = riskAssessment ? [
    { name: "High Risk", value: riskAssessment.highRisk, color: "#ef4444" },
    { name: "Medium Risk", value: riskAssessment.mediumRisk, color: "#f59e0b" },
    { name: "Low Risk", value: riskAssessment.lowRisk, color: "#10b981" },
  ] : [];

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
          <TabsTrigger value="renewals">Renewals</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="risk">Risk</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <VendorOverviewCharts
            riskData={riskChartData}
            performanceTrend={performance?.trend || []}
          />
        </TabsContent>

        <TabsContent value="vendors" className="space-y-4">
          <div className="grid gap-4">
            {vendors && vendors.length > 0 ? (
              vendors.map((vendor: any) => (
                <Card key={vendor._id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
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

        <TabsContent value="renewals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Contract Renewals</CardTitle>
              <CardDescription>Contracts expiring in the next 90 days</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingRenewals && upcomingRenewals.length > 0 ? (
                <div className="space-y-3">
                  {upcomingRenewals.map((vendor: any) => (
                    <div key={vendor._id} className="flex items-center justify-between border rounded-lg p-3">
                      <div>
                        <h4 className="font-medium">{vendor.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Expires: {new Date(vendor.contractEnd).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={(vendor as any).daysUntilRenewal <= 30 ? "destructive" : "default"}>
                          {(vendor as any).daysUntilRenewal} days
                        </Badge>
                        <p className="text-sm font-medium mt-1">${vendor.contractValue.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No upcoming renewals</p>
              )}
            </CardContent>
          </Card>
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
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${performance?.onTimeDelivery || 0}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Quality Score</span>
                    <span className="text-sm font-medium">{performance?.qualityScore || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${performance?.qualityScore || 0}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Responsiveness</span>
                    <span className="text-sm font-medium">{performance?.responsiveness || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${performance?.responsiveness || 0}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Cost Efficiency</span>
                    <span className="text-sm font-medium">{performance?.costEfficiency || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-600 h-2 rounded-full" style={{ width: `${performance?.costEfficiency || 0}%` }} />
                  </div>
                </div>
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