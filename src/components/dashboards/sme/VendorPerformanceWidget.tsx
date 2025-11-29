import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Building2, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

interface VendorPerformanceWidgetProps {
  businessId: Id<"businesses"> | null;
}

export function VendorPerformanceWidget({ businessId }: VendorPerformanceWidgetProps) {
  const navigate = useNavigate();
  
  const insights = useQuery(
    api.vendors.getVendorPerformanceInsights,
    businessId ? { businessId } : "skip"
  );

  const calculateScore = useMutation(api.vendors.calculatePerformanceScore);

  const handleRecalculate = async (vendorId: Id<"vendors">) => {
    try {
      const result = await calculateScore({ vendorId });
      toast.success(result.message);
    } catch (error) {
      toast.error("Failed to calculate score");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">Vendor Performance</CardTitle>
        <Button 
          size="sm" 
          onClick={() => navigate("/vendors")}
          className="h-8"
        >
          Manage Vendors
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Average Score */}
        <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
          <p className="text-sm text-muted-foreground mb-1">Average Performance</p>
          <p className="text-4xl font-bold text-blue-700">{insights?.averageScore || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">out of 100</p>
        </div>

        {/* Top Performers */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Top Performers</p>
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
              {insights?.topPerformers.length || 0}
            </Badge>
          </div>
          {!insights?.topPerformers || insights.topPerformers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No top performers yet</p>
          ) : (
            <div className="space-y-2">
              {insights.topPerformers.slice(0, 3).map((vendor) => (
                <div 
                  key={vendor._id}
                  className="flex items-center justify-between p-2 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 cursor-pointer transition-colors"
                  onClick={() => navigate(`/vendors?id=${vendor._id}`)}
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">{vendor.name}</p>
                      <p className="text-xs text-muted-foreground">{vendor.category}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-600 text-white">
                    {vendor.performanceScore}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* At Risk Vendors */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">At Risk</p>
            <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-300">
              {insights?.atRisk.length || 0}
            </Badge>
          </div>
          {!insights?.atRisk || insights.atRisk.length === 0 ? (
            <p className="text-sm text-muted-foreground">No vendors at risk</p>
          ) : (
            <div className="space-y-2">
              {insights.atRisk.slice(0, 3).map((vendor) => (
                <div 
                  key={vendor._id}
                  className="flex items-center justify-between p-2 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 cursor-pointer transition-colors"
                  onClick={() => handleRecalculate(vendor._id)}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <div>
                      <p className="text-sm font-medium">{vendor.name}</p>
                      <p className="text-xs text-muted-foreground">Click to recalculate</p>
                    </div>
                  </div>
                  <Badge variant="destructive">
                    {vendor.performanceScore}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => navigate("/vendors")}
        >
          <Building2 className="h-4 w-4 mr-2" />
          View All Vendors
        </Button>
      </CardContent>
    </Card>
  );
}
