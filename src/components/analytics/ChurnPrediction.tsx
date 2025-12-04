import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Id } from "@/convex/_generated/dataModel";
import { AlertTriangle, TrendingDown, Users } from "lucide-react";

interface ChurnPredictionProps {
  businessId: Id<"businesses">;
}

export function ChurnPrediction({ businessId }: ChurnPredictionProps) {
  const now = Date.now();
  const sixMonthsAgo = now - 180 * 24 * 60 * 60 * 1000;
  
  const churnPrediction = useQuery(api.analytics.churn.getChurnPrediction, {
    businessId,
  });

  const churnTrends = useQuery(api.analytics.churn.getChurnTrends, {
    businessId,
    startDate: sixMonthsAgo,
    endDate: now,
  });

  const churnFactors = useQuery(api.analytics.churn.getChurnFactors, {
    businessId,
  });

  if (!churnPrediction || !churnTrends || !churnFactors) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Churn Prediction</CardTitle>
          <CardDescription>Loading churn analysis...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getRiskBadge = (level: string) => {
    switch (level) {
      case "high":
        return <Badge variant="destructive">High Risk</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500">Medium Risk</Badge>;
      case "low":
        return <Badge variant="secondary">Low Risk</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Churn Prediction & Prevention</CardTitle>
        <CardDescription>Identify at-risk users and take proactive action</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="predictions">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="predictions">At-Risk Users</TabsTrigger>
            <TabsTrigger value="trends">Churn Trends</TabsTrigger>
            <TabsTrigger value="factors">Risk Factors</TabsTrigger>
          </TabsList>

          <TabsContent value="predictions" className="space-y-4">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    High Risk
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{churnPrediction.summary.atRisk}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-yellow-500" />
                    Moderate Risk
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{churnPrediction.summary.moderate}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    Total Contacts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{churnPrediction.summary.totalContacts}</div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              {churnPrediction.predictions.slice(0, 10).map((prediction: any) => (
                <div key={prediction.contactId} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{prediction.name || prediction.email}</h4>
                      <p className="text-sm text-muted-foreground">{prediction.email}</p>
                    </div>
                    {getRiskBadge(prediction.riskLevel)}
                  </div>
                  <div className="flex items-center gap-4 text-sm mb-2">
                    <span className="font-semibold">Churn Score: {prediction.churnScore}%</span>
                    <span className="text-muted-foreground">
                      {prediction.daysSinceEngagement} days since last activity
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {prediction.factors.map((factor: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {factor}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <div className="space-y-2">
              {churnTrends.map((trend: any) => {
                const date = new Date(trend.period);
                return (
                  <div key={trend.period} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">
                        {date.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                      </h4>
                      <span className="text-2xl font-bold">{trend.churnRate}%</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Active Users</div>
                        <div className="font-semibold">{trend.activeUsers}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Churned</div>
                        <div className="font-semibold">{trend.churnedUsers}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="factors" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Low Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{churnFactors.factors.lowEngagement}</div>
                  <p className="text-xs text-muted-foreground">
                    {churnFactors.percentages.lowEngagement}% of users
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">No Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{churnFactors.factors.noRecentActivity}</div>
                  <p className="text-xs text-muted-foreground">
                    {churnFactors.percentages.noRecentActivity}% of users
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Short Tenure</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{churnFactors.factors.shortTenure}</div>
                  <p className="text-xs text-muted-foreground">
                    {churnFactors.percentages.shortTenure}% of users
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Negative Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{churnFactors.factors.negativeStatus}</div>
                  <p className="text-xs text-muted-foreground">
                    {churnFactors.percentages.negativeStatus}% of users
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
