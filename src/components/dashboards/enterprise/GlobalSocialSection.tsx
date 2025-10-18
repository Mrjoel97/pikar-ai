import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, Zap, FileText, Palette, AlertTriangle } from "lucide-react";
import { LockedRibbon } from "./LockedRibbon";

type GlobalSocialSectionProps = {
  globalSocialCommandEnabled: boolean;
  whiteLabelEnabled: boolean;
  brandingPortalEnabled: boolean;
  apiWebhooksEnabled: boolean;
  onOpenSocialManager: () => void;
  onOpenBranding: () => void;
  onOpenWorkflows: () => void;
  onOpenApiDocs: () => void;
  onOpenWebhooks: () => void;
  onOpenAnalytics: () => void;
  onUpgrade: () => void;
};

export function GlobalSocialSection({
  globalSocialCommandEnabled,
  whiteLabelEnabled,
  brandingPortalEnabled,
  apiWebhooksEnabled,
  onOpenSocialManager,
  onOpenBranding,
  onOpenWorkflows,
  onOpenApiDocs,
  onOpenWebhooks,
  onOpenAnalytics,
  onUpgrade,
}: GlobalSocialSectionProps) {
  return (
    <section className="relative">
      {!globalSocialCommandEnabled && (
        <LockedRibbon label="Global Social Command requires Enterprise tier" onUpgrade={onUpgrade} />
      )}
      <div className={!globalSocialCommandEnabled ? "pointer-events-none opacity-50" : ""}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-emerald-600" />
            <h2 className="text-xl font-semibold">Global Social Command Center</h2>
          </div>
          <Button size="sm" variant="outline" onClick={onOpenSocialManager} disabled={!globalSocialCommandEnabled}>
            Open Full Manager
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="relative">
            {!whiteLabelEnabled && (
              <LockedRibbon label="White-label features require Enterprise tier" onUpgrade={onUpgrade} />
            )}
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Multi-Brand Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Active Brands</span>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Connected Platforms</span>
                  <span className="font-semibold">48</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Scheduled Posts</span>
                  <span className="font-semibold">2,341</span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={onOpenBranding}
                disabled={!brandingPortalEnabled}
              >
                Manage Brands
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4" />
                AI Orchestration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">AI-Generated Posts</span>
                  <span className="font-semibold">1,847</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Avg Engagement</span>
                  <span className="font-semibold text-green-600">+34%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Auto-Optimized</span>
                  <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                    Active
                  </Badge>
                </div>
              </div>
              <Button size="sm" variant="outline" className="w-full" onClick={onOpenSocialManager}>
                Configure AI Agents
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Crisis Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Active Alerts</span>
                  <Badge variant="outline" className="border-green-300 text-green-700">
                    0
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Sentiment Score</span>
                  <span className="font-semibold text-green-600">94%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Response Time</span>
                  <span className="font-semibold">2.3 min</span>
                </div>
              </div>
              <Button size="sm" variant="outline" className="w-full" onClick={onOpenWorkflows}>
                Crisis Workflows
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Card className="relative">
            {!apiWebhooksEnabled && (
              <LockedRibbon label="API & Webhooks require Enterprise tier" onUpgrade={onUpgrade} />
            )}
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                API Access & Documentation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Integrate social media management into your existing systems with our comprehensive API.
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={onOpenApiDocs} disabled={!apiWebhooksEnabled}>
                  View API Docs
                </Button>
                <Button size="sm" variant="outline" onClick={onOpenWebhooks} disabled={!apiWebhooksEnabled}>
                  Webhooks
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="relative">
            {!whiteLabelEnabled && (
              <LockedRibbon label="White-label reporting requires Enterprise tier" onUpgrade={onUpgrade} />
            )}
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-4 w-4" />
                White-Label Social Reporting
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Generate branded reports for clients with custom logos, colors, and domains.
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={onOpenBranding} disabled={!brandingPortalEnabled}>
                  Customize Branding
                </Button>
                <Button size="sm" variant="outline" onClick={onOpenAnalytics}>
                  Export Reports
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Global Performance Overview</CardTitle>
            <CardDescription>Cross-brand social media metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 border rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Total Reach</div>
                <div className="text-xl font-bold">12.4M</div>
                <div className="text-xs text-green-600">+18% vs last month</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Engagement Rate</div>
                <div className="text-xl font-bold">4.7%</div>
                <div className="text-xs text-green-600">+0.8% vs last month</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Response Time</div>
                <div className="text-xl font-bold">2.3 min</div>
                <div className="text-xs text-green-600">-1.2 min vs last month</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">ROI</div>
                <div className="text-xl font-bold">3.8x</div>
                <div className="text-xs text-green-600">+0.4x vs last month</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
