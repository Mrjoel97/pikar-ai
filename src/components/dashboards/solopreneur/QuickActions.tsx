import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

interface QuickActionsProps {
  businessId?: Id<"businesses">;
  isGuest: boolean;
  onUpgrade?: () => void;
  nextPostSlot?: any;
  nextSocialPost?: any[];
  socialAnalytics?: any[];
  onQuickPost?: () => void;
  onOpenSchedule?: () => void;
  onGenerateSocial?: () => void;
  generatingSocial?: boolean;
  onRepurposeBlog?: () => void;
}

export function QuickActions({
  businessId,
  isGuest,
  onUpgrade,
  nextPostSlot,
  nextSocialPost,
  socialAnalytics,
  onQuickPost,
  onOpenSchedule,
  onGenerateSocial,
  generatingSocial,
  onRepurposeBlog,
}: QuickActionsProps) {
  const handleQuickAction = (action: string) => {
    if (isGuest) {
      alert("Sign in to use this action");
      onUpgrade?.();
      return;
    }
    
    if (action === "Social Media") {
      onGenerateSocial?.();
      return;
    }
    
    alert(`${action} coming soon`);
  };

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">Create Post</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Draft and publish content to engage your audience.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleQuickAction("Create Post")}
              >
                Start
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (nextPostSlot && (nextPostSlot as any).scheduledAt) {
                    toast(
                      `Post scheduled placeholder for ${new Date((nextPostSlot as any).scheduledAt).toLocaleString()}`,
                    );
                  } else {
                    toast(
                      "No upcoming Post slot; add one in Schedule Assistant",
                    );
                  }
                }}
                disabled={!businessId}
              >
                Use Next Slot
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onQuickPost}
                disabled={!businessId}
              >
                Schedule in 15m
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">Send Newsletter</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Reach subscribers with your latest update in minutes.
            </p>
            <Button
              size="sm"
              onClick={() => handleQuickAction("Send Newsletter")}
            >
              Compose
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">View Analytics</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Check what&apos;s working and what to optimize next.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickAction("View Analytics")}
            >
              Open
            </Button>
          </CardContent>
        </Card>

        {/* Social Media Card */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">Social Media</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Create and schedule social posts with AI assistance.
            </p>
            {nextSocialPost && nextSocialPost.length > 0 && (
              <div className="mb-3 p-2 bg-emerald-50 rounded text-xs">
                <div className="font-medium">Next Post:</div>
                <div className="text-muted-foreground truncate">
                  {nextSocialPost[0].content.substring(0, 50)}...
                </div>
                <div className="text-xs text-emerald-600 mt-1">
                  {nextSocialPost[0].scheduledAt && 
                    new Date(nextSocialPost[0].scheduledAt).toLocaleString()}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuickAction("Social Media")}
              >
                Create Post
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onRepurposeBlog}
                disabled={generatingSocial}
              >
                Repurpose Blog
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Simple Social Analytics Widget */}
      {socialAnalytics && socialAnalytics.length > 0 && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-3">Social Performance (Last 7 Days)</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-emerald-600">
                  {socialAnalytics.filter((p: any) => {
                    const postDate = new Date(p.scheduledAt || 0);
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    return postDate >= sevenDaysAgo;
                  }).length}
                </div>
                <div className="text-xs text-muted-foreground">Posts</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {socialAnalytics.reduce((acc: number, p: any) => 
                    acc + (p.platforms?.length || 0), 0
                  )}
                </div>
                <div className="text-xs text-muted-foreground">Platforms</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(socialAnalytics.length / 7 * 10) / 10}
                </div>
                <div className="text-xs text-muted-foreground">Avg/Day</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}