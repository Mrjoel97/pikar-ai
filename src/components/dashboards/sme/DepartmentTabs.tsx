import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MarketingDashboard } from "@/components/departments/MarketingDashboard";
import { SalesDashboard } from "@/components/departments/SalesDashboard";
import { OpsDashboard } from "@/components/departments/OpsDashboard";
import { FinanceDashboard } from "@/components/departments/FinanceDashboard";
import { BudgetDashboard } from "@/components/departments/BudgetDashboard";
import { VendorManagement } from "@/components/vendors/VendorManagement";
import { ComplianceReportGenerator } from "@/components/compliance/ComplianceReportGenerator";
import { ReportLibrary } from "@/components/compliance/ReportLibrary";
import { Id } from "@/convex/_generated/dataModel";
import * as React from "react";

interface DepartmentTabsProps {
  businessId: Id<"businesses"> | undefined;
  isGuest: boolean;
  kpiDoc: any;
}

export function DepartmentTabs({ businessId, isGuest, kpiDoc }: DepartmentTabsProps) {
  const [activeTab, setActiveTab] = React.useState("overview");

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Departments</h2>
        <Button asChild size="sm" variant="outline">
          <a href="/analytics">Open Analytics</a>
        </Button>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Marketing</CardTitle>
                <CardDescription>Marketing performance and leads</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Leads</div>
                    <div className="text-2xl font-bold">{isGuest ? 312 : ((kpiDoc as any)?.marketingLeads ?? "—")}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">CTR</div>
                    <div className="text-2xl font-bold">{isGuest ? "3.2%" : (((kpiDoc as any)?.ctr ?? 0) + "%")}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Subs</div>
                    <div className="text-2xl font-bold">{isGuest ? 124 : ((kpiDoc as any)?.subscribers ?? "—")}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Revenue</div>
                    <div className="text-2xl font-bold">${(kpiDoc as any)?.revenue?.toLocaleString?.() ?? (isGuest ? "120,400" : "—")}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sales</CardTitle>
                <CardDescription>Sales pipeline and performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Pipeline</div>
                    <div className="text-2xl font-bold">${isGuest ? "540k" : ((kpiDoc as any)?.pipeline ?? "—")}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Win Rate</div>
                    <div className="text-2xl font-bold">{isGuest ? "27%" : (((kpiDoc as any)?.winRate ?? 0) + "%")}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Cycle</div>
                    <div className="text-2xl font-bold">{isGuest ? "18d" : (((kpiDoc as any)?.cycleDays ?? 0) + "d")}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Revenue</div>
                    <div className="text-2xl font-bold">${(kpiDoc as any)?.revenue?.toLocaleString?.() ?? (isGuest ? "120,400" : "—")}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="marketing" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Leads</div><div className="text-2xl font-bold">{isGuest ? 312 : ((kpiDoc as any)?.marketingLeads ?? "—")}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">CTR</div><div className="text-2xl font-bold">{isGuest ? "3.2%" : (((kpiDoc as any)?.ctr ?? 0) + "%")}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Subs</div><div className="text-2xl font-bold">{isGuest ? 124 : ((kpiDoc as any)?.subscribers ?? "—")}</div></CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Pipeline</div><div className="text-2xl font-bold">${isGuest ? "540k" : ((kpiDoc as any)?.pipeline ?? "—")}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Win Rate</div><div className="text-2xl font-bold">{isGuest ? "27%" : (((kpiDoc as any)?.winRate ?? 0) + "%")}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Cycle</div><div className="text-2xl font-bold">{isGuest ? "18d" : (((kpiDoc as any)?.cycleDays ?? 0) + "d")}</div></CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">On-time</div><div className="text-2xl font-bold">{isGuest ? "96%" : (((kpiDoc as any)?.onTime ?? 0) + "%")}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Tickets</div><div className="text-2xl font-bold">{isGuest ? 42 : ((kpiDoc as any)?.tickets ?? "—")}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">MTTR</div><div className="text-2xl font-bold">{isGuest ? "2.4h" : (((kpiDoc as any)?.mttrHrs ?? 0) + "h")}</div></CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="finance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">MRR</div><div className="text-2xl font-bold">${isGuest ? "80,200" : ((kpiDoc as any)?.mrr ?? "—")}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Gross Margin</div><div className="text-2xl font-bold">{isGuest ? "72%" : (((kpiDoc as any)?.gm ?? 0) + "%")}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Runway</div><div className="text-2xl font-bold">{isGuest ? "14m" : (((kpiDoc as any)?.runwayMonths ?? 0) + "m")}</div></CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {businessId && <ComplianceReportGenerator businessId={businessId} />}
            {businessId && <ReportLibrary businessId={businessId} />}
          </div>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-4">
          <VendorManagement businessId={businessId} isGuest={isGuest} />
        </TabsContent>
      </Tabs>

      {/* Detailed Department Dashboards */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Department Dashboards</CardTitle>
          <CardDescription>Deep dive into each department's metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="marketing">Marketing</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="ops">Ops</TabsTrigger>
              <TabsTrigger value="finance">Finance</TabsTrigger>
              <TabsTrigger value="budget">Budget</TabsTrigger>
              <TabsTrigger value="vendors">Vendors</TabsTrigger>
            </TabsList>
            
            <TabsContent value="marketing" className="mt-6">
              <MarketingDashboard businessId={businessId} isGuest={isGuest} />
            </TabsContent>
            
            <TabsContent value="sales" className="mt-6">
              <SalesDashboard businessId={businessId} isGuest={isGuest} />
            </TabsContent>
            
            <TabsContent value="ops" className="mt-6">
              <OpsDashboard businessId={businessId} isGuest={isGuest} />
            </TabsContent>
            
            <TabsContent value="finance" className="mt-6">
              <FinanceDashboard businessId={businessId} isGuest={isGuest} />
            </TabsContent>

            <TabsContent value="budget" className="mt-6">
              <BudgetDashboard businessId={businessId} isGuest={isGuest} />
            </TabsContent>

            <TabsContent value="vendors" className="mt-6">
              <VendorManagement businessId={businessId} isGuest={isGuest} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </section>
  );
}