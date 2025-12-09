import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SecurityDashboard } from "@/components/enterprise/SecurityDashboard";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function SecurityPage() {
  const navigate = useNavigate();
  const business = useQuery(api.businesses.currentUserBusiness);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Security & Compliance</h1>
            <p className="text-muted-foreground">
              Enterprise-grade security monitoring and compliance tracking
            </p>
          </div>
        </div>

        <SecurityDashboard businessId={business?._id} />
      </div>
    </div>
  );
}
