import { useState } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Tag, Activity, TrendingUp, AlertCircle, Sparkles, Download, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

type Segments = {
  total: number;
  byStatus: Record<string, number>;
  byTag: Record<string, number>;
  engagementSegments: Record<string, number>;
};

export function CustomerSegmentation({ businessId }: { businessId: Id<"businesses"> }) {
  const segments = useQuery(api.contacts.getContactSegments as any, { businessId }) as
    | Segments
    | undefined
    | null;

  const customSegments = useQuery(api.customerSegmentationData.listSegments as any, { businessId }) as any[] | undefined;
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
    selected
      ? {
          businessId,
          segmentType: selected.type,
          segmentValue: selected.value,
        }
      : undefined
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

  const handleExport = () => {
    if (!contacts) return;
    const csv = [
      ["Name", "Email", "Status", "Tags", "Last Engaged"].join(","),
      ...contacts.map((c: any) =>
        [
          c.name || "",
          c.email,
          c.status,
          (c.tags || []).join(";"),
          c.lastEngagedAt ? new Date(c.lastEngagedAt).toLocaleDateString() : "Never",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `segment-${selected?.value}-${Date.now()}.csv`;
    a.click();
    toast.success("Segment exported!");
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
            {/* Totals */}
            <div className="text-center p-4 border rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
              <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{segments.total}</div>
              <div className="text-sm text-emerald-600 dark:text-emerald-400">Total Contacts</div>
            </div>

            {/* Status */}
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                By Status
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(segments.byStatus).map(([status, count]) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={selected?.type === "status" && selected?.value === status ? "default" : "outline"}
                    onClick={() => setSelected({ type: "status", value: status })}
                  >
                    {status}: {count}
                  </Button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                By Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(segments.byTag).map(([tag, count]) => (
                  <Badge
                    key={tag}
                    variant={selected?.type === "tag" && selected?.value === tag ? "default" : "secondary"}
                    className="cursor-pointer hover:bg-secondary/80"
                    onClick={() => setSelected({ type: "tag", value: tag })}
                  >
                    {tag} ({count})
                  </Badge>
                ))}
              </div>
            </div>

            {/* Engagement */}
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Engagement Level
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.entries(segments.engagementSegments).map(([level, count]) => (
                  <div
                    key={level}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selected?.type === "engagement" && selected?.value === level
                        ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-500"
                        : "hover:bg-accent"
                    }`}
                    onClick={() => setSelected({ type: "engagement", value: level })}
                  >
                    <div className="text-sm text-muted-foreground capitalize">{level}</div>
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {Math.round((count / segments.total) * 100)}% of total
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected segment details */}
            {selected && contacts && (
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">
                    {selected.type}: {selected.value} ({contacts.length})
                  </h3>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleGetRecommendations}>
                      <Sparkles className="h-4 w-4 mr-1" />
                      Get Recommendations
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleExport}>
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setSelected(null)}>
                      Clear
                    </Button>
                  </div>
                </div>

                {recommendations.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Recommended Actions
                    </h4>
                    {recommendations.map((rec, idx) => (
                      <div key={idx} className="border-l-2 border-blue-500 pl-3 py-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={rec.priority === "high" ? "destructive" : "secondary"}>
                            {rec.priority}
                          </Badge>
                          <span className="font-medium">{rec.action}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">
                          Expected: {rec.expectedImpact}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {contacts.map((c: any) => (
                    <div
                      key={String(c._id)}
                      className="flex items-center justify-between p-3 border rounded hover:bg-accent transition-colors"
                    >
                      <div>
                        <div className="font-medium">{c.name || c.email}</div>
                        <div className="text-xs text-muted-foreground">{c.email}</div>
                        {c.tags && c.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {c.tags.map((tag: string) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <Badge variant="outline">{c.status}</Badge>
                    </div>
                  ))}
                  {contacts.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      No contacts found for this segment.
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            {customSegments && customSegments.length > 0 ? (
              <div className="grid gap-3">
                {customSegments.map((seg: any) => (
                  <div
                    key={seg._id}
                    className="border rounded-lg p-4 hover:bg-accent transition-colors"
                    style={{ borderLeftColor: seg.color, borderLeftWidth: "4px" }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{seg.name}</h4>
                        <p className="text-sm text-muted-foreground">{seg.description}</p>
                        <div className="flex gap-2 mt-2">
                          {seg.criteria.engagement && (
                            <Badge variant="secondary">Engagement: {seg.criteria.engagement}</Badge>
                          )}
                          {seg.criteria.status && <Badge variant="secondary">Status: {seg.criteria.status}</Badge>}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteSegment(seg._id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No custom segments yet. Create one to get started!
              </div>
            )}
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            {aiInsights ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border rounded-lg p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    AI Analysis
                  </h4>
                  <pre className="text-sm whitespace-pre-wrap font-mono">{aiInsights}</pre>
                </div>

                {aiSegments.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Suggested Segments</h4>
                    <div className="grid gap-3">
                      {aiSegments.map((seg: any, idx: number) => (
                        <div
                          key={idx}
                          className="border rounded-lg p-4"
                          style={{ borderLeftColor: seg.color, borderLeftWidth: "4px" }}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="font-medium">{seg.name}</h5>
                              <p className="text-sm text-muted-foreground">{seg.description}</p>
                              <div className="text-sm mt-2">
                                <Badge variant="secondary">{seg.count} contacts</Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Click "AI Analyze" to generate insights about your customer segments.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}