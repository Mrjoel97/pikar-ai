import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { 
  Briefcase, 
  CheckCircle,
  Users,
  AlertTriangle,
  TrendingUp,
  Lightbulb
} from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { BusinessComparisonTab } from "./portfolio/BusinessComparisonTab";
import { PredictiveInsightsTab } from "./portfolio/PredictiveInsightsTab";
import { RiskAssessmentTab } from "./portfolio/RiskAssessmentTab";

export function PortfolioDashboard({ businessId }: { businessId?: Id<"businesses"> | null }) {
  const overview = useQuery(
    api.portfolioManagement.getPortfolioOverview,
    businessId ? { businessId } : undefined
  );

  const crossBusinessAnalytics = useQuery(
    api.portfolioManagement.getCrossBusinessAnalytics,
    businessId ? { businessId } : undefined
  );

  const benchmarks = useQuery(
    api.portfolioManagement.getPerformanceBenchmarks,
    businessId ? { businessId } : undefined
  );

  const predictiveInsights = useQuery(
    api.portfolioManagement.getPredictiveInsights,
    businessId ? { businessId } : undefined
  );

  const resourceAllocation = useQuery(
    api.portfolioManagement.getResourceAllocation,
    businessId ? { businessId } : undefined
  );

  const riskAssessment = useQuery(
    api.portfolioManagement.getPortfolioRiskAssessment,
    businessId ? { businessId } : undefined
  );

  const optimizeResources = useMutation(api.portfolioManagement.optimizeResourceAllocation);
  const generateRecommendations = useMutation(api.portfolioManagement.generateOptimizationRecommendations);

  const handleOptimize = async () => {
    if (!businessId) return;
    try {
      const result = await optimizeResources({ businessId });
      toast.success(`Generated ${result.suggestions.length} optimization suggestions`);
    } catch (error: any) {
      toast.error(error.message || "Failed to optimize resources");
    }
  };

  const handleGenerateRecommendations = async () => {
    if (!businessId) return;
    try {
      const result = await generateRecommendations({ businessId });
      toast.success(`Generated ${result.recommendations.length} recommendations`);
    } catch (error: any) {
      toast.error(error.message || "Failed to generate recommendations");
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case "healthy": return "bg-green-100 text-green-700 border-green-300";
      case "warning": return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "critical": return "bg-red-100 text-red-700 border-red-300";
      default: return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low": return "bg-green-100 text-green-700 border-green-300";
      case "medium": return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "high": return "bg-orange-100 text-orange-700 border-orange-300";
      case "critical": return "bg-red-100 text-red-700 border-red-300";
      default: return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  if (!businessId) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Briefcase className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <div className="font-medium">Sign in to access Portfolio Management</div>
          <div className="text-sm text-muted-foreground">This feature requires a business context.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6" />
            Global Initiative Portfolio
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enterprise-wide portfolio management and optimization
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleGenerateRecommendations} variant="outline">
            <Lightbulb className="h-4 w-4 mr-2" />
            Get Recommendations
          </Button>
          <Button onClick={handleOptimize}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Optimize Resources
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="comparison">Business Comparison</TabsTrigger>
          <TabsTrigger value="resources">Resource Allocation</TabsTrigger>
          <TabsTrigger value="benchmarks">Performance Benchmarks</TabsTrigger>
          <TabsTrigger value="predictions">Predictive Insights</TabsTrigger>
          <TabsTrigger value="risks">Risk Assessment</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{overview?.totalInitiatives || 0}</div>
                    <div className="text-xs text-muted-foreground mt-1">Total Initiatives</div>
                  </div>
                  <Briefcase className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{overview?.activeInitiatives || 0}</div>
                    <div className="text-xs text-muted-foreground mt-1">Active</div>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {typeof resourceAllocation?.utilizationRate === "number"
                        ? Math.round(resourceAllocation.utilizationRate)
                        : 0}
                      %
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Resource Utilization</div>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{riskAssessment?.overallRiskScore || 0}</div>
                    <div className="text-xs text-muted-foreground mt-1">Risk Score</div>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Portfolio Health</CardTitle>
              <CardDescription>Overall portfolio status and key metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-medium mb-1">Overall Health</div>
                  <Badge variant="outline" className={getHealthColor(overview?.overallHealth || "unknown")}>
                    {overview?.overallHealth || "Unknown"}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium mb-1">Budget Utilization</div>
                  <div className="text-2xl font-bold">
                    ${(overview?.totalSpent || 0).toLocaleString()} / ${(overview?.totalBudget || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <BusinessComparisonTab crossBusinessAnalytics={crossBusinessAnalytics} />
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resource Allocation by Initiative</CardTitle>
              <CardDescription>Current resource distribution across portfolio</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={resourceAllocation?.byInitiative || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="initiativeName" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="utilization" fill="#3b82f6" name="Utilization %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benchmarks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Benchmarking</CardTitle>
              <CardDescription>Compare your performance against industry standards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">Your Score</div>
                    <div className="text-2xl font-bold">{benchmarks?.businessScore || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">Industry Average</div>
                    <div className="text-2xl font-bold">{benchmarks?.industryAverage || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">Percentile Rank</div>
                    <div className="text-2xl font-bold">{benchmarks?.percentile || 0}th</div>
                  </CardContent>
                </Card>
              </div>

              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={benchmarks?.benchmarks || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#3b82f6" name="Your Performance" />
                  <Bar dataKey="industry" fill="#94a3b8" name="Industry Average" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <PredictiveInsightsTab predictiveInsights={predictiveInsights} />
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          <RiskAssessmentTab riskAssessment={riskAssessment} getRiskColor={getRiskColor} />
        </TabsContent>
      </Tabs>
    </div>
  );
}