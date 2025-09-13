import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface SmeDashboardProps {
  business: any;
  demoData: any;
  isGuest: boolean;
  tier: string;
  onUpgrade: () => void;
}

export function SmeDashboard({ 
  business, 
  demoData, 
  isGuest, 
  tier, 
  onUpgrade 
}: SmeDashboardProps) {
  // Fetch latest KPI snapshot when authenticated
  const kpiDoc = !isGuest && business?._id
    ? useQuery(api.kpis.getSnapshot, { businessId: business._id })
    : undefined;

  const agents = isGuest ? demoData?.agents || [] : [];
  const workflows = isGuest ? demoData?.workflows || [] : [];
  const kpis = isGuest ? (demoData?.kpis || {}) : (kpiDoc || {});
  const tasks = isGuest ? demoData?.tasks || [] : [];

  const UpgradeCTA = ({ feature }: { feature: string }) => (
    <Card className="border-dashed border-2 border-gray-300">
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <h3 className="font-semibold mb-2">Contact Sales</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Upgrade to Enterprise for {feature}
        </p>
        <Button onClick={onUpgrade} size="sm">
          Contact Sales
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Governance Panel */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Governance Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Compliance Score</h3>
              <p className="text-2xl font-bold text-green-600">{kpis.complianceScore}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Risk Score</h3>
              <p className="text-2xl font-bold text-yellow-600">{kpis.riskScore}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Department Efficiency</h3>
              <p className="text-2xl font-bold">{kpis.departmentEfficiency}%</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pending Approvals by Department */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Pending Approvals by Department</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map((task: any) => (
            <Card key={task.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{task.title}</h3>
                  <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'}>
                    {task.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">Due: {task.dueDate}</p>
                <Button size="sm" className="w-full">
                  Review & Approve
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Department Views (Tabbed Center Section) */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Department Views</h2>
        <Tabs defaultValue="marketing" className="w-full">
          <TabsList className="grid grid-cols-4 max-w-full">
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
            <TabsTrigger value="finance">Finance</TabsTrigger>
          </TabsList>

          <TabsContent value="marketing" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Campaign Performance</h3>
                  <p className="text-2xl font-bold">94%</p>
                  <p className="text-xs text-green-600">+2% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Brand Consistency</h3>
                  <p className="text-2xl font-bold">91%</p>
                  <p className="text-xs text-green-600">+1% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Content Calendar</h3>
                  <p className="text-sm text-muted-foreground">Upcoming: 7 scheduled posts</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sales" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Pipeline Health</h3>
                  <p className="text-2xl font-bold">$240k</p>
                  <p className="text-xs text-green-600">+5% QoQ</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Conversion Rate</h3>
                  <p className="text-2xl font-bold">12.4%</p>
                  <p className="text-xs text-green-600">+0.6% WoW</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Territory Performance</h3>
                  <p className="text-sm text-muted-foreground">Top: West Coast</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="operations" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Process Efficiency</h3>
                  <p className="text-2xl font-bold">88%</p>
                  <p className="text-xs text-yellow-600">-1% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Automation Status</h3>
                  <p className="text-sm text-muted-foreground">Active automations: 14</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Resource Utilization</h3>
                  <p className="text-2xl font-bold">72%</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="finance" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Budget vs. Actual</h3>
                  <p className="text-sm text-muted-foreground">Within 3% of plan</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">ROI by Initiative</h3>
                  <p className="text-2xl font-bold">1.8x</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Cost Center Analysis</h3>
                  <p className="text-sm text-muted-foreground">Top variance: Ops</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Department Performance */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Department Performance</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Marketing</h3>
              <p className="text-2xl font-bold">94%</p>
              <p className="text-xs text-green-600">+2% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Sales</h3>
              <p className="text-2xl font-bold">91%</p>
              <p className="text-xs text-green-600">+5% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Operations</h3>
              <p className="text-2xl font-bold">88%</p>
              <p className="text-xs text-yellow-600">-1% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Finance</h3>
              <p className="text-2xl font-bold">96%</p>
              <p className="text-xs text-green-600">+3% from last month</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Compliance Summary */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Compliance & Risk</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Recent Compliance Activities</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm">Quarterly audit completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                  <span className="text-sm">New regulation review pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-sm">Policy update scheduled</span>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Hide upgrade prompt for guests */}
          {!isGuest && <UpgradeCTA feature="Global Command Center" />}
        </div>
      </section>
    </div>
  );
}