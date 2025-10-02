import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DollarSign, Calendar, User } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface DealPipelineProps {
  businessId: Id<"businesses">;
}

const STAGES = [
  { id: "lead", name: "Lead", color: "bg-gray-500" },
  { id: "qualified", name: "Qualified", color: "bg-blue-500" },
  { id: "proposal", name: "Proposal", color: "bg-purple-500" },
  { id: "negotiation", name: "Negotiation", color: "bg-orange-500" },
  { id: "closed_won", name: "Closed Won", color: "bg-green-500" },
  { id: "closed_lost", name: "Closed Lost", color: "bg-red-500" },
];

export function DealPipeline({ businessId }: DealPipelineProps) {
  const deals = useQuery(api.crmIntegrations.listDeals, { businessId });
  const updateStage = useMutation(api.crmIntegrations.updateDealStage);
  const [dragging, setDragging] = useState<string | null>(null);

  const handleDragStart = (dealId: string) => {
    setDragging(dealId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (stage: string) => {
    if (!dragging) return;

    try {
      await updateStage({ dealId: dragging as Id<"crmDeals">, stage });
      toast.success("Deal stage updated");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update deal");
    } finally {
      setDragging(null);
    }
  };

  const getDealsByStage = (stage: string) => {
    return deals?.filter((deal: any) => deal.stage === stage) || [];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deal Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {STAGES.map((stage) => {
            const stageDeals = getDealsByStage(stage.id);
            const totalValue = stageDeals.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0);

            return (
              <div
                key={stage.id}
                className="space-y-2"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(stage.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                    <h3 className="font-medium text-sm">{stage.name}</h3>
                  </div>
                  <Badge variant="secondary">{stageDeals.length}</Badge>
                </div>

                <div className="text-xs text-muted-foreground mb-3">
                  {formatCurrency(totalValue)}
                </div>

                <div className="space-y-2 min-h-[200px] p-2 rounded bg-muted/30">
                  {stageDeals.map((deal: any) => (
                    <Card
                      key={deal._id}
                      draggable
                      onDragStart={() => handleDragStart(deal._id)}
                      className="cursor-move hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-3">
                        <h4 className="font-medium text-sm mb-2">{deal.name}</h4>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {formatCurrency(deal.value || 0)}
                          </div>
                          {deal.contactName && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {deal.contactName}
                            </div>
                          )}
                          {deal.closeDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(deal.closeDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
