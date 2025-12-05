import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign } from "lucide-react";
import { DealCard } from "./DealCard";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface PipelineBoardProps {
  businessId: Id<"businesses">;
  userId: Id<"users">;
}

export function PipelineBoard({ businessId, userId }: PipelineBoardProps) {
  const pipelineData = useQuery(api.sales.pipeline.getPipelineDeals, { businessId });
  const metrics = useQuery(api.sales.pipeline.getPipelineMetrics, { businessId });
  const createDeal = useMutation(api.sales.pipeline.createDeal);
  const updateStage = useMutation(api.sales.pipeline.updateDealStage);

  const [showNewDeal, setShowNewDeal] = useState(false);
  const [newDeal, setNewDeal] = useState({
    name: "",
    value: 0,
    stage: "Lead",
    contactName: "",
    contactEmail: "",
    probability: 10,
  });

  const handleCreateDeal = async () => {
    if (!newDeal.name || newDeal.value <= 0) {
      toast.error("Please fill in deal name and value");
      return;
    }

    try {
      await createDeal({
        businessId,
        ownerId: userId,
        ...newDeal,
      });
      toast.success("Deal created successfully");
      setShowNewDeal(false);
      setNewDeal({ name: "", value: 0, stage: "Lead", contactName: "", contactEmail: "", probability: 10 });
    } catch (error) {
      toast.error("Failed to create deal");
    }
  };

  const handleDragStart = (e: React.DragEvent, dealId: Id<"crmDeals">) => {
    e.dataTransfer.setData("dealId", dealId);
  };

  const handleDrop = async (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData("dealId") as Id<"crmDeals">;
    
    const probabilityMap: Record<string, number> = {
      "Lead": 10,
      "Qualified": 25,
      "Proposal": 50,
      "Negotiation": 75,
      "Closed Won": 100,
      "Closed Lost": 0,
    };

    try {
      await updateStage({
        dealId,
        newStage,
        probability: probabilityMap[newStage],
        userId,
      });
      toast.success(`Deal moved to ${newStage}`);
    } catch (error) {
      toast.error("Failed to update deal");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  if (!pipelineData || !metrics) {
    return <div>Loading pipeline...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Metrics Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalActiveDeals}</div>
            <p className="text-xs text-muted-foreground">In pipeline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(metrics.totalActivePipelineValue / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground">Total potential</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Weighted Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(metrics.weightedPipelineValue / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground">Probability adjusted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.winRate.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">{metrics.wonDealsCount} won / {metrics.lostDealsCount} lost</p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Board */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sales Pipeline</h2>
        <Button onClick={() => setShowNewDeal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Deal
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {pipelineData.stages.map((stage: any) => {
          const stageDeals = pipelineData.deals?.filter((d: any) => d.stage === stage) || [];
          const stageValue = stageDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0);

          return (
            <div
              key={stage}
              className="space-y-2"
              onDrop={(e) => handleDrop(e, stage)}
              onDragOver={handleDragOver}
            >
              <Card className="bg-muted/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">{stage}</CardTitle>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{stageDeals.length} deals</span>
                    <span className="flex items-center">
                      <DollarSign className="h-3 w-3" />
                      {(stageValue / 1000).toFixed(0)}K
                    </span>
                  </div>
                </CardHeader>
              </Card>

              <div className="space-y-2 min-h-[200px]">
                  {stageDeals.map((deal: any) => (
                  <div
                    key={deal._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, deal._id)}
                    className="cursor-move"
                  >
                    <DealCard deal={deal} businessId={businessId} userId={userId} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Deal Dialog */}
      <Dialog open={showNewDeal} onOpenChange={setShowNewDeal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Deal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Deal Name</Label>
              <Input
                value={newDeal.name}
                onChange={(e) => setNewDeal({ ...newDeal, name: e.target.value })}
                placeholder="Acme Corp - Enterprise Plan"
              />
            </div>
            <div>
              <Label>Deal Value ($)</Label>
              <Input
                type="number"
                value={newDeal.value}
                onChange={(e) => setNewDeal({ ...newDeal, value: Number(e.target.value) })}
                placeholder="50000"
              />
            </div>
            <div>
              <Label>Contact Name</Label>
              <Input
                value={newDeal.contactName}
                onChange={(e) => setNewDeal({ ...newDeal, contactName: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label>Contact Email</Label>
              <Input
                type="email"
                value={newDeal.contactEmail}
                onChange={(e) => setNewDeal({ ...newDeal, contactEmail: e.target.value })}
                placeholder="john@acme.com"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateDeal} className="flex-1">Create Deal</Button>
              <Button variant="outline" onClick={() => setShowNewDeal(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}