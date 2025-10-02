import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, TestTube, Eye, Copy } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

export default function WebhookManagementPage() {
  const [selectedBusinessId, setSelectedBusinessId] = useState<Id<"businesses"> | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const webhooks = useQuery(
    api.webhooks.listWebhooks,
    selectedBusinessId ? { businessId: selectedBusinessId } : "skip"
  );

  const createWebhook = useMutation(api.webhooks.createWebhook);
  const deleteWebhook = useMutation(api.webhooks.deleteWebhook);
  const testWebhook = useMutation(api.webhooks.testWebhook);

  const availableEvents = [
    "workflow.started",
    "workflow.completed",
    "workflow.failed",
    "campaign.sent",
    "approval.requested",
    "approval.completed",
  ];

  const handleCreateWebhook = async () => {
    if (!selectedBusinessId || !newWebhookUrl || selectedEvents.length === 0) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await createWebhook({
        businessId: selectedBusinessId,
        url: newWebhookUrl,
        events: selectedEvents,
      });
      toast.success("Webhook created successfully");
      setIsCreateDialogOpen(false);
      setNewWebhookUrl("");
      setSelectedEvents([]);
    } catch (error: any) {
      toast.error(error.message || "Failed to create webhook");
    }
  };

  const handleTestWebhook = async (webhookId: Id<"webhooks">) => {
    try {
      const result = await testWebhook({ webhookId });
      if (result.success) {
        toast.success("Webhook test successful");
      } else {
        toast.error(`Webhook test failed: ${result.error || result.statusText}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to test webhook");
    }
  };

  const handleDeleteWebhook = async (webhookId: Id<"webhooks">) => {
    try {
      await deleteWebhook({ webhookId });
      toast.success("Webhook deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete webhook");
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Webhook Management</h1>
          <p className="text-muted-foreground mt-2">
            Configure webhooks to receive real-time notifications
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Webhook
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Webhook</DialogTitle>
              <DialogDescription>
                Configure a webhook endpoint to receive event notifications
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="url">Webhook URL</Label>
                <Input
                  id="url"
                  placeholder="https://your-domain.com/webhook"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                />
              </div>
              <div>
                <Label>Events to Subscribe</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {availableEvents.map((event) => (
                    <label key={event} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(event)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEvents([...selectedEvents, event]);
                          } else {
                            setSelectedEvents(selectedEvents.filter((e) => e !== event));
                          }
                        }}
                      />
                      <span className="text-sm">{event}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Button onClick={handleCreateWebhook} className="w-full">
                Create Webhook
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {webhooks?.map((webhook: any) => (
          <Card key={webhook._id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{webhook.url}</CardTitle>
                  <CardDescription className="mt-1">
                    {webhook.events.length} events subscribed
                  </CardDescription>
                </div>
                <Badge variant={webhook.active ? "default" : "secondary"}>
                  {webhook.active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Subscribed Events:</p>
                  <div className="flex flex-wrap gap-2">
                    {webhook.events.map((event: string) => (
                      <Badge key={event} variant="outline">
                        {event}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestWebhook(webhook._id)}
                    className="gap-2"
                  >
                    <TestTube className="h-4 w-4" />
                    Test
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View Deliveries
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteWebhook(webhook._id)}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {webhooks?.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No webhooks configured yet. Create your first webhook to get started.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
