import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Palette, Upload } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

export function BrandingEditor({ businessId }: { businessId: Id<"businesses"> }) {
  const branding = useQuery(api.whiteLabel.branding.getBranding, { businessId });
  const updateBranding = useMutation(api.whiteLabel.branding.updateBranding);

  const [brandName, setBrandName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [secondaryColor, setSecondaryColor] = useState("#8b5cf6");
  const [accentColor, setAccentColor] = useState("#10b981");

  const handleSave = async () => {
    try {
      await updateBranding({
        businessId,
        brandName: brandName || undefined,
        logoUrl: logoUrl || undefined,
        primaryColor,
        secondaryColor,
        accentColor,
      });
      toast.success("Branding updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update branding");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Brand Customization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="brandName">Brand Name</Label>
          <Input
            id="brandName"
            placeholder="Your Company Name"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="logoUrl">Logo URL</Label>
          <div className="flex gap-2">
            <Input
              id="logoUrl"
              placeholder="https://example.com/logo.png"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />
            <Button variant="outline" size="icon">
              <Upload className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                id="primaryColor"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-20"
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#3b82f6"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondaryColor">Secondary Color</Label>
            <div className="flex gap-2">
              <Input
                id="secondaryColor"
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="h-10 w-20"
              />
              <Input
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                placeholder="#8b5cf6"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accentColor">Accent Color</Label>
            <div className="flex gap-2">
              <Input
                id="accentColor"
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="h-10 w-20"
              />
              <Input
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                placeholder="#10b981"
              />
            </div>
          </div>
        </div>

        <Button onClick={handleSave} className="w-full">
          Save Branding
        </Button>
      </CardContent>
    </Card>
  );
}
