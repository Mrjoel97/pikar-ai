import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

interface CommunicationHubProps {
  businessId: Id<"businesses">;
}

export function CommunicationHub({ businessId }: CommunicationHubProps) {
  const [message, setMessage] = useState("");
  const [selectedStakeholders, setSelectedStakeholders] = useState<string[]>([]);

  const activeAlerts = useQuery(api.crisisManagement.getActiveAlerts, { businessId });
  const templates = useQuery(api.crisisManagement.getCrisisTemplates, { businessId });
  const notifyStakeholders = useMutation(api.crisisManagement.notifyStakeholders);

  const stakeholderGroups = [
    "Executive Team",
    "PR Team",
    "Legal",
    "Customer Support",
    "Engineering",
    "Sales Team",
  ];

  const handleNotify = async () => {
    if (!activeAlerts?.[0] || selectedStakeholders.length === 0) {
      toast.error("Select stakeholders to notify");
      return;
    }

    try {
      await notifyStakeholders({
        businessId,
        alertId: activeAlerts[0].id,
        stakeholders: selectedStakeholders,
        message,
      });
      toast.success("Stakeholders notified");
      setMessage("");
      setSelectedStakeholders([]);
    } catch (error: any) {
      toast.error(error.message || "Failed to notify stakeholders");
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Communication Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {templates?.map((template: any) => (
              <div key={template.type} className="border rounded-lg p-3">
                <h4 className="font-medium text-sm mb-2 capitalize">
                  {template.type.replace(/_/g, " ")}
                </h4>
                <p className="text-sm text-muted-foreground mb-2">{template.template}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setMessage(template.template)}
                >
                  Use Template
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notify Stakeholders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Stakeholders</label>
              <div className="space-y-2">
                {stakeholderGroups.map((group) => (
                  <div key={group} className="flex items-center space-x-2">
                    <Checkbox
                      id={group}
                      checked={selectedStakeholders.includes(group)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedStakeholders([...selectedStakeholders, group]);
                        } else {
                          setSelectedStakeholders(
                            selectedStakeholders.filter((s) => s !== group)
                          );
                        }
                      }}
                    />
                    <label htmlFor={group} className="text-sm cursor-pointer">
                      {group}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Message</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter crisis communication message..."
                rows={6}
              />
            </div>

            <Button onClick={handleNotify} className="w-full">
              Send Notification
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
