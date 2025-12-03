import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Activity, TrendingUp, Zap } from "lucide-react";
import { IntegrationHealthCard } from "./IntegrationHealthCard";
import { IntegrationAnalytics } from "./IntegrationAnalytics";
import { IntegrationMarketplace } from "./IntegrationMarketplace";
import { StatCard } from "@/components/dashboard/StatCard";
import type { Id } from "@/convex/_generated/dataModel";

interface IntegrationHubProps {
  businessId: Id<"businesses">;
  tier: string;
  isGuest?: boolean;
}

export default function IntegrationHub({ businessId, tier, isGuest = false }: IntegrationHubProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Fetch integration data
  const crmConnections = useQuery(
    api.crmIntegrations.listConnections,
    isGuest ? "skip" : { businessId }
  );
  
  const customApis = useQuery(
    api.customApis.listCustomApis,
    isGuest ? "skip" : { businessId }
  );

  // Fetch social API configurations for current business
  const configsForBusiness = useQuery(
    api.socialApiConfigs.listConfigsForBusiness,
    isGuest ? "skip" : { businessId }
  );

  // Determine social platform configuration status
  const socialPlatformStatus = useMemo(() => {
    if (isGuest || !configsForBusiness) return {};
    
    const platforms = ["twitter", "linkedin", "meta", "youtube", "google"];
    const platformConfigs = configsForBusiness.platformConfigs || [];
    const enterpriseConfigs = configsForBusiness.enterpriseConfigs || [];
    
    return platforms.reduce((acc, platform) => {
      const platformConfig = platformConfigs.find((c: any) => c.platform === platform);
      const enterpriseConfig = enterpriseConfigs.find((c: any) => c.platform === platform);

      acc[platform] = {
        configured: !!(enterpriseConfig?.hasCredentials || platformConfig?.hasCredentials),
        scope: enterpriseConfig?.hasCredentials ? "enterprise" : "platform",
        active: enterpriseConfig?.isActive ?? platformConfig?.isActive ?? false,
      };
      return acc;
    }, {} as Record<string, { configured: boolean; scope: string; active: boolean }>);
  }, [configsForBusiness, businessId, isGuest]);

  // Aggregate integration stats
  const totalConnections = (crmConnections?.length || 0) + (customApis?.length || 0);
  const activeConnections = (crmConnections?.filter((c: any) => c.isActive).length || 0) + 
                           (customApis?.filter((a: any) => a.isActive).length || 0);
  const healthyConnections = crmConnections?.filter((c: any) => c.isActive && !c.lastSyncError).length || 0;

  // Mock data for demo/guest mode
  const demoIntegrations = [
    { id: "1", name: "Salesforce", type: "crm", status: "connected", health: "healthy", lastSync: Date.now() - 300000 },
    { id: "2", name: "HubSpot", type: "crm", status: "connected", health: "healthy", lastSync: Date.now() - 600000 },
    { id: "3", name: "Twitter", type: "social", status: "connected", health: "warning", lastSync: Date.now() - 7200000 },
    { id: "4", name: "Custom API", type: "api", status: "connected", health: "healthy", lastSync: Date.now() - 180000 },
  ];

  const integrations = isGuest ? demoIntegrations : [
    ...(crmConnections?.map((c: any) => ({
      id: c._id,
      name: c.platform,
      type: "crm",
      status: c.isActive ? "connected" : "disconnected",
      health: c.lastSyncError ? "error" : "healthy",
      lastSync: c.lastSyncAt,
      accountName: c.accountName,
    })) || []),
    ...(customApis?.map((a: any) => ({
      id: a._id,
      name: a.name,
      type: "api",
      status: a.isActive ? "connected" : "disconnected",
      health: "healthy",
      lastSync: Date.now(),
      description: a.description,
    })) || []),
  ];

  // Filter integrations
  const filteredIntegrations = integrations.filter((integration) => {
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || integration.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || integration.type === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const healthPercentage = totalConnections > 0 
    ? Math.round((healthyConnections / totalConnections) * 100) 
    : 100;

  return (
    <div className="space-y-6">
      {/* Social Platform Configuration Status */}
      {!isGuest && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Social Media API Status</CardTitle>
            <CardDescription>Platform configuration for your tier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(socialPlatformStatus).map(([platform, status]: [string, any]) => (
                <Badge
                  key={platform}
                  variant={status.configured && status.active ? "default" : "secondary"}
                  className="capitalize"
                >
                  {platform === "meta" ? "Meta (FB/IG)" : platform}:{" "}
                  {status.configured
                    ? `${status.scope} ${status.active ? "✓" : "inactive"}`
                    : "not configured"}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Integrations"
          value={totalConnections}
          icon={Zap}
          description="Connected platforms"
        />
        <StatCard
          title="Active Connections"
          value={activeConnections}
          icon={Activity}
          description="Currently enabled"
        />
        <StatCard
          title="Health Score"
          value={`${healthPercentage}%`}
          icon={TrendingUp}
          description="Overall integration health"
          delta={healthPercentage >= 90 ? 5 : healthPercentage >= 70 ? 0 : -5}
        />
        <StatCard
          title="API Calls (24h)"
          value={isGuest ? "12.4K" : customApis?.reduce((sum: number, api: any) => sum + (api.totalCalls || 0), 0) || 0}
          icon={Activity}
          description="Total requests"
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Connected Integrations</CardTitle>
                  <CardDescription>Manage your active platform connections</CardDescription>
                </div>
                <Button onClick={() => {/* Navigate to marketplace */}}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Integration
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search integrations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="connected">Connected</SelectItem>
                    <SelectItem value="disconnected">Disconnected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="crm">CRM</SelectItem>
                    <SelectItem value="social">Social Media</SelectItem>
                    <SelectItem value="api">Custom APIs</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Integration Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredIntegrations.map((integration) => (
                  <IntegrationHealthCard
                    key={integration.id}
                    integration={integration}
                    businessId={businessId}
                    isGuest={isGuest}
                  />
                ))}
              </div>

              {filteredIntegrations.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-lg font-medium mb-2">No integrations found</p>
                  <p className="text-sm">Try adjusting your filters or add a new integration</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <IntegrationAnalytics businessId={businessId} isGuest={isGuest} />
        </TabsContent>

        {/* Marketplace Tab */}
        <TabsContent value="marketplace">
          <IntegrationMarketplace businessId={businessId} tier={tier} isGuest={isGuest} />
        </TabsContent>
      </Tabs>
    </div>
  );
}