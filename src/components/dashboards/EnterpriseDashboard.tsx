import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface EnterpriseDashboardProps {
  business: any;
  demoData: any;
  isGuest: boolean;
  tier: string;
  onUpgrade: () => void;
}

export function EnterpriseDashboard({ 
  business, 
  demoData, 
  isGuest, 
  tier, 
  onUpgrade 
}: EnterpriseDashboardProps) {
  const [region, setRegion] = useState<string>("global");
  const [unit, setUnit] = useState<string>("all");

  // Live KPIs when authenticated
  const kpiDoc = !isGuest && business?._id
    ? useQuery(api.kpis.getSnapshot, { businessId: business._id })
    : undefined;

  const agents = isGuest ? demoData?.agents || [] : [];
  const workflows = isGuest ? demoData?.workflows || [] : [];
  const kpis = isGuest ? (demoData?.kpis || {}) : (kpiDoc || {});
  const tasks = isGuest ? demoData?.tasks || [] : [];

  return (
    <div className="space-y-6">
      {/* Global Overview Banner */}
      <section className="rounded-lg border p-4 bg-gradient-to-r from-emerald-50 to-blue-50">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold mb-1">Global Overview</h2>
            <p className="text-sm text-muted-foreground">
              Multi-region performance and critical system health at a glance
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Global</SelectItem>
                <SelectItem value="na">North America</SelectItem>
                <SelectItem value="eu">Europe</SelectItem>
                <SelectItem value="apac">APAC</SelectItem>
              </SelectContent>
            </Select>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Business Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Units</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Revenue</h3>
              <p className="text-2xl font-bold">${kpis.totalRevenue?.toLocaleString?.() ?? 0}</p>
              <p className="text-xs text-green-600">+12% YoY</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Global Efficiency</h3>
              <p className="text-2xl font-bold">{kpis.globalEfficiency ?? 0}%</p>
              <p className="text-xs text-green-600">+3% from last quarter</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Compliance Score</h3>
              <p className="text-2xl font-bold">{kpis.complianceScore ?? 0}%</p>
              <p className="text-xs text-blue-600">Stable</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Risk Score</h3>
              <p className="text-2xl font-bold text-green-600">{kpis.riskScore ?? 0}</p>
              <p className="text-xs text-green-600">Low risk profile</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Command Widgets */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Command Widgets</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <h3 className="font-medium mb-2">Global Operations</h3>
              <Button className="w-full">Manage</Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <h3 className="font-medium mb-2">Crisis Management</h3>
              <Button variant="outline" className="w-full">Standby</Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <h3 className="font-medium mb-2">Innovation Hub</h3>
              <Button className="w-full">Explore</Button>
            </CardContent>
          </Card>
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="p-4 text-center">
              <h3 className="font-medium mb-2">Custom Widget</h3>
              <p className="text-xs text-muted-foreground mb-2">Drag & drop available</p>
              <Button variant="outline" size="sm">Customize</Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Strategic Initiatives */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Strategic Initiatives</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {workflows.slice(0, 6).map((workflow: any) => (
            <Card key={workflow.id}>
              <CardContent className="p-4">
                <h3 className="font-medium">{workflow.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Status: {workflow.status}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-emerald-600 h-2 rounded-full" 
                    style={{ width: `${workflow.completionRate}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {workflow.completionRate}% complete
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Telemetry Summary */}
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
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Enterprise Controls */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Enterprise Controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">User Management</h3>
              <p className="text-sm text-muted-foreground mb-3">Manage roles and access</p>
              <Button variant="outline" className="w-full">Open</Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">Security & Audit</h3>
              <p className="text-sm text-muted-foreground mb-3">Configure policies & review logs</p>
              <Button variant="outline" className="w-full">Review</Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">Integrations</h3>
              <p className="text-sm text-muted-foreground mb-3">Manage connected systems</p>
              <Button variant="outline" className="w-full">Manage</Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}