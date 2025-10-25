import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, TestTube, Eye, Copy, BarChart3, RefreshCw, Key } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useAuth } from "@/hooks/use-auth";

export default function WebhookManagementPage() {
  const { user } = useAuth();
  const business = useQuery(api.businesses.getByOwnerId, user ? { ownerId: user.id } : "skip");
  
  const [selectedWebhook, setSelectedWebhook] = useState<Id<"webhooks"> | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const webhooks = useQuery(
    api.webhooks.listWebhooks,
    business ? { businessId: business._id } : "skip"
  );

  const webhookAnalytics = useQuery(
    api.webhooks.getWebhookAnalytics,
    selectedWebhook ? { webhookId: selectedWebhook } : "skip"
  );

  const webhookDeliveries = useQuery(
    api.webhooks.getWebhookDeliveries,
    selectedWebhook ? { webhookId: selectedWebhook, limit: 50 } : "skip"
  );

  const webhookTemplates = useQuery(api.webhooks.getWebhookTemplates);

  const createWebhook = useMutation(api.webhooks.createWebhook);
  const deleteWebhook = useMutation(api.webhooks.deleteWebhook);
  const testWebhook = useMutation(api.webhooks.testWebhook);
  const retryDelivery = useMutation(api.webhooks.retryWebhookDelivery);

  const availableEvents = [
    "workflow.started",
    "workflow.completed",
    "workflow.failed",
    "campaign.sent",
    "approval.requested",
    "approval.completed",
  ];

  const handleCreateWebhook = async () => {
    if (!business || !newWebhookUrl || selectedEvents.length === 0) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await createWebhook({
        businessId: business._id,
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
      toast.success(result.message);
    } catch (error: any) {
      toast.error(error.message || "Failed to test webhook");
    }
  };

  const handleDeleteWebhook = async (webhookId: Id<"webhooks">) => {
    try {
      await deleteWebhook({ webhookId });
      toast.success("Webhook deleted");
      setSelectedWebhook(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete webhook");
    }
  };

  const handleRetryDelivery = async (deliveryId: Id<"webhookDeliveries">) => {
    try {
      await retryDelivery({ deliveryId });
      toast.success("Retry scheduled");
    } catch (error: any) {
      toast.error(error.message || "Failed to retry delivery");
    }
  };

  const selectedWebhookData = webhooks?.find(w => w._id === selectedWebhook);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Webhook Management</h1>
          <p className="text-muted-foreground mt-2">
            Configure webhooks with retry logic, signatures, and analytics
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Webhook List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Your Webhooks</CardTitle>
            <CardDescription>{webhooks?.length || 0} configured</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {webhooks?.map((webhook) => (
              <button
                key={webhook._id}
                onClick={() => setSelectedWebhook(webhook._id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedWebhook === webhook._id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm truncate">{webhook.url}</p>
                  <Badge variant={webhook.active ? "default" : "secondary"} className="ml-2">
                    {webhook.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-xs opacity-70">{webhook.events.length} events</p>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Webhook Details */}
        <Card className="lg:col-span-2">
          {selectedWebhookData ? (
            <Tabs defaultValue="overview" className="w-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="truncate">{selectedWebhookData.url}</CardTitle>
                    <CardDescription>{selectedWebhookData.events.length} events subscribed</CardDescription>
                  </div>
                  <TabsList>
                    <TabsTrigger value="overview">
                      <Eye className="h-4 w-4 mr-2" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="analytics">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Analytics
                    </TabsTrigger>
                    <TabsTrigger value="deliveries">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Deliveries
                    </TabsTrigger>
                    <TabsTrigger value="security">
                      <Key className="h-4 w-4 mr-2" />
                      Security
                    </TabsTrigger>
                  </TabsList>
                </div>
              </CardHeader>

              <CardContent>
                <TabsContent value="overview" className="space-y-4">
                  <div>
                    <Label>Subscribed Events</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedWebhookData.events.map((event) => (
                        <Badge key={event} variant="outline">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTestWebhook(selectedWebhookData._id)}
                      className="gap-2"
                    >
                      <TestTube className="h-4 w-4" />
                      Test Webhook
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteWebhook(selectedWebhookData._id)}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                  {webhookAnalytics && (
                    <>
                      <div className="grid grid-cols-4 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardDescription>Total</CardDescription>
                            <CardTitle className="text-2xl">{webhookAnalytics.totalDeliveries}</CardTitle>
                          </CardHeader>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardDescription>Success Rate</CardDescription>
                            <CardTitle className="text-2xl">{webhookAnalytics.successRate.toFixed(1)}%</CardTitle>
                          </CardHeader>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardDescription>Failed</CardDescription>
                            <CardTitle className="text-2xl">{webhookAnalytics.failed}</CardTitle>
                          </CardHeader>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardDescription>Avg Attempts</CardDescription>
                            <CardTitle className="text-2xl">{webhookAnalytics.avgAttempts.toFixed(1)}</CardTitle>
                          </CardHeader>
                        </Card>
                      </div>

                      <Card>
                        <CardHeader>
                          <CardTitle>Delivery Success Over Time</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={Object.entries(webhookAnalytics.deliveriesByDay).map(([date, data]) => ({ 
                              date, 
                              success: data.success, 
                              failed: data.failed 
                            }))}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Line type="monotone" dataKey="success" stroke="#10b981" strokeWidth={2} />
                              <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} />
                            </LineChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="deliveries" className="space-y-4">
                  <div className="space-y-2">
                    {webhookDeliveries?.map((delivery) => (
                      <Card key={delivery._id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant={
                                  delivery.status === "success" ? "default" :
                                  delivery.status === "failed" ? "destructive" :
                                  "secondary"
                                }>
                                  {delivery.status}
                                </Badge>
                                <span className="text-sm font-medium">{delivery.event}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(delivery.createdAt).toLocaleString()} • {delivery.attempts} attempts
                              </p>
                            </div>
                            {delivery.status === "failed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRetryDelivery(delivery._id)}
                                className="gap-2"
                              >
                                <RefreshCw className="h-4 w-4" />
                                Retry
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="security" className="space-y-4">
                  <div>
                    <Label>Webhook Secret</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        type="password"
                        value={selectedWebhookData.secret}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedWebhookData.secret);
                          toast.success("Secret copied to clipboard");
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Use this secret to verify webhook signatures
                    </p>
                  </div>

                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <p className="text-xs font-mono">
                      {`// Verify webhook signature (Node.js example)\nconst crypto = require('crypto');\n\nconst signature = req.headers['x-webhook-signature'];\nconst payload = JSON.stringify(req.body);\nconst secret = '${selectedWebhookData.secret}';\n\nconst expectedSignature = crypto\n  .createHmac('sha256', secret)\n  .update(payload)\n  .digest('hex');\n\nif (signature === expectedSignature) {\n  // Signature is valid\n}`}
                    </p>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          ) : (
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Select a webhook to view details and analytics
              </p>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Webhook Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Templates</CardTitle>
          <CardDescription>Quick start templates for common webhook configurations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {webhookTemplates?.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <CardDescription className="text-xs">{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {template.events.map((event) => (
                        <Badge key={event} variant="outline" className="text-xs">
                          {event}
                        </Badge>
                      ))}
                    </div>
                    <Button size="sm" variant="outline" className="w-full">
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}