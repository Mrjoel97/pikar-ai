import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Users, 
  Eye, 
  Heart, 
  Share2, 
  MessageCircle,
  Download,
  Twitter,
  Linkedin,
  Facebook
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import type { Id } from "@/convex/_generated/dataModel";

interface SocialAnalyticsDashboardProps {
  businessId: Id<"businesses"> | null | undefined;
}

export function SocialAnalyticsDashboard({ businessId }: SocialAnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const [selectedPlatform, setSelectedPlatform] = useState<"all" | "twitter" | "linkedin" | "facebook">("all");

  // In production, this would fetch real analytics data
  // For now, we'll use mock data structure
  const posts = useQuery(
    api.socialPosts.listScheduledPosts,
    businessId ? { businessId, status: "posted", limit: 100 } : undefined
  );

  // Mock analytics data (in production, this would come from a dedicated analytics query)
  const mockAnalytics = {
    summary: {
      totalEngagement: 12450,
      totalReach: 45230,
      totalImpressions: 67890,
      avgEngagementRate: 4.2,
      followerGrowth: 234,
    },
    engagementTrend: [
      { date: "Week 1", likes: 450, shares: 120, comments: 89 },
      { date: "Week 2", likes: 520, shares: 145, comments: 102 },
      { date: "Week 3", likes: 610, shares: 178, comments: 125 },
      { date: "Week 4", likes: 680, shares: 195, comments: 143 },
    ],
    reachTrend: [
      { date: "Week 1", reach: 8500, impressions: 12300 },
      { date: "Week 2", reach: 9200, impressions: 14100 },
      { date: "Week 3", reach: 10800, impressions: 16500 },
      { date: "Week 4", reach: 11200, impressions: 18200 },
    ],
    platformComparison: [
      { platform: "Twitter", engagement: 5200, reach: 18500, posts: 24 },
      { platform: "LinkedIn", engagement: 4100, reach: 15200, posts: 18 },
      { platform: "Facebook", engagement: 3150, reach: 11530, posts: 15 },
    ],
    topPosts: [
      {
        id: "1",
        platform: "twitter",
        content: "Excited to announce our new AI-powered features! 🚀",
        likes: 342,
        shares: 89,
        comments: 56,
        reach: 8900,
        date: "2024-01-15",
      },
      {
        id: "2",
        platform: "linkedin",
        content: "How we scaled our operations with automation...",
        likes: 298,
        shares: 67,
        comments: 43,
        reach: 7200,
        date: "2024-01-12",
      },
      {
        id: "3",
        platform: "facebook",
        content: "Join us for our upcoming webinar on digital transformation",
        likes: 256,
        shares: 54,
        comments: 38,
        reach: 6500,
        date: "2024-01-10",
      },
    ],
    audienceGrowth: [
      { date: "Week 1", followers: 5420 },
      { date: "Week 2", followers: 5512 },
      { date: "Week 3", followers: 5598 },
      { date: "Week 4", followers: 5654 },
    ],
  };

  const COLORS = ["#1DA1F2", "#0A66C2", "#1877F2"];

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "twitter":
        return <Twitter className="h-4 w-4" />;
      case "linkedin":
        return <Linkedin className="h-4 w-4" />;
      case "facebook":
        return <Facebook className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (!businessId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Social Media Analytics</CardTitle>
          <CardDescription>Sign in to view your social media performance</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Please sign in to access analytics for your social media accounts.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Social Media Analytics</h2>
          <p className="text-muted-foreground">Track engagement, reach, and performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPlatform} onValueChange={(v: any) => setSelectedPlatform(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="twitter">Twitter</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.summary.totalEngagement.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12.5%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.summary.totalReach.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8.3%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Impressions</CardTitle>
            <Eye className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.summary.totalImpressions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+15.2%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.summary.avgEngagementRate}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+0.8%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Follower Growth</CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{mockAnalytics.summary.followerGrowth}</div>
            <p className="text-xs text-muted-foreground">New followers this period</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Engagement Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Trends</CardTitle>
            <CardDescription>Likes, shares, and comments over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockAnalytics.engagementTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="likes" stroke="#ef4444" strokeWidth={2} name="Likes" />
                <Line type="monotone" dataKey="shares" stroke="#3b82f6" strokeWidth={2} name="Shares" />
                <Line type="monotone" dataKey="comments" stroke="#10b981" strokeWidth={2} name="Comments" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Reach and Impressions */}
        <Card>
          <CardHeader>
            <CardTitle>Reach & Impressions</CardTitle>
            <CardDescription>Audience reach and content visibility</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockAnalytics.reachTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="reach" fill="#8b5cf6" name="Reach" />
                <Bar dataKey="impressions" fill="#06b6d4" name="Impressions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Platform Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Comparison</CardTitle>
            <CardDescription>Performance across social platforms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockAnalytics.platformComparison.map((platform, idx) => (
                <div key={platform.platform} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[idx] }} />
                      <span className="font-medium">{platform.platform}</span>
                    </div>
                    <Badge variant="outline">{platform.posts} posts</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Engagement</p>
                      <p className="font-semibold">{platform.engagement.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Reach</p>
                      <p className="font-semibold">{platform.reach.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Audience Growth */}
        <Card>
          <CardHeader>
            <CardTitle>Audience Growth</CardTitle>
            <CardDescription>Follower count over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={mockAnalytics.audienceGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="followers" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  name="Followers"
                  dot={{ fill: "#10b981", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Best Performing Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Best Performing Posts</CardTitle>
          <CardDescription>Top posts by engagement in the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockAnalytics.topPosts.map((post, idx) => (
              <div key={post.id} className="flex items-start gap-4 p-4 rounded-lg border">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                  <span className="text-sm font-bold">#{idx + 1}</span>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    {getPlatformIcon(post.platform)}
                    <Badge variant="outline" className="capitalize">{post.platform}</Badge>
                    <span className="text-xs text-muted-foreground">{post.date}</span>
                  </div>
                  <p className="text-sm">{post.content}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      <span>{post.likes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Share2 className="h-3 w-3" />
                      <span>{post.shares}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      <span>{post.comments}</span>
                    </div>
                    <div className="flex items-center gap-1 ml-auto">
                      <Eye className="h-3 w-3" />
                      <span>{post.reach.toLocaleString()} reach</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Your engagement rate is above industry average (3.5%)</li>
            <li>• Twitter posts perform best on weekday mornings</li>
            <li>• LinkedIn content gets 2x more engagement than other platforms</li>
            <li>• Posts with images receive 45% more engagement</li>
            <li>• Your audience is most active between 9 AM - 12 PM</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
