import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useState } from "react";
import { VendorSummaryCards } from "./VendorSummaryCards";
import { VendorCreateDialog } from "./VendorCreateDialog";
import { VendorPerformanceDialog } from "./VendorPerformanceDialog";
import { VendorOverviewTab } from "./tabs/VendorOverviewTab";
import { VendorListTab } from "./tabs/VendorListTab";
import { VendorPerformanceTab } from "./tabs/VendorPerformanceTab";
import { VendorContractsTab } from "./tabs/VendorContractsTab";
import { VendorSpendTab } from "./tabs/VendorSpendTab";
import { VendorRiskTab } from "./tabs/VendorRiskTab";
import { VendorCompareTab } from "./tabs/VendorCompareTab";

interface VendorManagementProps {
  businessId?: Id<"businesses">;
  isGuest?: boolean;
}

export default function VendorManagement({ businessId, isGuest }: VendorManagementProps) {
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

        <TabsContent value="overview">
          <VendorOverviewTab
            riskData={riskChartData}
            performanceTrend={performance?.trend || []}
            performanceTrends={performanceTrends}
          />
        </TabsContent>

        <TabsContent value="vendors">
          <VendorListTab
            vendors={vendors}
            compareVendors={compareVendors}
            toggleVendorComparison={toggleVendorComparison}
            getRiskBadgeVariant={getRiskBadgeVariant}
            setSelectedVendor={setSelectedVendor}
            setPerformanceDialogOpen={setPerformanceDialogOpen}
          />
        </TabsContent>

        <TabsContent value="performance">
          <VendorPerformanceTab performance={performance} />
        </TabsContent>

        <TabsContent value="contracts">
          <VendorContractsTab contractTimeline={contractTimeline} />
        </TabsContent>

        <TabsContent value="spend">
          <VendorSpendTab spendAnalytics={spendAnalytics} />
        </TabsContent>

        <TabsContent value="risk">
          <VendorRiskTab riskAssessment={riskAssessment} />
        </TabsContent>

        <TabsContent value="compare">
          <VendorCompareTab
            compareVendors={compareVendors}
            vendorComparison={vendorComparison}
            getRiskBadgeVariant={getRiskBadgeVariant}
          />
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