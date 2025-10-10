import React from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar, Loader2, Plus, Sparkles, Trash2, Undo } from "lucide-react";

interface ScheduleAssistantProps {
  businessId: Id<"businesses">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScheduleAssistant({ businessId, open, onOpenChange }: ScheduleAssistantProps) {
  const suggestOptimalSlots = useAction(api.schedule.suggestOptimalSlots);
  const addSlotsBulk = useMutation(api.schedule.addSlotsBulk);
  const deleteSlot = useMutation(api.schedule.deleteSlot);
  const listSlots = useQuery(api.schedule.listSlots, { businessId });
  const agentProfile = useQuery(api.agentProfile.getMyAgentProfile, { businessId });

  const [channelFilter, setChannelFilter] = React.useState<"all" | "email" | "post">("all");
  const [aiSuggestions, setAiSuggestions] = React.useState<any>(null);
  const [loadingSuggestions, setLoadingSuggestions] = React.useState(false);
  const [recentlyAdded, setRecentlyAdded] = React.useState<Id<"scheduleSlots">[]>([]);

  const handleGetSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const result = await suggestOptimalSlots({
        businessId,
        cadence: agentProfile?.cadence || "standard",
      });
      setAiSuggestions(result);
      toast.success("AI suggestions loaded");
    } catch (error) {
      toast.error("Failed to load AI suggestions");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleAddAllShown = async () => {
    if (!aiSuggestions?.slots) return;

    const filtered = channelFilter === "all"
      ? aiSuggestions.slots
      : aiSuggestions.slots.filter((s: any) => s.channel === channelFilter);

    try {
      const result = await addSlotsBulk({ slots: filtered });
      setRecentlyAdded(result.ids);
      toast.success(`Added ${result.count} slots`);
    } catch (error: any) {
      toast.error(error.message || "Failed to add slots");
    }
  };

  const handleUndo = async () => {
    try {
      for (const id of recentlyAdded) {
        await deleteSlot({ slotId: id });
      }
      setRecentlyAdded([]);
      toast.success("Undone");
    } catch (error) {
      toast.error("Failed to undo");
    }
  };

  const filteredSlots = React.useMemo(() => {
    if (!listSlots) return [];
    if (channelFilter === "all") return listSlots;
    return listSlots.filter((s: any) => s.channel === channelFilter);
  }, [listSlots, channelFilter]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Assistant
          </DialogTitle>
          <DialogDescription>
            Manage your content schedule with AI-powered optimal time suggestions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Select value={channelFilter} onValueChange={(v: any) => setChannelFilter(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="post">Post</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleGetSuggestions} disabled={loadingSuggestions} variant="outline">
              {loadingSuggestions ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Get AI Suggestions
            </Button>

            {aiSuggestions && (
              <Button onClick={handleAddAllShown} variant="default">
                <Plus className="mr-2 h-4 w-4" />
                Add All Shown
              </Button>
            )}

            {recentlyAdded.length > 0 && (
              <Button onClick={handleUndo} variant="outline" size="sm">
                <Undo className="mr-2 h-4 w-4" />
                Undo
              </Button>
            )}
          </div>

          {aiSuggestions && (
            <Card>
              <CardContent className="pt-4">
                <h3 className="font-semibold mb-3">AI Suggestions</h3>
                <div className="space-y-2">
                  {aiSuggestions.slots
                    ?.filter((s: any) => channelFilter === "all" || s.channel === channelFilter)
                    .map((slot: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{slot.channel}</Badge>
                            <span className="font-medium">{slot.label}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{slot.when}</p>
                          <p className="text-xs text-muted-foreground italic mt-1">{slot.reasoning}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div>
            <h3 className="font-semibold mb-3">Current Schedule ({filteredSlots.length} slots)</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {filteredSlots.map((slot: any) => (
                <div key={slot._id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{slot.channel}</Badge>
                      <span className="font-medium">{slot.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(slot.scheduledAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      try {
                        await deleteSlot({ slotId: slot._id });
                        toast.success("Slot deleted");
                      } catch (error) {
                        toast.error("Failed to delete slot");
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {filteredSlots.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No scheduled slots. Use AI suggestions to get started!
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
