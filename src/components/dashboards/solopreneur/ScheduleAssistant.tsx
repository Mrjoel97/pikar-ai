import React, { useState, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Id } from "@/convex/_generated/dataModel";

interface ScheduleAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId?: Id<"businesses">;
  agentCadence?: "light" | "standard" | "aggressive";
  isGuest: boolean;
  onAddSlot: (slot: {
    label: string;
    when: string;
    channel: "Post" | "Email";
    scheduledAt?: number;
  }) => Promise<void>;
}

export function ScheduleAssistant({
  open,
  onOpenChange,
  businessId,
  agentCadence,
  isGuest,
  onAddSlot,
}: ScheduleAssistantProps) {
  const [channelFilter, setChannelFilter] = useState<"All" | "Post" | "Email">("All");
  const [addingAll, setAddingAll] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Array<{
    label: string;
    when: string;
    channel: "post" | "email";
    scheduledAt: number;
    reasoning: string;
  }> | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const suggestOptimalSlots = useAction(api.schedule.suggestOptimalSlots);

  // Load AI suggestions when dialog opens
  useEffect(() => {
    if (open && !isGuest && businessId && !aiSuggestions) {
      setLoadingSuggestions(true);
      suggestOptimalSlots({
        businessId,
        cadence: agentCadence,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
        .then((result) => {
          setAiSuggestions(result.slots);
          if (!result.aiGenerated) {
            toast.info("Using default suggestions (AI unavailable)");
          }
        })
        .catch(() => {
          toast.error("Failed to load AI suggestions");
        })
        .finally(() => {
          setLoadingSuggestions(false);
        });
    }
  }, [open, isGuest, businessId, aiSuggestions, agentCadence]);

  // Compute suggested schedule slots
  const suggestedSlots = React.useMemo(() => {
    if (aiSuggestions && aiSuggestions.length > 0) {
      return aiSuggestions.map(s => ({
        label: s.label,
        when: s.when,
        channel: s.channel === "post" ? "Post" : "Email" as "Post" | "Email",
        scheduledAt: s.scheduledAt,
        reasoning: s.reasoning,
      }));
    }

    // Fallback to default suggestions
    const now = new Date();
    const defaults: Array<{
      label: string;
      when: string;
      channel: "Post" | "Email";
      scheduledAt: number;
      reasoning?: string;
    }> = [];
    
    if (agentCadence === "aggressive") {
      for (let i = 0; i < 7; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() + i);
        d.setHours(9, 0, 0, 0);
        defaults.push({
          label: `Morning Post - Day ${i + 1}`,
          when: d.toLocaleString(),
          channel: "Post",
          scheduledAt: d.getTime(),
        });
      }
    } else if (agentCadence === "standard") {
      for (let i = 0; i < 3; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() + i * 2);
        d.setHours(10, 0, 0, 0);
        defaults.push({
          label: `Post - Day ${i * 2 + 1}`,
          when: d.toLocaleString(),
          channel: "Post",
          scheduledAt: d.getTime(),
        });
      }
    } else {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      d.setHours(11, 0, 0, 0);
      defaults.push({
        label: "Weekly Post",
        when: d.toLocaleString(),
        channel: "Post",
        scheduledAt: d.getTime(),
      });
    }

    return defaults;
  }, [aiSuggestions, agentCadence]);

  const filteredSuggested = suggestedSlots.filter(
    (s) => channelFilter === "All" || s.channel === channelFilter
  );

  const handleAddAllShown = async () => {
    if (isGuest || filteredSuggested.length === 0) return;
    
    setAddingAll(true);
    try {
      for (const slot of filteredSuggested) {
        await onAddSlot(slot);
      }
      toast.success(`Added ${filteredSuggested.length} slots`);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to add all slots");
    } finally {
      setAddingAll(false);
    }
  };

  const handleRefreshSuggestions = () => {
    if (!businessId) return;
    
    setAiSuggestions(null);
    setLoadingSuggestions(true);
    suggestOptimalSlots({
      businessId,
      cadence: agentCadence,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })
      .then((result) => {
        setAiSuggestions(result.slots);
        toast.success("Refreshed AI suggestions");
      })
      .catch(() => toast.error("Failed to refresh"))
      .finally(() => setLoadingSuggestions(false));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Assistant</DialogTitle>
          <DialogDescription>
            {loadingSuggestions 
              ? "AI is analyzing optimal posting times for your audience..."
              : aiSuggestions 
              ? "AI-powered suggestions based on engagement patterns and best practices"
              : "Suggested posting times based on your cadence settings"}
          </DialogDescription>
        </DialogHeader>
        
        {loadingSuggestions ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <span className="ml-3 text-sm text-muted-foreground">Generating optimal schedule...</span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Label>Filter by channel:</Label>
              <div className="flex gap-2">
                {(["All", "Post", "Email"] as const).map((ch) => (
                  <Button
                    key={ch}
                    size="sm"
                    variant={channelFilter === ch ? "default" : "outline"}
                    onClick={() => setChannelFilter(ch)}
                  >
                    {ch}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredSuggested.map((slot, idx) => (
                <Card key={idx} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={slot.channel === "Email" ? "default" : "secondary"}>
                          {slot.channel}
                        </Badge>
                        <span className="font-medium">{slot.label}</span>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        📅 {slot.when}
                      </div>
                      {slot.reasoning && (
                        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                          💡 <strong>Why this time:</strong> {slot.reasoning}
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onAddSlot(slot)}
                      disabled={isGuest}
                    >
                      Add
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleAddAllShown}
                disabled={isGuest || addingAll || filteredSuggested.length === 0}
              >
                {addingAll ? "Adding..." : `Add All Shown (${filteredSuggested.length})`}
              </Button>
              {aiSuggestions && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshSuggestions}
                >
                  🔄 Refresh Suggestions
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}