import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Lightbulb, X, BookOpen } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface HelpCoachProps {
  userId?: Id<"users">;
  currentPage: string;
  tier: "solopreneur" | "startup" | "sme" | "enterprise";
}

export function HelpCoach({ userId, currentPage, tier }: HelpCoachProps) {
  const [selectedTip, setSelectedTip] = useState<any>(null);
  
  const tips = useQuery(
    api.helpCoach.assistant.getContextualTips,
    userId
      ? { currentPage, tier, userId }
      : { currentPage, tier }
  );

  const dismissTip = useMutation(api.helpCoach.assistant.dismissTip);
  const trackInteraction = useMutation(api.helpCoach.assistant.trackTipInteraction);

  const handleDismiss = async (tipId: Id<"helpTips">) => {
    if (!userId) return;
    await dismissTip({ userId, tipId });
    await trackInteraction({ userId, tipId, action: "dismissed" });
  };

  const handleTipClick = async (tip: any) => {
    setSelectedTip(tip);
    if (userId) {
      await trackInteraction({ userId, tipId: tip._id, action: "clicked" });
    }
  };

  if (tips === undefined) {
    return <div className="h-32 animate-pulse bg-muted/20 rounded-lg" />;
  }

  if (tips.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 text-sm text-muted-foreground text-center">
          <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>You're all caught up! Check back later for new tips.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tips.map((tip: any) => (
          <Card 
            key={tip._id} 
            className="border-emerald-200 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleTipClick(tip)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-emerald-600" />
                  <CardTitle className="text-sm font-medium">{tip.title}</CardTitle>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 -mt-1 -mr-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDismiss(tip._id);
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {tip.description}
              </p>
              {tip.category && (
                <Badge variant="outline" className="mt-2 text-xs">
                  {tip.category}
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedTip} onOpenChange={() => setSelectedTip(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-emerald-600" />
              {selectedTip?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {selectedTip?.description}
            </p>
            
            {selectedTip?.content && (
              <div className="prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: selectedTip.content }} />
              </div>
            )}

            {selectedTip?.actionUrl && (
              <Button className="w-full" asChild>
                <a href={selectedTip.actionUrl} target="_blank" rel="noopener noreferrer">
                  {selectedTip.actionLabel || "Learn More"}
                </a>
              </Button>
            )}

            {selectedTip?.relatedTutorialId && (
              <Button variant="outline" className="w-full" asChild>
                <a href={`/tutorials/${selectedTip.relatedTutorialId}`}>
                  <BookOpen className="w-4 h-4 mr-2" />
                  View Related Tutorial
                </a>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}