import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router";
import { Palette, Upload, Globe, History, BarChart3 } from "lucide-react";
import { BrandManager } from "@/components/brands/BrandManager";
import { ThemeEditor } from "@/components/brands/ThemeEditor";
import { AssetLibrary } from "@/components/brands/AssetLibrary";
import { DomainManager } from "@/components/brands/DomainManager";

export default function BrandingPortal() {
  const navigate = useNavigate();
  const business = useQuery(api.businesses.currentUserBusiness);
  const themeVersions = useQuery(
    api.branding.getThemeVersions,
    business?._id ? { businessId: business._id } : "skip"
  );
  const analytics = useQuery(
    api.branding.getBrandingAnalytics,
    business?._id ? { businessId: business._id } : "skip"
  );

  const [selectedBrandId, setSelectedBrandId] = useState<string | undefined>();

  if (!business) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Branding Portal</h1>
            <p className="text-muted-foreground">
              Manage themes, assets, and custom domains
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>

        {/* Analytics Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Theme Versions</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{themeVersions?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Theme Changes</CardTitle>
              <Palette className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.themeChanges || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assets Uploaded</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.assetUploads || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Domains Verified</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.domainVerifications || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="brands" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="brands">Brands</TabsTrigger>
            <TabsTrigger value="themes">Theme Editor</TabsTrigger>
            <TabsTrigger value="assets">Asset Library</TabsTrigger>
            <TabsTrigger value="domains">Custom Domains</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="brands" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Brand Management</CardTitle>
                <CardDescription>
                  Create and manage multiple brands for your business
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BrandManager businessId={business._id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="themes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Theme Editor</CardTitle>
                <CardDescription>
                  Create and version your brand themes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ThemeEditor businessId={business._id} brandId={selectedBrandId as any} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Theme Versions</CardTitle>
                <CardDescription>Manage and activate theme versions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {themeVersions?.map((version: any) => (
                    <div
                      key={version._id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{version.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Version {version.version} • {version.description}
                        </p>
                      </div>
                      {version.isActive && (
                        <span className="text-sm text-green-600 font-medium">Active</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Asset Library</CardTitle>
                <CardDescription>
                  Manage logos, images, fonts, and other brand assets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AssetLibrary businessId={business._id} brandId={selectedBrandId as any} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="domains" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Custom Domains</CardTitle>
                <CardDescription>
                  Configure and verify custom domains for your brands
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DomainManager businessId={business._id} brandId={selectedBrandId as any} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Branding Analytics
                </CardTitle>
                <CardDescription>Track branding activity and usage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h4 className="font-medium">Event Summary</h4>
                      <div className="space-y-1">
                        <p className="text-sm">
                          Total Events: <span className="font-medium">{analytics?.totalEvents || 0}</span>
                        </p>
                        <p className="text-sm">
                          Theme Changes: <span className="font-medium">{analytics?.themeChanges || 0}</span>
                        </p>
                        <p className="text-sm">
                          Asset Uploads: <span className="font-medium">{analytics?.assetUploads || 0}</span>
                        </p>
                        <p className="text-sm">
                          Domain Verifications: <span className="font-medium">{analytics?.domainVerifications || 0}</span>
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Recent Activity</h4>
                      <div className="space-y-1">
                        {analytics?.recentEvents?.slice(0, 5).map((event: any, i: number) => (
                          <p key={i} className="text-sm text-muted-foreground">
                            {event.eventType} • {new Date(event.timestamp).toLocaleString()}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}