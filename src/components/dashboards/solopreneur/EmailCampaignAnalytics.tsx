import React from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw, Mail, TrendingUp, DollarSign, Users } from "lucide-react";
import { toast } from "sonner";
import { CampaignMetricsCard } from "./email/CampaignMetricsCard";
import { CampaignPerformanceChart } from "./email/CampaignPerformanceChart";
import { ConversionFunnelChart } from "./email/ConversionFunnelChart";
import { RevenueAttributionTable } from "./email/RevenueAttributionTable";
import { PredictiveInsightsCard } from "./email/PredictiveInsightsCard";

interface EmailCampaignAnalyticsProps {
  businessId: Id<"businesses">;
}

export default function EmailCampaignAnalytics({ businessId }: EmailCampaignAnalyticsProps) {
  const [selectedCampaignId, setSelectedCampaignId] = React.useState<Id<"emailCampaigns"> | null>(null);
  
  const metrics = useQuery(
    api.emailAnalytics.getBusinessCampaignMetrics,
    businessId ? { businessId, limit: 10 } : "skip"
  );
  const realTimeMetrics = useQuery(
    api.emailAnalytics.getRealTimeMetrics,
    selectedCampaignId ? { campaignId: selectedCampaignId } : "skip"
  );
  const funnel = useQuery(
    api.emailAnalytics.getConversionFunnel,
    selectedCampaignId ? { campaignId: selectedCampaignId } : "skip"
  );
  const attribution = useQuery(api.emailAnalytics.getRevenueAttribution, { businessId });
  
  const getPredictiveInsights = useAction(api.emailAnalytics.getPredictiveInsights);
  const [insights, setInsights] = React.useState<any>(null);
  const [loadingInsights, setLoadingInsights] = React.useState(false);

  const handleGetInsights = async () => {
    setLoadingInsights(true);
    try {
      const result = await getPredictiveInsights({ businessId });
      setInsights(result);
      toast.success("AI insights generated successfully");
    } catch (error) {
      toast.error("Failed to generate insights");
    } finally {
      setLoadingInsights(false);
    }
  };

  React.useEffect(() => {
    if (metrics?.campaigns && metrics.campaigns.length > 0 && !selectedCampaignId) {
      setSelectedCampaignId(metrics.campaigns[0].campaignId);
    }
  }, [metrics, selectedCampaignId]);

  if (!metrics) {
    return <div className="flex items-center justify-center p-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Campaign Analytics</h2>
          <p className="text-sm text-muted-foreground">Track performance and optimize your campaigns</p>
        </div>
        <Button onClick={handleGetInsights} disabled={loadingInsights}>
          {loadingInsights ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <TrendingUp className="mr-2 h-4 w-4" />}
          Get AI Insights
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <CampaignMetricsCard
          title="Total Sent"
          value={metrics.totals.totalSent.toLocaleString()}
          icon={<Mail className="h-4 w-4 text-muted-foreground" />}
        />
        <CampaignMetricsCard
          title="Avg Open Rate"
          value={`${metrics.totals.avgOpenRate.toFixed(1)}%`}
          change={5.2}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <CampaignMetricsCard
          title="Avg Click Rate"
          value={`${metrics.totals.avgClickRate.toFixed(1)}%`}
          change={-2.1}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
        <CampaignMetricsCard
          title="Total Revenue"
          value={`$${metrics.totals.totalRevenue.toFixed(2)}`}
          change={12.5}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Attribution</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          {realTimeMetrics && <CampaignPerformanceChart data={realTimeMetrics.last24Hours} />}
        </TabsContent>

        <TabsContent value="funnel" className="space-y-4">
          {funnel && <ConversionFunnelChart funnel={funnel} />}
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          {attribution && <RevenueAttributionTable attribution={attribution} />}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {insights ? (
            <PredictiveInsightsCard insights={insights} />
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              Click "Get AI Insights" to generate predictive analytics
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}