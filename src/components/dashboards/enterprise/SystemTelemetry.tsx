import { Card, CardContent } from "@/components/ui/card";

interface SystemTelemetryProps {
  agents: Array<any>;
  demoData: any;
}

export function SystemTelemetry({ agents, demoData }: SystemTelemetryProps) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">System Telemetry</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">Active AI Agents</h3>
            <div className="space-y-2">
              {agents.slice(0, 4).map((agent: any) => (
                <div key={agent.id} className="flex items-center justify-between">
                  <span className="text-sm">{agent.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{agent.efficiency}%</span>
                    <div className={`w-2 h-2 rounded-full ${
                      agent.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">Critical Alerts</h3>
            <div className="space-y-2">
              {(demoData?.notifications || [])
                .filter((n: any) => n.type === 'urgent' || n.type === 'warning')
                .slice(0, 3)
                .map((notification: any) => (
                  <div key={notification.id} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      notification.type === 'urgent' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <span className="text-sm">{notification.message}</span>
                  </div>
                ))
              }
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
