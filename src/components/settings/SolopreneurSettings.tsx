import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { User, Mail, FileText, Palette, Bell } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SolopreneurSettings({ business }: { business: any }) {
  const [personalBrand, setPersonalBrand] = useState({
    businessName: business?.name || "",
    tagline: "",
    website: business?.website || "",
    logo: "",
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    taskReminders: true,
    socialPostApprovals: false,
  });

  const handleSavePersonalBrand = () => {
    toast.success("Personal brand settings saved");
  };

  const handleSaveNotifications = () => {
    toast.success("Notification preferences saved");
  };

  return (
    <div className="space-y-6">
      {/* Personal Branding */}
      <Card className="neu-raised border-0">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="neu-inset rounded-xl p-3 bg-primary/10">
              <Palette className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Personal Branding</CardTitle>
              <CardDescription>Customize your business identity</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={personalBrand.businessName}
                onChange={(e) => setPersonalBrand({ ...personalBrand, businessName: e.target.value })}
                className="neu-inset"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                placeholder="Your business tagline"
                value={personalBrand.tagline}
                onChange={(e) => setPersonalBrand({ ...personalBrand, tagline: e.target.value })}
                className="neu-inset"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={personalBrand.website}
                onChange={(e) => setPersonalBrand({ ...personalBrand, website: e.target.value })}
                className="neu-inset"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo">Logo URL</Label>
              <Input
                id="logo"
                type="url"
                placeholder="https://example.com/logo.png"
                value={personalBrand.logo}
                onChange={(e) => setPersonalBrand({ ...personalBrand, logo: e.target.value })}
                className="neu-inset"
              />
            </div>
          </div>
          <Button onClick={handleSavePersonalBrand} className="neu-raised">
            Save Branding
          </Button>
        </CardContent>
      </Card>

      {/* Invoice Settings */}
      <Card className="neu-raised border-0">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="neu-inset rounded-xl p-3 bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Invoice Settings</CardTitle>
              <CardDescription>Configure your invoice defaults</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
              <Input id="invoicePrefix" placeholder="INV-" className="neu-inset" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
              <Input id="taxRate" type="number" placeholder="0" className="neu-inset" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Payment Terms (days)</Label>
              <Input id="paymentTerms" type="number" placeholder="30" className="neu-inset" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" placeholder="USD" className="neu-inset" />
            </div>
          </div>
          <Button className="neu-raised">Save Invoice Settings</Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="neu-raised border-0">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="neu-inset rounded-xl p-3 bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage your notification preferences</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Alerts</p>
              <p className="text-sm text-muted-foreground">Receive email notifications for important events</p>
            </div>
            <Switch
              checked={notifications.emailAlerts}
              onCheckedChange={(checked) => setNotifications({ ...notifications, emailAlerts: checked })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Task Reminders</p>
              <p className="text-sm text-muted-foreground">Get reminders for upcoming tasks</p>
            </div>
            <Switch
              checked={notifications.taskReminders}
              onCheckedChange={(checked) => setNotifications({ ...notifications, taskReminders: checked })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Social Post Approvals</p>
              <p className="text-sm text-muted-foreground">Notify when posts need approval</p>
            </div>
            <Switch
              checked={notifications.socialPostApprovals}
              onCheckedChange={(checked) => setNotifications({ ...notifications, socialPostApprovals: checked })}
            />
          </div>
          <Button onClick={handleSaveNotifications} className="neu-raised mt-4">
            Save Notification Preferences
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
