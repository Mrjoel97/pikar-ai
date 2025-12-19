import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Id } from "@/convex/_generated/dataModel";

interface VendorListTabProps {
  vendors: any;
  compareVendors: Id<"vendors">[];
  toggleVendorComparison: (vendorId: Id<"vendors">) => void;
  getRiskBadgeVariant: (level: string) => "destructive" | "default" | "secondary";
  setSelectedVendor: (id: Id<"vendors">) => void;
  setPerformanceDialogOpen: (open: boolean) => void;
}

export function VendorListTab({
  vendors,
  compareVendors,
  toggleVendorComparison,
  getRiskBadgeVariant,
  setSelectedVendor,
  setPerformanceDialogOpen,
}: VendorListTabProps) {
  return (
    <div className="grid gap-4">
      {vendors && vendors.length > 0 ? (
        vendors.map((vendor: any) => (
          <Card key={vendor._id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Checkbox
                    checked={compareVendors.includes(vendor._id)}
                    onCheckedChange={() => toggleVendorComparison(vendor._id)}
                  />
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{vendor.name}</h3>
                      <Badge variant={getRiskBadgeVariant(vendor.riskLevel)}>{vendor.riskLevel} risk</Badge>
                      <Badge variant="outline">{vendor.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Contact: {vendor.contactName} ({vendor.contactEmail})
                    </p>
                    <p className="text-sm">
                      Contract: {new Date(vendor.contractStart).toLocaleDateString()} - {new Date(vendor.contractEnd).toLocaleDateString()}
                    </p>
                    <p className="text-sm font-medium">Value: ${vendor.contractValue.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <div className="text-2xl font-bold">{vendor.performanceScore}%</div>
                    <div className="text-xs text-muted-foreground">Performance</div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedVendor(vendor._id);
                      setPerformanceDialogOpen(true);
                    }}
                  >
                    Record Performance
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No vendors found. Add your first vendor to get started.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
