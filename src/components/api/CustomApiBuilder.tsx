import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Activity, Code } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface CustomApiBuilderProps {
  businessId: Id<"businesses">;
}

export function CustomApiBuilder({ businessId }: CustomApiBuilderProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingApi, setEditingApi] = useState<any>(null);

  const apis = useQuery(api.customApis.listCustomApis, { businessId });
  const analytics = useQuery(api.customApis.getApiAnalytics, { businessId });
  const createApi = useMutation(api.customApis.createCustomApi);
  const updateApi = useMutation(api.customApis.updateCustomApi);
  const deleteApi = useMutation(api.customApis.deleteCustomApi);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    method: "GET" as "GET" | "POST" | "PUT" | "DELETE",
    path: "",
    convexFunction: "",
    requiresAuth: true,
    rateLimitEnabled: false,
    requestsPerMinute: 60,
    requestsPerHour: 1000,
  });

  const handleCreate = async () => {
    try {
      await createApi({
        businessId,
        name: formData.name,
        description: formData.description || undefined,
        method: formData.method,
        path: formData.path,
        convexFunction: formData.convexFunction,
        requiresAuth: formData.requiresAuth,
        rateLimit: formData.rateLimitEnabled ? {
          requestsPerMinute: formData.requestsPerMinute,
          requestsPerHour: formData.requestsPerHour,
        } : undefined,
      });
      toast.success("API endpoint created successfully");
      setShowCreateDialog(false);
      setFormData({
        name: "",
        description: "",
        method: "GET",
        path: "",
        convexFunction: "",
        requiresAuth: true,
        rateLimitEnabled: false,
        requestsPerMinute: 60,
        requestsPerHour: 1000,
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to create API endpoint");
    }
  };

  const handleUpdate = async (apiId: Id<"customApis">, updates: any) => {
    try {
      await updateApi({ apiId, ...updates });
      toast.success("API endpoint updated");
      setEditingApi(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to update API endpoint");
    }
  };

  const handleDelete = async (apiId: Id<"customApis">) => {
    if (!confirm("Are you sure you want to delete this API endpoint?")) return;
    try {
      await deleteApi({ apiId });
      toast.success("API endpoint deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete API endpoint");
    }
  };

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Total Calls</div>
                <div className="text-2xl font-bold">{analytics?.totalCalls || 0}</div>
              </div>
              <Activity className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Active Endpoints</div>
                <div className="text-2xl font-bold">{analytics?.activeEndpoints || 0}</div>
              </div>
              <Code className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Total Endpoints</div>
                <div className="text-2xl font-bold">{analytics?.totalEndpoints || 0}</div>
              </div>
              <Code className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Endpoints List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Custom API Endpoints</CardTitle>
              <CardDescription>Create and manage custom API endpoints for your business</CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Endpoint
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Custom API Endpoint</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="My Custom API"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="What does this API do?"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Method</Label>
                      <Select value={formData.method} onValueChange={(v: any) => setFormData({ ...formData, method: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                          <SelectItem value="DELETE">DELETE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Path</Label>
                      <Input
                        value={formData.path}
                        onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                        placeholder="/api/my-endpoint"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Convex Function</Label>
                    <Input
                      value={formData.convexFunction}
                      onChange={(e) => setFormData({ ...formData, convexFunction: e.target.value })}
                      placeholder="myModule:myFunction"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Requires Authentication</Label>
                    <Switch
                      checked={formData.requiresAuth}
                      onCheckedChange={(checked) => setFormData({ ...formData, requiresAuth: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Enable Rate Limiting</Label>
                    <Switch
                      checked={formData.rateLimitEnabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, rateLimitEnabled: checked })}
                    />
                  </div>
                  {formData.rateLimitEnabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Requests per Minute</Label>
                        <Input
                          type="number"
                          value={formData.requestsPerMinute}
                          onChange={(e) => setFormData({ ...formData, requestsPerMinute: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>Requests per Hour</Label>
                        <Input
                          type="number"
                          value={formData.requestsPerHour}
                          onChange={(e) => setFormData({ ...formData, requestsPerHour: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                    <Button onClick={handleCreate}>Create</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {apis?.map((api: any) => (
              <div key={api._id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={api.method === "GET" ? "outline" : "default"}>
                        {api.method}
                      </Badge>
                      <code className="text-sm font-mono">{api.path}</code>
                      {api.isActive ? (
                        <Badge variant="outline" className="border-green-300 text-green-700">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="border-gray-300 text-gray-700">Inactive</Badge>
                      )}
                    </div>
                    <h4 className="font-medium">{api.name}</h4>
                    {api.description && (
                      <p className="text-sm text-muted-foreground mt-1">{api.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Function: {api.convexFunction}</span>
                      <span>Calls: {api.totalCalls || 0}</span>
                      {api.requiresAuth && <span>🔒 Auth Required</span>}
                      {api.rateLimit && (
                        <span>⏱️ {api.rateLimit.requestsPerMinute}/min</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleUpdate(api._id, { isActive: !api.isActive })}
                    >
                      {api.isActive ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(api._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {(!apis || apis.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                No custom API endpoints yet. Create your first one to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
