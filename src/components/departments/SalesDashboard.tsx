import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, DollarSign, Target, Clock } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface SalesDashboardProps {
  businessId?: Id<"businesses">;
  isGuest?: boolean;
}

export function SalesDashboard({ businessId, isGuest }: SalesDashboardProps) {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const kpis = useQuery(
    api.departmentKpis.getSalesKpis,
    businessId ? { businessId, timeRange } : undefined
  );

  const pipelineDrilldown = useQuery(
    api.departmentKpis.getDealPipelineDrilldown,
    businessId && selectedStage ? { businessId, stage: selectedStage } : "skip"
  );

  const exportData = useMutation(api.departmentKpis.exportDepartmentData);

  const handleExport = async (format: "csv" | "json" | "pdf") => {
    if (!businessId) {
      toast.error("Export not available in guest mode");
      return;
    }
    
    try {
      const result = await exportData({
        businessId,
        department: "sales",
        format,
        timeRange,
      });
      toast.success(`Export ready! Download: ${result.downloadUrl}`);
    } catch (error) {
      toast.error("Failed to export data");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Data refreshed");
    }, 1000);
  };

  if (!kpis) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sales Dashboard</h2>
          <p className="text-muted-foreground">Track pipeline, win rates, and quota attainment</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs text-muted-foreground">Live data • Updated {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={(v) => handleExport(v as any)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Export" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">Export CSV</SelectItem>
              <SelectItem value="json">Export JSON</SelectItem>
              <SelectItem value="pdf">Export PDF</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards with real-time indicators */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Velocity</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.summary.pipelineVelocity} days</div>
            <p className="text-xs text-muted-foreground">Avg time to close</p>
            <div className="text-xs text-green-600 mt-1">↓ 3 days vs last period</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.summary.winRate}%</div>
            <p className="text-xs text-muted-foreground">Closed won / total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(kpis.summary.avgDealSize / 1000).toFixed(1)}K</div>
            <p className="text-xs text-muted-foreground">Per closed deal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Quota Attainment</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.summary.quotaAttainment}%</div>
            <p className="text-xs text-muted-foreground">Team average</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row with drill-down */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Pipeline by Stage */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline by Stage</CardTitle>
            <CardDescription>Deal count and value across sales stages • Click for details</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={kpis.pipelineByStage} onClick={(data) => {
                if (data && data.activeLabel) {
                  setSelectedStage(data.activeLabel);
                }
              }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" angle={-45} textAnchor="end" height={80} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="count" fill="#3b82f6" name="Deal Count" />
                <Bar yAxisId="right" dataKey="value" fill="#10b981" name="Value ($)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Deal Size Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Deal Size Distribution</CardTitle>
            <CardDescription>Breakdown of deals by value range</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={kpis.dealSizeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.range}: ${entry.count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {kpis.dealSizeDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Win Rate Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Win Rate Trend</CardTitle>
          <CardDescription>Monthly win rate and deal volume</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={kpis.winRateTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="winRate" stroke="#10b981" name="Win Rate (%)" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="deals" stroke="#3b82f6" name="Total Deals" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Reps Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Sales Reps by Quota Attainment</CardTitle>
          <CardDescription>Performance leaderboard</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Rep</th>
                  <th className="text-right py-2 px-4">Quota</th>
                  <th className="text-right py-2 px-4">Achieved</th>
                  <th className="text-right py-2 px-4">Attainment</th>
                  <th className="text-right py-2 px-4">Deals</th>
                </tr>
              </thead>
              <tbody>
                {kpis.topReps.map((rep: any, idx: number) => (
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-4 font-medium">{rep.name}</td>
                    <td className="text-right py-2 px-4">${(rep.quota / 1000).toFixed(0)}K</td>
                    <td className="text-right py-2 px-4">${(rep.achieved / 1000).toFixed(0)}K</td>
                    <td className="text-right py-2 px-4">
                      <span className={`font-semibold ${rep.attainment >= 90 ? 'text-green-600' : rep.attainment >= 75 ? 'text-orange-600' : 'text-red-600'}`}>
                        {rep.attainment}%
                      </span>
                    </td>
                    <td className="text-right py-2 px-4">{rep.deals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Drill-down Dialog */}
      <Dialog open={!!selectedStage} onOpenChange={() => setSelectedStage(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pipeline Stage: {selectedStage}</DialogTitle>
          </DialogHeader>
          {pipelineDrilldown && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="p-3 border rounded">
                  <div className="text-xs text-muted-foreground">Total Deals</div>
                  <div className="text-xl font-bold">{pipelineDrilldown.stageMetrics.totalDeals}</div>
                </div>
                <div className="p-3 border rounded">
                  <div className="text-xs text-muted-foreground">Total Value</div>
                  <div className="text-xl font-bold">${(pipelineDrilldown.stageMetrics.totalValue / 1000).toFixed(0)}K</div>
                </div>
                <div className="p-3 border rounded">
                  <div className="text-xs text-muted-foreground">Avg Deal Size</div>
                  <div className="text-xl font-bold">${(pipelineDrilldown.stageMetrics.avgDealSize / 1000).toFixed(1)}K</div>
                </div>
                <div className="p-3 border rounded">
                  <div className="text-xs text-muted-foreground">Conversion Rate</div>
                  <div className="text-xl font-bold text-green-600">{pipelineDrilldown.stageMetrics.conversionRate}%</div>
                </div>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Deals in Stage</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Deal</th>
                        <th className="text-right py-2">Value</th>
                        <th className="text-center py-2">Probability</th>
                        <th className="text-left py-2">Rep</th>
                        <th className="text-center py-2">Days in Stage</th>
                        <th className="text-left py-2">Next Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pipelineDrilldown.deals.map((deal: any) => (
                        <tr key={deal.id} className="border-b hover:bg-muted/50">
                          <td className="py-2">{deal.name}</td>
                          <td className="text-right py-2">${deal.value.toLocaleString()}</td>
                          <td className="text-center py-2">{deal.probability}%</td>
                          <td className="py-2">{deal.rep}</td>
                          <td className="text-center py-2">{deal.daysInStage}</td>
                          <td className="py-2 text-sm text-muted-foreground">{deal.nextAction}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}