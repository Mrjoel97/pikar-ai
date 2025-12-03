import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, XCircle } from "lucide-react";

export default function IntegrationStatus() {
  const integrations = [
    { name: "CRM Sync", status: "active", icon: CheckCircle, color: "text-green-600" },
    { name: "Email Service", status: "active", icon: CheckCircle, color: "text-green-600" },
    { name: "Analytics", status: "warning", icon: AlertCircle, color: "text-amber-600" },
    { name: "Data Warehouse", status: "active", icon: CheckCircle, color: "text-green-600" },
  ];

  return (
    <Card className="xl:col-span-1">
      <CardHeader className="pb-2">
        <CardTitle>Integration Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          return (
            <div key={integration.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${integration.color}`} />
                <span className="text-sm">{integration.name}</span>
              </div>
              <Badge variant={integration.status === "active" ? "default" : "secondary"}>
                {integration.status}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}