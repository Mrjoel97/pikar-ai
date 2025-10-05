import * as React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calendar, 
  BarChart3, 
  Settings, 
  FileText, 
  Lock,
  Twitter,
  Linkedin,
  Facebook,
  AlertCircle
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface SocialMediaManagerProps {
  businessId: Id<"businesses">;
  userId: Id<"users">;
  tier: "solopreneur" | "startup" | "sme" | "enterprise";
  isGuest?: boolean;
}

// Tier-based feature access configuration
const TIER_FEATURES = {
  solopreneur: {
    maxPlatforms: 2,
    maxPostsPerMonth: 30,
    hasAnalytics: false,
    hasApprovals: false,
    hasAIGeneration: true,
    analyticsDepth: "basic",
  },
  startup: {
    maxPlatforms: 3,
    maxPostsPerMonth: 100,
    hasAnalytics: true,
    hasApprovals: true,
    hasAIGeneration: true,
    analyticsDepth: "standard",
  },
  sme: {
    maxPlatforms: 5,
    maxPostsPerMonth: 500,
    hasAnalytics: true,
    hasApprovals: true,
    hasAIGeneration: true,
    analyticsDepth: "advanced",
  },
  enterprise: {
    maxPlatforms: Infinity,
    maxPostsPerMonth: Infinity,
    hasAnalytics: true,
    hasApprovals: true,
    hasAIGeneration: true,
    analyticsDepth: "enterprise",
  },
};

