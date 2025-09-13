import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface StartupDashboardProps {
  business: any;
  demoData: any;
  isGuest: boolean;
  tier: string;
  onUpgrade: () => void;
}

export function StartupDashboard({ 
  business, 
  demoData, 
  isGuest, 
  tier, 
  onUpgrade 
}: StartupDashboardProps) {
  const agents = isGuest ? demoData?.agents || [] : [];
  const workflows = isGuest ? demoData?.workflows || [] : [];
  const kpis = isGuest ? demoData?.kpis || {} : {};
  const tasks = isGuest ? demoData?.tasks || [] : [];

  const UpgradeCTA = ({ feature }: { feature: string }) => (
    <Card className="border-dashed border-2 border-gray-300">
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <h3 className="font-semibold mb-2">Upgrade to SME</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Get {feature} with governance features
        </p>
        <Button onClick={onUpgrade} size="sm">
          Upgrade to SME
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Team Performance */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Team Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Active Agents</h3>
              <p className="text-2xl font-bold">{agents.filter((a: any) => a.status === 'active').length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Team Productivity</h3>
              <p className="text-2xl font-bold">{kpis.teamProductivity}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Customer Satisfaction</h3>
              <p className="text-2xl font-bold">{kpis.customerSatisfaction}/5</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Growth Metrics */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Growth Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Revenue</h3>
              <p className="text-2xl font-bold">${kpis.totalRevenue?.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Customers</h3>
              <p className="text-2xl font-bold">{kpis.activeCustomers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Conversion</h3>
              <p className="text-2xl font-bold">{kpis.conversionRate}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Task Completion</h3>
              <p className="text-2xl font-bold">{kpis.taskCompletion}%</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Active Initiatives */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Active Initiatives</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workflows.slice(0, 4).map((workflow: any) => (
            <Card key={workflow.id}>
              <CardContent className="p-4">
                <h3 className="font-medium">{workflow.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Status: {workflow.status}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-emerald-600 h-2 rounded-full" 
                    style={{ width: `${workflow.completionRate}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {workflow.completionRate}% complete
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Approvals Tray */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Pending Approvals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.filter((t: any) => t.priority === 'high').map((task: any) => (
            <Card key={task.id}>
              <CardContent className="p-4">
                <h3 className="font-medium">{task.title}</h3>
                <p className="text-sm text-muted-foreground">Due: {task.dueDate}</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm">Approve</Button>
                  <Button variant="outline" size="sm">Review</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {/* Hide upgrade prompt for guests */}
          {!isGuest && <UpgradeCTA feature="Advanced Governance" />}
        </div>
      </section>
    </div>
  );
}