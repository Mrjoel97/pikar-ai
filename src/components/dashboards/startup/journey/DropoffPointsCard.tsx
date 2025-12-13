import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle } from "lucide-react";

interface DropoffPoint {
  from: string;
  to: string;
  entered: number;
  dropoffRate: number;
  severity: string;
}

interface DropoffPointsCardProps {
  dropoffPoints: DropoffPoint[];
}

export function DropoffPointsCard({ dropoffPoints }: DropoffPointsCardProps) {
  if (!dropoffPoints || dropoffPoints.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Critical Drop-off Points
        </CardTitle>
        <CardDescription>
          Stages with significant customer drop-off (greater than 20%)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {dropoffPoints.map((dropoff, idx) => (
          <div key={idx} className="p-4 border rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-semibold">
                {dropoff.from} → {dropoff.to}
              </div>
              <Badge variant={
                dropoff.severity === "high" ? "destructive" : 
                dropoff.severity === "medium" ? "default" : "secondary"
              }>
                {dropoff.dropoffRate}% drop-off
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {dropoff.entered} contacts entered this transition
            </div>
            <Progress value={100 - dropoff.dropoffRate} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
