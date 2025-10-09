import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CustomApiBuilder } from "@/components/api/CustomApiBuilder";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function ApiBuilderPage() {
  const { user } = useAuth();
  const business = useQuery(api.businesses.getByOwnerId, user ? { ownerId: user.id } : "skip");

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card>
          <CardContent className="p-6 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <span>Please sign in to access the API Builder</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Custom API Builder</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage custom API endpoints for your business
          </p>
        </div>
        <CustomApiBuilder businessId={business._id} />
      </div>
    </div>
  );
}
