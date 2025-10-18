import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Globe, Key, Lock, Palette, Database, Webhook } from "lucide-react";
import { useNavigate } from "react-router";

export default function EnterpriseSettings({ business }: { business: any }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* SSO Configuration */}
      <Card className="neu-raised border-0">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="neu-inset rounded-xl p-3 bg-primary/10">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Single Sign-On (SSO)</CardTitle>
              <CardDescription>Configure SAML 2.0 and OAuth providers</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate("/sso-configuration")} className="neu-raised">
            Configure SSO
          </Button>
        </CardContent>
      </Card>

      {/* SCIM Provisioning */}
      <Card className="neu-raised border-0">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="neu-inset rounded-xl p-3 bg-primary/10">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>SCIM Provisioning</CardTitle>
              <CardDescription>Automate user provisioning and deprovisioning</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate("/scim-provisioning")} className="neu-raised">
            Configure SCIM
          </Button>
        </CardContent>
      </Card>

      {/* KMS Encryption */}
      <Card className="neu-raised border-0">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="neu-inset rounded-xl p-3 bg-primary/10">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Key Management Service (KMS)</CardTitle>
              <CardDescription>Manage encryption keys and data security</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate("/kms-configuration")} className="neu-raised">
            Configure KMS
          </Button>
        </CardContent>
      </Card>

      {/* White-Label Branding */}
      <Card className="neu-raised border-0">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="neu-inset rounded-xl p-3 bg-primary/10">
              <Palette className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>White-Label Branding</CardTitle>
              <CardDescription>Customize the platform with your brand</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate("/branding-portal")} className="neu-raised">
            Manage Branding
          </Button>
        </CardContent>
      </Card>

      {/* API & Webhooks */}
      <Card className="neu-raised border-0">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="neu-inset rounded-xl p-3 bg-primary/10">
              <Webhook className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>API & Webhooks</CardTitle>
              <CardDescription>Manage API keys and webhook endpoints</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => navigate("/api-builder")} className="neu-raised mr-2">
            API Builder
          </Button>
          <Button onClick={() => navigate("/webhook-management")} variant="outline" className="neu-flat">
            Webhooks
          </Button>
        </CardContent>
      </Card>

      {/* Data Warehouse */}
      <Card className="neu-raised border-0">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="neu-inset rounded-xl p-3 bg-primary/10">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Data Warehouse</CardTitle>
              <CardDescription>Configure data export and analytics</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="warehouseUrl">Warehouse Connection URL</Label>
            <Input id="warehouseUrl" placeholder="postgresql://..." className="neu-inset" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="syncFrequency">Sync Frequency</Label>
            <Input id="syncFrequency" placeholder="Hourly" className="neu-inset" />
          </div>
          <Button className="neu-raised">Save Data Warehouse Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}
