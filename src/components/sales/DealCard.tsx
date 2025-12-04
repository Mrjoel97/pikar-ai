import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Calendar, TrendingUp } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface Deal {
  _id: Id<"crmDeals">;
  name: string;
  value?: number;
  stage: string;
  contactName?: string;
  contactEmail?: string;
  closeDate?: number;
  probability?: number;
  updatedAt: number;
}

interface DealCardProps {
  deal: Deal;
  businessId: Id<"businesses">;
  userId: Id<"users">;
}

export function DealCard({ deal }: DealCardProps) {
  const getProbabilityColor = (prob: number) => {
    if (prob >= 75) return "text-green-600";
    if (prob >= 50) return "text-yellow-600";
    if (prob >= 25) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4 space-y-2">
        <div className="font-semibold text-sm truncate">{deal.name}</div>
        
        {deal.contactName && (
          <div className="text-xs text-muted-foreground truncate">
            {deal.contactName}
          </div>
        )}

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            <span className="font-medium">
              {deal.value ? `$${(deal.value / 1000).toFixed(0)}K` : "N/A"}
            </span>
          </div>
          
          {deal.probability !== undefined && (
            <div className={`flex items-center gap-1 ${getProbabilityColor(deal.probability)}`}>
              <TrendingUp className="h-3 w-3" />
              <span className="font-medium">{deal.probability}%</span>
            </div>
          )}
        </div>

        {deal.closeDate && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{new Date(deal.closeDate).toLocaleDateString()}</span>
          </div>
        )}

        <Badge variant="outline" className="text-xs">
          {deal.stage}
        </Badge>
      </CardContent>
    </Card>
  );
}
