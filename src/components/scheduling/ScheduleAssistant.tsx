import React, { useState } from "react";
import { useAction, useQuery, useMutation } from "convex/react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, TrendingUp, Sparkles } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface ScheduleAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: Id<"businesses">;
}

export function ScheduleAssistant({
  open,
  onOpenChange,
  businessId,
}: ScheduleAssistantProps) {
  const [duration, setDuration] = useState(30);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const suggestMeetingTimes = useAction(api.scheduling.assistant.suggestMeetingTimes);
  const analyzePatterns = useAction(api.scheduling.assistant.analyzeSchedulingPatterns);
  const createAppointment = useMutation(api.scheduling.availability.createAppointment);

  const handleGetSuggestions = async () => {
    setLoading(true);
    try {
      const result = await suggestMeetingTimes({
        businessId,
        duration,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      setSuggestions(result.suggestions);
      toast.success("Found optimal meeting times");
    } catch (error) {
      toast.error("Failed to get suggestions");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const result = await analyzePatterns({ businessId });
      setInsights(result);
      toast.success("Analysis complete");
    } catch (error) {
      toast.error("Failed to analyze patterns");
    } finally {
      setLoading(false);
    }
  };

  const handleBookSlot = async (slot: any) => {
    try {
      await createAppointment({
        businessId,
        title: "New Meeting",
        startTime: slot.startTime,
        endTime: slot.endTime,
        type: "meeting",
      });
      toast.success("Meeting slot booked");
      setSuggestions(suggestions.filter(s => s.startTime !== slot.startTime));
    } catch (error) {
      toast.error("Failed to book slot");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            AI Schedule Assistant
          </DialogTitle>
          <DialogDescription>
            Get AI-powered scheduling suggestions and insights
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="suggestions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="suggestions">
              <Calendar className="h-4 w-4 mr-2" />
              Find Time
            </TabsTrigger>
            <TabsTrigger value="insights">
              <TrendingUp className="h-4 w-4 mr-2" />
              Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="suggestions" className="space-y-4">
            <Card className="p-4">
              <div className="space-y-4">
                <div>
                  <Label>Meeting Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    min={15}
                    max={240}
                    step={15}
                  />
                </div>
                <Button
                  onClick={handleGetSuggestions}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Finding optimal times..." : "Get AI Suggestions"}
                </Button>
              </div>
            </Card>

            {suggestions.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Suggested Times</h3>
                {suggestions.map((slot, idx) => (
                  <Card key={idx} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{slot.label}</span>
                          <Badge variant="secondary">Score: {slot.score}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(slot.startTime).toLocaleString()} - {new Date(slot.endTime).toLocaleTimeString()}
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleBookSlot(slot)}>
                        Book
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <Button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Analyzing..." : "Analyze My Schedule"}
            </Button>

            {insights && (
              <div className="space-y-3">
                <h3 className="font-semibold">Scheduling Insights</h3>
                {insights.insights.map((insight: any, idx: number) => (
                  <Card key={idx} className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium">{insight.title}</h4>
                        <Badge variant="outline">{insight.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {insight.description}
                      </p>
                      <div className="bg-emerald-50 dark:bg-emerald-950 p-3 rounded-md">
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                          💡 {insight.recommendation}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
