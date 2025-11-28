import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DataWarehouseManager } from "@/components/enterprise/DataWarehouseManager";
import { Card, CardContent } from "@/components/ui/card";
import { Database } from "lucide-react";

export default function DataWarehouse() {
  const { user } = useAuth();
  const business = useQuery(api.businesses.currentUserBusiness, user ? undefined : "skip");

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Database className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <div className="font-medium">Sign in to access Data Warehouse</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <DataWarehouseManager businessId={business?._id} />
      </div>
    </div>
  );
}
