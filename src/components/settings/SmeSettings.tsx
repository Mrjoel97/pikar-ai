import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield, Building, AlertTriangle, FileCheck } from "lucide-react";
import { toast } from "sonner";

export default function SmeSettings({ business }: { business: any }) {
  return (
    <div className="space-y-6">
      {/* Department Configuration */}
      <Card className="neu-raised border-0">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="neu-inset rounded-xl p-3 bg-primary/10">
              <Building className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Department Configuration</CardTitle>
              <CardDescription>Manage department-level settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="departments">Active Departments</Label>
            <Input id="departments" placeholder="Sales, Marketing, Finance, Operations" className="neu-inset" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budgetCycle">Budget Cycle</Label>
            <Input id="budgetCycle" placeholder="Quarterly" className="neu-inset" />
          </div>
          <Button className="neu-raised">Save Department Settings</Button>
        </CardContent>
      </Card>

      {/* Compliance Settings */}
      <Card className="neu-raised border-0">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="neu-inset rounded-xl p-3 bg-primary/10">
              <FileCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Compliance Settings</CardTitle>
              <CardDescription>Configure compliance and audit requirements</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="complianceFramework">Compliance Framework</Label>
            <Input id="complianceFramework" placeholder="ISO 27001, SOC 2" className="neu-inset" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="auditFrequency">Audit Frequency</Label>
            <Input id="auditFrequency" placeholder="Quarterly" className="neu-inset" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dataRetention">Data Retention Period (days)</Label>
            <Input id="dataRetention" type="number" placeholder="2555" className="neu-inset" />
          </div>
          <Button className="neu-raised">Save Compliance Settings</Button>
        </CardContent>
      </Card>

      {/* Governance Rules */}
      <Card className="neu-raised border-0">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="neu-inset rounded-xl p-3 bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Governance Rules</CardTitle>
              <CardDescription>Define approval workflows and policies</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="approvalLevels">Approval Levels</Label>
            <Input id="approvalLevels" type="number" placeholder="3" className="neu-inset" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="escalationTime">Escalation Time (hours)</Label>
            <Input id="escalationTime" type="number" placeholder="24" className="neu-inset" />
          </div>
          <Button className="neu-raised">Save Governance Rules</Button>
        </CardContent>
      </Card>

      {/* Risk Management */}
      <Card className="neu-raised border-0">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="neu-inset rounded-xl p-3 bg-primary/10">
              <AlertTriangle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Risk Management</CardTitle>
              <CardDescription>Configure risk thresholds and alerts</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="riskThreshold">Risk Score Threshold</Label>
            <Input id="riskThreshold" type="number" placeholder="75" className="neu-inset" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="alertRecipients">Alert Recipients</Label>
            <Input id="alertRecipients" placeholder="risk@company.com" className="neu-inset" />
          </div>
          <Button className="neu-raised">Save Risk Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}
