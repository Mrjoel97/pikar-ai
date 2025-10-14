import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Twitter, Linkedin, Facebook } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

type SocialMetrics = {
  summary: {
    totalPosts: number;
    totalEngagement: number;
    avgEngagement: number;
    reach?: number;
  };
  platformMetrics: Record<string, { posts: number; engagement: number }>;
  topPosts: Array<{
    _id: string;
    content: string;
    platforms: string[];
    engagement: number;
    publishedAt?: number;
  }>;
};

const PLATFORM_ICON: Record<string, React.ComponentType<any>> = {
  twitter: Twitter,
  linkedin: Linkedin,
  facebook: Facebook,
};

export function SocialPerformance({ businessId }: { businessId: Id<"businesses"> }) {
  const data = useQuery(api.socialAnalytics.getSolopreneurSocialMetrics as any, {
    businessId,
    days: 30,
  }) as SocialMetrics | undefined | null;

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Social Media Performance
          </CardTitle>
        </CardHeader>
        <CardContent>Loading social metrics...</CardContent>
      </Card>
    );
  }

  const platforms = Object.entries(data.platformMetrics);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Social Media Performance (Last 30 Days)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="border rounded-lg p-3">
            <div className="text-sm text-muted-foreground">Total Posts</div>
            <div className="text-2xl font-bold">{data.summary.totalPosts}</div>
          </div>
          <div className="border rounded-lg p-3">
            <div className="text-sm text-muted-foreground">Total Engagement</div>
            <div className="text-2xl font-bold">{data.summary.totalEngagement}</div>
          </div>
          <div className="border rounded-lg p-3">
            <div className="text-sm text-muted-foreground">Avg per Post</div>
            <div className="text-2xl font-bold">{data.summary.avgEngagement}</div>
          </div>
        </div>

        {/* Platform Breakdown */}
        <div>
          <h3 className="font-medium mb-3">Platform Breakdown</h3>
          <div className="space-y-2">
            {platforms.length === 0 ? (
              <div className="text-sm text-muted-foreground">No posts yet.</div>
            ) : (
              platforms.map(([platform, vals]) => {
                const Icon = PLATFORM_ICON[platform] || null;
                return (
                  <div key={platform} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      {Icon ? <Icon className="h-4 w-4" /> : null}
                      <span className="capitalize">{platform}</span>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span>{vals.posts} posts</span>
                      <span className="text-muted-foreground">{vals.engagement} engagement</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top Posts */}
        <div>
          <h3 className="font-medium mb-3">Top Performing Posts</h3>
          <div className="space-y-2">
            {data.topPosts.length === 0 ? (
              <div className="text-sm text-muted-foreground">No posts found.</div>
            ) : (
              data.topPosts.map((p) => (
                <div key={String(p._id)} className="border rounded p-3">
                  <div className="text-sm mb-2 truncate">{p.content}</div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {p.platforms.map((pf) => {
                        const Icon = PLATFORM_ICON[pf] || null;
                        return Icon ? <Icon key={pf} className="h-3 w-3" /> : null;
                      })}
                    </div>
                    <Badge variant="secondary">{p.engagement} engagement</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
