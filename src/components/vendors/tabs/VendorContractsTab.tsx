import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface VendorContractsTabProps {
  contractTimeline: any;
}

export function VendorContractsTab({ contractTimeline }: VendorContractsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contract Timeline</CardTitle>
        <CardDescription>Active contracts and renewal status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {contractTimeline?.map((contract: any) => (
            <div key={contract.vendorId} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{contract.vendorName}</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(contract.contractStart).toLocaleDateString()} - {new Date(contract.contractEnd).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={contract.status === "expiring" ? "destructive" : contract.status === "warning" ? "default" : "secondary"}>
                  {contract.remainingDays} days left
                </Badge>
              </div>
              <Progress value={contract.progress} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
