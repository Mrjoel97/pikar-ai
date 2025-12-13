import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CustomerJourneyMap } from "@/components/dashboards/startup/CustomerJourneyMap";
import { JourneyBuilder } from "@/components/journey/JourneyBuilder";
import { JourneyAnalytics } from "@/components/journey/JourneyAnalytics";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Map } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

export default function CustomerJourney() {
  const { user } = useAuth();
  const business = useQuery(api.businesses.currentUserBusiness, user ? undefined : "skip");

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Map className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <div className="font-medium">Sign in to access Customer Journey Map</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mock journey metrics for JourneyAnalytics component
  const mockMetrics = {
    totalContacts: 1250,
    avgTimeInJourney: 14,
    completionRate: 68,
    dropoffRate: 32,
    topPerformingStage: "Decision",
    bottleneckStage: "Consideration",
  };

  const mockABTestResults = [
    { variant: "Control", conversionRate: 65, sampleSize: 500 },
    { variant: "Variant A", conversionRate: 72, sampleSize: 450 },
    { variant: "Variant B", conversionRate: 68, sampleSize: 300 },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Map className="h-8 w-8" />
            Customer Journey Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Visualize, build, and optimize your customer journey across all touchpoints
          </p>
        </div>

        <Tabs defaultValue="map" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="map">Journey Map</TabsTrigger>
            <TabsTrigger value="builder">Journey Builder</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-6">
            {business?._id ? (
              <CustomerJourneyMap businessId={business._id as Id<"businesses">} />
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Loading journey data...
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="builder" className="space-y-6">
            {business?._id ? (
              <JourneyBuilder 
                businessId={business._id}
                onSave={(stages) => {
                  console.log("Saving journey stages:", stages);
                  // TODO: Implement save functionality
                }}
              />
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Loading journey builder...
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <JourneyAnalytics 
              metrics={mockMetrics}
              abTestResults={mockABTestResults}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}