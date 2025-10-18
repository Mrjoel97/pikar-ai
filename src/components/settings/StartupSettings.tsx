import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, Workflow, CreditCard, Plug } from "lucide-react";
import { toast } from "sonner";

export default function StartupSettings({ business }: { business: any }) {
  return (
    <div className="space-y-6">
      {/* Team Management */}
      <Card className="neu-raised border-0">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="neu-inset rounded-xl p-3 bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Team Management</CardTitle>
              <CardDescription>Manage team members and roles</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="teamSize">Team Size</Label>
            <Input id="teamSize" type="number" placeholder="5" className="neu-inset" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultRole">Default Role for New Members</Label>
            <Input id="defaultRole" placeholder="Member" className="neu-inset" />
          </div>
          <Button className="neu-raised">Save Team Settings</Button>
        </CardContent>
      </Card>

      {/* Workflow Preferences */}
      <Card className="neu-raised border-0">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="neu-inset rounded-xl p-3 bg-primary/10">
              <Workflow className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Workflow Preferences</CardTitle>
              <CardDescription>Configure workflow automation settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="approvalThreshold">Approval Threshold</Label>
            <Input id="approvalThreshold" type="number" placeholder="2" className="neu-inset" />
            <p className="text-xs text-muted-foreground">Number of approvals required for workflows</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="autoAssign">Auto-assign Tasks To</Label>
            <Input id="autoAssign" placeholder="Round-robin" className="neu-inset" />
          </div>
          <Button className="neu-raised">Save Workflow Settings</Button>
        </CardContent>
      </Card>

      {/* Billing & Subscription */}
      <Card className="neu-raised border-0">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="neu-inset rounded-xl p-3 bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Billing & Subscription</CardTitle>
              <CardDescription>Manage your subscription and payment methods</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 neu-inset rounded-lg">
            <div>
              <p className="font-medium">Current Plan: Startup</p>
              <p className="text-sm text-muted-foreground">$297/month</p>
            </div>
            <Button variant="outline" className="neu-flat">Manage Billing</Button>
          </div>
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card className="neu-raised border-0">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="neu-inset rounded-xl p-3 bg-primary/10">
              <Plug className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>Connect third-party tools</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button className="neu-raised">View Integration Hub</Button>
        </CardContent>
      </Card>
    </div>
  );
}
