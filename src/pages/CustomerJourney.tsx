import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CustomerJourneyMap } from "@/components/dashboards/startup/CustomerJourneyMap";
import { Card, CardContent } from "@/components/ui/card";
import { Map } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Map className="h-8 w-8" />
            Customer Journey Map
          </h1>
          <p className="text-muted-foreground mt-2">
            Visualize and optimize your customer journey across all touchpoints
          </p>
        </div>

        <CustomerJourneyMap businessId={business?._id} />
      </div>
    </div>
  );
}