export function SocialMediaManager({ 
  businessId, 
  userId, 
  tier, 
  isGuest = false 
}: SocialMediaManagerProps) {
  const [activeTab, setActiveTab] = React.useState("posts");
  const tierConfig = TIER_FEATURES[tier];

  // Fetch connected accounts
  const connectedAccounts = useQuery(
    api.socialIntegrations.listConnectedAccounts,
    isGuest ? undefined : { businessId }
  );

  // Fetch scheduled posts
  const scheduledPosts = useQuery(
    api.socialPosts.listScheduledPosts,
    isGuest ? undefined : { businessId, status: "scheduled", limit: 10 }
  );

  // Fetch upcoming posts
  const upcomingPosts = useQuery(
    api.socialPosts.getUpcomingPosts,
    isGuest ? undefined : { businessId, limit: 5 }
  );

  const connectedCount = connectedAccounts?.length || 0;
  const canConnectMore = connectedCount < tierConfig.maxPlatforms;

  // Platform icons mapping
  const platformIcons = {
    twitter: Twitter,
    linkedin: Linkedin,
    facebook: Facebook,
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Social Media Manager</h1>
          <p className="text-muted-foreground mt-1">
            Manage your social media presence across platforms
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {tier.charAt(0).toUpperCase() + tier.slice(1)} Tier
          </Badge>
          <Badge variant="secondary">
            {connectedCount}/{tierConfig.maxPlatforms === Infinity ? "∞" : tierConfig.maxPlatforms} Platforms
          </Badge>
        </div>
      </div>

      {/* Tier Limitations Alert */}
      {!canConnectMore && tierConfig.maxPlatforms !== Infinity && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You've reached your platform limit ({tierConfig.maxPlatforms}). 
            Upgrade to connect more social media accounts.
          </AlertDescription>
        </Alert>
      )}

      {/* Connected Platforms Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Connected Platforms</CardTitle>
        </CardHeader>
        <CardContent>
          {isGuest ? (
            <div className="text-sm text-muted-foreground">
              Sign in to connect your social media accounts
            </div>
          ) : connectedCount === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No platforms connected yet</p>
              <Button size="sm" disabled={!canConnectMore}>
                Connect Your First Platform
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {connectedAccounts?.map((account: any) => {
                const Icon = platformIcons[account.platform as keyof typeof platformIcons];
                return (
                  <Card key={account._id} className="border-2">
                    <CardContent className="p-4 flex items-center gap-3">
                      {Icon && <Icon className="h-5 w-5" />}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{account.accountName}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {account.platform}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">Active</Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Posts</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Schedule</span>
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className="flex items-center gap-2"
            disabled={!tierConfig.hasAnalytics}
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
            {!tierConfig.hasAnalytics && <Lock className="h-3 w-3 ml-1" />}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Posts Tab */}
        <TabsContent value="posts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Posts</CardTitle>
              <CardDescription>
                Manage your published and draft social media posts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isGuest ? (
                <div className="text-center py-8 text-muted-foreground">
                  Sign in to view your posts
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {tierConfig.maxPostsPerMonth === Infinity 
                        ? "Unlimited posts per month" 
                        : `${tierConfig.maxPostsPerMonth} posts per month`}
                    </div>
                    <Button size="sm">
                      Create New Post
                    </Button>
                  </div>
                  <div className="border rounded-lg p-8 text-center text-muted-foreground">
                    Post composer will appear here
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Posts</CardTitle>
              <CardDescription>
                View and manage your upcoming social media posts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isGuest ? (
                <div className="text-center py-8 text-muted-foreground">
                  Sign in to schedule posts
                </div>
              ) : upcomingPosts && upcomingPosts.length > 0 ? (
                <div className="space-y-3">
                  {upcomingPosts.map((post: any) => (
                    <Card key={post._id} className="border-l-4 border-l-emerald-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium mb-1">
                              {new Date(post.scheduledAt!).toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground line-clamp-2">
                              {post.content}
                            </div>
                            <div className="flex gap-2 mt-2">
                              {post.platforms.map((platform: any) => {
                                const Icon = platformIcons[platform as keyof typeof platformIcons];
                                return Icon ? (
                                  <Icon key={platform} className="h-4 w-4 text-muted-foreground" />
                                ) : null;
                              })}
                            </div>
                          </div>
                          <Badge variant="outline">{post.status}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No scheduled posts yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Analytics</CardTitle>
              <CardDescription>
                Track your social media performance and engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!tierConfig.hasAnalytics ? (
                <div className="text-center py-12">
                  <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Analytics Locked</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upgrade to {tier === "solopreneur" ? "Startup" : "higher"} tier to access analytics
                  </p>
                  <Button size="sm" variant="outline">
                    View Upgrade Options
                  </Button>
                </div>
              ) : (
                <div className="border rounded-lg p-8 text-center text-muted-foreground">
                  Analytics dashboard will appear here ({tierConfig.analyticsDepth} level)
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Settings</CardTitle>
              <CardDescription>
                Configure your social media integrations and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Platform Connections */}
              <div>
                <h3 className="font-medium mb-3">Platform Connections</h3>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    disabled={!canConnectMore || isGuest}
                  >
                    <Twitter className="h-4 w-4 mr-2" />
                    Connect Twitter
                    {!canConnectMore && <Lock className="h-3 w-3 ml-auto" />}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    disabled={!canConnectMore || isGuest}
                  >
                    <Linkedin className="h-4 w-4 mr-2" />
                    Connect LinkedIn
                    {!canConnectMore && <Lock className="h-3 w-3 ml-auto" />}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    disabled={!canConnectMore || isGuest}
                  >
                    <Facebook className="h-4 w-4 mr-2" />
                    Connect Facebook
                    {!canConnectMore && <Lock className="h-3 w-3 ml-auto" />}
                  </Button>
                </div>
              </div>

              {/* AI Features */}
              {tierConfig.hasAIGeneration && (
                <div>
                  <h3 className="font-medium mb-3">AI Features</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>AI Content Generation</span>
                      <Badge variant="secondary">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>Hashtag Suggestions</span>
                      <Badge variant="secondary">Enabled</Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Tier Information */}
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-3">Your Plan</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tier:</span>
                    <span className="font-medium capitalize">{tier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Platforms:</span>
                    <span className="font-medium">
                      {tierConfig.maxPlatforms === Infinity ? "Unlimited" : tierConfig.maxPlatforms}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Posts/Month:</span>
                    <span className="font-medium">
                      {tierConfig.maxPostsPerMonth === Infinity ? "Unlimited" : tierConfig.maxPostsPerMonth}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
