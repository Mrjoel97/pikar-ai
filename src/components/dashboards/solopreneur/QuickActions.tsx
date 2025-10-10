import React from "react";
import { useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, FileText, Calendar, Zap } from "lucide-react";

interface QuickActionsProps {
  businessId: Id<"businesses">;
  onNewsletter?: () => void;
  onSocialPost?: () => void;
  onInvoice?: () => void;
}

export function QuickActions({
  businessId,
  onNewsletter,
  onSocialPost,
  onInvoice,
}: QuickActionsProps) {
  const navigate = useNavigate();
  const nextEmailSlot = useQuery(api.schedule.nextSlotByChannel, {
    channel: "email",
    businessId,
  });

  const actions = [
    {
      label: "Send Newsletter",
      icon: Mail,
      onClick: onNewsletter || (() => navigate("/workflows")),
      description: nextEmailSlot
        ? `Next slot: ${new Date(nextEmailSlot.scheduledAt).toLocaleString()}`
        : "No upcoming slot",
    },
    {
      label: "Create Social Post",
      icon: Zap,
      onClick: onSocialPost || (() => navigate("/workflows")),
      description: "Quick social media post",
    },
    {
      label: "Generate Invoice",
      icon: FileText,
      onClick: onInvoice || (() => navigate("/workflows")),
      description: "Create and send invoice",
    },
    {
      label: "Schedule Content",
      icon: Calendar,
      onClick: () => navigate("/workflows"),
      description: "Plan your content calendar",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto flex-col items-start p-4 text-left"
                onClick={action.onClick}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4" />
                  <span className="font-semibold">{action.label}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {action.description}
                </span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
