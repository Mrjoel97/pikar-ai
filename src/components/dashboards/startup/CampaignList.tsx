import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, TrendingUp, Users, Clock, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router";

interface CampaignListProps {
  businessId: string;
}

export function CampaignList({ businessId }: CampaignListProps) {
  const navigate = useNavigate();
  const campaigns = useQuery(
    api.emails.listCampaignsByBusiness,
    businessId ? { businessId: businessId as any } : "skip"
  );

  const analytics = useQuery(
    api.emailAnalytics.getCampaignPerformance,
    businessId ? { businessId: businessId as any, days: 30 } : "skip"
  );

  if (!campaigns) {
    return (
      <Card className="neu-raised">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Campaign Management
          </CardTitle>
          <CardDescription>Loading campaigns...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const activeCampaigns = campaigns.filter((c: any) => c.status === "scheduled" || c.status === "sending");
  const completedCampaigns = campaigns.filter((c: any) => c.status === "sent");

  return (
    <Card className="neu-raised">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Campaign Management
            </CardTitle>
            <CardDescription>Email campaign performance and tracking</CardDescription>
          </div>
          <Button size="sm" onClick={() => navigate("/content-calendar")}>
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              Total Campaigns
            </div>
            <div className="text-xl font-bold">{campaigns.length}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Active
            </div>
            <div className="text-xl font-bold text-blue-600">{activeCampaigns.length}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Avg Open Rate
            </div>
            <div className="text-xl font-bold text-green-600">
              {analytics?.averageOpenRate ? `${Math.round(analytics.averageOpenRate)}%` : "N/A"}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              Total Sent
            </div>
            <div className="text-xl font-bold">
              {analytics?.totalSent?.toLocaleString() || 0}
            </div>
          </div>
        </div>

        {/* Campaign List */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Recent Campaigns
          </h4>
          {campaigns.slice(0, 5).map((campaign: any) => (
            <div
              key={campaign._id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{campaign.subject}</p>
                  <Badge variant={
                    campaign.status === "sent" ? "default" :
                    campaign.status === "sending" ? "secondary" :
                    "outline"
                  } className="text-xs">
                    {campaign.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{campaign.recipientCount || 0} recipients</span>
                  {campaign.scheduledFor && (
                    <span>
                      {new Date(campaign.scheduledFor).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              {campaign.status === "sent" && campaign.stats && (
                <div className="flex items-center gap-3 text-xs">
                  <div className="text-center">
                    <div className="font-semibold text-green-600">
                      {Math.round((campaign.stats.opens / campaign.stats.sent) * 100)}%
                    </div>
                    <div className="text-muted-foreground">Opens</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-blue-600">
                      {Math.round((campaign.stats.clicks / campaign.stats.sent) * 100)}%
                    </div>
                    <div className="text-muted-foreground">Clicks</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {campaigns.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No campaigns yet</p>
            <Button size="sm" className="mt-3" onClick={() => navigate("/content-calendar")}>
              Create Campaign
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}