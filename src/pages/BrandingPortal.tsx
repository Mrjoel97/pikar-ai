import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, Palette, Globe, Eye } from "lucide-react";
import { useNavigate } from "react-router";

export default function BrandingPortal() {
  const navigate = useNavigate();
  const business = useQuery(api.businesses.currentUserBusiness);
  const brandingConfig = useQuery(
    api.branding.getBrandingConfig,
    business?._id ? { businessId: business._id } : "skip"
  );
  const updateBranding = useMutation(api.branding.updateBrandingConfig);
  const verifyDomain = useMutation(api.branding.verifyCustomDomain);

  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#10b981");
  const [secondaryColor, setSecondaryColor] = useState("#059669");
  const [customDomain, setCustomDomain] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Load existing config
  useState(() => {
    if (brandingConfig) {
      setLogoUrl(brandingConfig.logoUrl || "");
      setPrimaryColor(brandingConfig.primaryColor || "#10b981");
      setSecondaryColor(brandingConfig.secondaryColor || "#059669");
      setCustomDomain(brandingConfig.customDomain || "");
    }
  });

  const handleSave = async () => {
    if (!business?._id) {
      toast.error("Business not found");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateBranding({
        businessId: business._id,
        logoUrl: logoUrl || undefined,
        primaryColor: primaryColor || undefined,
        secondaryColor: secondaryColor || undefined,
        customDomain: customDomain || undefined,
      });
      toast.success("Branding updated successfully");
    } catch (error) {
      console.error("Failed to update branding:", error);
      toast.error("Failed to update branding");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyDomain = async () => {
    if (!business?._id || !customDomain) {
      toast.error("Please enter a custom domain first");
      return;
    }

    setIsVerifying(true);
    try {
      const result = await verifyDomain({
        businessId: business._id,
        customDomain: customDomain,
      });
      toast.info(result.message);
    } catch (error) {
      console.error("Failed to verify domain:", error);
      toast.error("Failed to verify domain");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Branding Portal</h1>
            <p className="text-muted-foreground">Customize your white-label experience</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Logo Upload
                </CardTitle>
                <CardDescription>Upload your company logo (URL)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    placeholder="https://example.com/logo.png"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Brand Colors
                </CardTitle>
                <CardDescription>Set your primary and secondary colors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#10b981"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      placeholder="#059669"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Custom Domain
                </CardTitle>
                <CardDescription>Configure your custom domain</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="customDomain">Domain</Label>
                  <Input
                    id="customDomain"
                    placeholder="app.yourcompany.com"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={handleVerifyDomain}
                  disabled={isVerifying || !customDomain}
                  className="w-full"
                >
                  {isVerifying ? "Verifying..." : "Verify Domain"}
                </Button>
              </CardContent>
            </Card>

            <Button
              onClick={handleSave}
              disabled={isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? "Saving..." : "Save Branding"}
            </Button>
          </div>

          {/* Live Preview Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Live Preview
              </CardTitle>
              <CardDescription>See how your branding looks</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="border rounded-lg p-6 space-y-4"
                style={{
                  backgroundColor: primaryColor + "10",
                  borderColor: primaryColor,
                }}
              >
                {logoUrl && (
                  <div className="flex justify-center">
                    <img
                      src={logoUrl}
                      alt="Logo preview"
                      className="h-16 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Button
                    style={{ backgroundColor: primaryColor }}
                    className="w-full"
                  >
                    Primary Button
                  </Button>
                  <Button
                    style={{ backgroundColor: secondaryColor }}
                    className="w-full"
                  >
                    Secondary Button
                  </Button>
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  {customDomain || "No custom domain set"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}