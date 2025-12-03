import { useState } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Sparkles, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";
import { SegmentOverview } from "./segmentation/SegmentOverview";
import { SegmentDetails } from "./segmentation/SegmentDetails";
import { CustomSegments } from "./segmentation/CustomSegments";
import { AIInsights } from "./segmentation/AIInsights";

type Segments = {
  total: number;
  byStatus: Record<string, number>;
  byTag: Record<string, number>;
  engagementSegments: Record<string, number>;
};

export default function CustomerSegmentation({ businessId }: { businessId: Id<"businesses"> }) {
  const segments = useQuery(
    api.contacts.getContactSegments as any,
    businessId ? { businessId } : "skip"
  ) as
    | Segments
    | undefined
    | null;

  const customSegments = useQuery(
    api.customerSegmentationData.listSegments as any,
    businessId ? { businessId } : "skip"
  ) as any[] | undefined;
  const analyzeAction = useAction(api.customerSegmentation.analyzeCustomers);
  const recommendAction = useAction(api.customerSegmentation.recommendActions);
  const createSegmentMutation = useMutation(api.customerSegmentationData.createSegment);
  const deleteSegmentMutation = useMutation(api.customerSegmentationData.deleteSegment);

  const [selected, setSelected] = useState<{
    type: "status" | "tag" | "engagement";
    value: string;
  } | null>(null);

  const [aiInsights, setAiInsights] = useState<string>("");
  const [aiSegments, setAiSegments] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSegment, setNewSegment] = useState({
    name: "",
    description: "",
    engagement: "",
    color: "#3b82f6",
  });

  const contacts = useQuery(
    api.contacts.getContactsBySegment as any,
    selected && businessId
      ? {
          businessId,
          segmentType: selected.type,
          segmentValue: selected.value,
        }
      : "skip"
  ) as any[] | undefined | null;

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const result = await analyzeAction({ businessId, userId: businessId as any });
      setAiInsights(result.insights);
      setAiSegments(result.segments);
      toast.success("AI analysis complete!");
    } catch (error) {
      toast.error("Failed to analyze customers");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGetRecommendations = async () => {
    if (!selected) return;
    try {
      const recs = await recommendAction({
        businessId,
        segmentType: selected.type,
        segmentValue: selected.value,
      });
      setRecommendations(recs);
      toast.success("Recommendations generated!");
    } catch (error) {
      toast.error("Failed to get recommendations");
    }
  };

  const handleCreateSegment = async () => {
    try {
      await createSegmentMutation({
        businessId,
        name: newSegment.name,
        description: newSegment.description,
        criteria: {
          engagement: newSegment.engagement || undefined,
        },
        color: newSegment.color,
      });
      toast.success("Segment created!");
      setShowCreateDialog(false);
      setNewSegment({ name: "", description: "", engagement: "", color: "#3b82f6" });
    } catch (error) {
      toast.error("Failed to create segment");
    }
  };

  const handleDeleteSegment = async (segmentId: Id<"customerSegments">) => {
    try {
      await deleteSegmentMutation({ segmentId });
      toast.success("Segment deleted!");
    } catch (error) {
      toast.error("Failed to delete segment");
    }
  };

  if (!segments) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customer Segmentation
          </CardTitle>
        </CardHeader>
        <CardContent>Loading segments...</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customer Segmentation
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? <Sparkles className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              AI Analyze
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Create Segment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Custom Segment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Segment Name</label>
                    <Input
                      value={newSegment.name}
                      onChange={(e) => setNewSegment({ ...newSegment, name: e.target.value })}
                      placeholder="e.g., VIP Customers"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={newSegment.description}
                      onChange={(e) => setNewSegment({ ...newSegment, description: e.target.value })}
                      placeholder="Describe this segment..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Engagement Level</label>
                    <select
                      className="w-full border rounded p-2"
                      value={newSegment.engagement}
                      onChange={(e) => setNewSegment({ ...newSegment, engagement: e.target.value })}
                    >
                      <option value="">Any</option>
                      <option value="active">Active</option>
                      <option value="dormant">Dormant</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Color</label>
                    <Input
                      type="color"
                      value={newSegment.color}
                      onChange={(e) => setNewSegment({ ...newSegment, color: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleCreateSegment} className="w-full">
                    Create Segment
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="custom">Custom Segments</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <SegmentOverview
              segments={segments}
              selected={selected}
              onSelect={(type, value) => setSelected({ type, value })}
            />

            {selected && contacts && (
              <SegmentDetails
                selected={selected}
                contacts={contacts}
                recommendations={recommendations}
                onGetRecommendations={handleGetRecommendations}
                onClear={() => setSelected(null)}
              />
            )}
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <CustomSegments segments={customSegments || []} onDelete={handleDeleteSegment} />
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <AIInsights insights={aiInsights} segments={aiSegments} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}