import * as React from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Twitter, Linkedin, Facebook, TrendingUp, Clock, Sparkles } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

interface SocialPerformanceProps {
  businessId: Id<"businesses">;
}

export default function SocialPerformance({ businessId }: SocialPerformanceProps) {
  const [showRecommendations, setShowRecommendations] = React.useState(false);
  const [selectedPlatform, setSelectedPlatform] = React.useState<"twitter" | "linkedin" | "facebook">("twitter");
  
  const metrics = useQuery(api.socialAnalytics.getSolopreneurSocialMetrics, {
    businessId,
    days: 30,
  });

  const getRecommendations = useAction(api.socialContentAgent.optimization.recommendPostingTimes);
  const [recommendations, setRecommendations] = React.useState<any>(null);
  const [loadingRecs, setLoadingRecs] = React.useState(false);

  const handleGetRecommendations = async (platform: "twitter" | "linkedin" | "facebook") => {
    setLoadingRecs(true);
    setSelectedPlatform(platform);
    try {
      const result = await getRecommendations({
        businessId,
        platform,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      setRecommendations(result);
      setShowRecommendations(true);
      toast.success(`Optimal posting times for ${platform} loaded`);
    } catch (error) {
      toast.error("Failed to load recommendations");
    } finally {
      setLoadingRecs(false);
    }
  };

  const platformIcons = {
    twitter: Twitter,
    linkedin: Linkedin,
    facebook: Facebook,
  };

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Social Media Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading metrics...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Social Media Performance (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Summary Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{metrics.summary.totalPosts}</div>
                <div className="text-sm text-muted-foreground">Total Posts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{metrics.summary.totalEngagement}</div>
                <div className="text-sm text-muted-foreground">Total Engagement</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{metrics.summary.avgEngagement.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">Avg Engagement</div>
              </div>
            </div>

            {/* Platform Breakdown */}
            <div>
              <h4 className="font-medium mb-2 flex items-center justify-between">
                <span>Platform Breakdown</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRecommendations(!showRecommendations)}
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  Best Times
                </Button>
              </h4>
              <div className="space-y-2">
                {metrics.platformBreakdown.map((platform: any) => {
                  const Icon = platformIcons[platform.platform as keyof typeof platformIcons];
                  return (
                    <div
                      key={platform.platform}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
                        <div>
                          <div className="font-medium capitalize">{platform.platform}</div>
                          <div className="text-sm text-muted-foreground">
                            {platform.posts} posts • {platform.engagement} engagement
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleGetRecommendations(platform.platform as any)}
                        disabled={loadingRecs}
                      >
                        <Clock className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Best Posting Time Recommendations */}
            {showRecommendations && recommendations && (
              <div className="border rounded-lg p-4 bg-emerald-50">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  Optimal Posting Times for {selectedPlatform}
                </h4>
                <div className="space-y-2">
                  {recommendations.recommendations?.map((rec: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <Clock className="h-4 w-4 text-emerald-600 mt-0.5" />
                      <div>
                        <div className="font-medium">
                          {rec.day} at {rec.time}
                        </div>
                        <div className="text-muted-foreground">{rec.reason}</div>
                      </div>
                    </div>
                  ))}
                  {(!recommendations.recommendations || recommendations.recommendations.length === 0) && (
                    <div className="text-sm text-muted-foreground">
                      Default optimal times: {recommendations.defaultTimes?.join(", ")}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Top Performing Posts */}
            {metrics.topPosts && metrics.topPosts.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Top Performing Posts</h4>
                <div className="space-y-2">
                  {metrics.topPosts.slice(0, 3).map((post: any) => (
                    <div key={post._id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm line-clamp-2">{post.content}</div>
                          <div className="flex items-center gap-2 mt-1">
                            {post.platforms?.map((p: string) => {
                              const Icon = platformIcons[p as keyof typeof platformIcons];
                              return Icon ? (
                                <Icon key={p} className="h-3 w-3 text-muted-foreground" />
                              ) : null;
                            })}
                          </div>
                        </div>
                        <Badge variant="secondary">{post.engagement || 0} eng.</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}