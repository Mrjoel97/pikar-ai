import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import VendorManagementComponent from "@/components/vendors/VendorManagement";
import { Card, CardContent } from "@/components/ui/card";
import { Building2 } from "lucide-react";

export default function VendorManagement() {
  const { user } = useAuth();
  const business = useQuery(api.businesses.currentUserBusiness, user ? undefined : "skip");

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Building2 className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <div className="font-medium">Sign in to access Vendor Management</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <VendorManagementComponent businessId={business?._id} />
      </div>
    </div>
  );
}
