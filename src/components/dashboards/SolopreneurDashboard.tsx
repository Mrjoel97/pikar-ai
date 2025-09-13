import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SolopreneurDashboardProps {
  business: any;
  demoData: any;
  isGuest: boolean;
  tier: string;
  onUpgrade: () => void;
}

export function SolopreneurDashboard({ 
  business, 
  demoData, 
  isGuest, 
  tier, 
  onUpgrade 
}: SolopreneurDashboardProps) {
  // Use demo data when in guest mode
  const agents = isGuest ? demoData?.agents || [] : [];
  const workflows = isGuest ? demoData?.workflows || [] : [];
  const kpis = isGuest ? demoData?.kpis || {} : {};
  const tasks = isGuest ? demoData?.tasks || [] : [];

  const UpgradeCTA = ({ feature }: { feature: string }) => (
    <Card className="border-dashed border-2 border-gray-300">
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <h3 className="font-semibold mb-2">Upgrade for Team Features</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Get advanced {feature} with the Startup plan
        </p>
        <Button onClick={onUpgrade} size="sm">
          Upgrade to Startup
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Today's Focus */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Today's Focus</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tasks.slice(0, 3).map((task: any) => (
            <Card key={task.id}>
              <CardContent className="p-4">
                <h3 className="font-medium">{task.title}</h3>
                <p className="text-sm text-muted-foreground">Due: {task.dueDate}</p>
                <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'}>
                  {task.priority}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Performance Snapshot */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Performance Snapshot</h2>
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
              <h3 className="text-sm font-medium text-muted-foreground">Tasks Done</h3>
              <p className="text-2xl font-bold">{kpis.taskCompletion}%</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">Send Newsletter</h3>
              <Button 
                className="w-full"
              >
                Send Now
              </Button>
            </CardContent>
          </Card>
          {/* Hide upgrade prompts for guests to allow full access */}
          {!isGuest && <UpgradeCTA feature="Team Collaboration" />}
          {!isGuest && <UpgradeCTA feature="Advanced Analytics" />}
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              {(demoData?.notifications || []).slice(0, 5).map((notification: any) => (
                <div key={notification.id} className="flex items-center gap-3 p-2 rounded border">
                  <div className={`w-2 h-2 rounded-full ${
                    notification.type === 'success' ? 'bg-green-500' :
                    notification.type === 'warning' ? 'bg-yellow-500' :
                    notification.type === 'urgent' ? 'bg-red-500' : 'bg-blue-500'
                  }`} />
                  <span className="text-sm">{notification.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}