import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Play, Pause, BarChart3, Code, Settings } from "lucide-react";

interface CustomApiBuilderProps {
  businessId: Id<"businesses">;
  userId: Id<"users">;
}

export function CustomApiBuilder({ businessId, userId }: CustomApiBuilderProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedApi, setSelectedApi] = useState<any>(null);

  const apis = useQuery(api.customApis.listCustomApis, { businessId });
  const analytics = useQuery(api.customApis.getApiAnalytics, { businessId });
  const createApi = useMutation(api.customApis.createCustomApi);
  const updateApi = useMutation(api.customApis.updateCustomApi);
  const deleteApi = useMutation(api.customApis.deleteCustomApi);
  const toggleStatus = useMutation(api.customApis.toggleApiStatus);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    path: "/api/custom/",
    method: "GET" as "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    authentication: "api_key" as "none" | "api_key" | "bearer_token",
    requestSchema: "",
    responseSchema: "",
    handlerType: "query" as "query" | "mutation" | "action",
    functionRef: "",
    paramMapping: "",
    rateLimitEnabled: false,
    rateLimitRpm: 60,
    isActive: true,
  });

  const handleCreate = async () => {
    try {
      await createApi({
        businessId,
        name: formData.name,
        description: formData.description || undefined,
        path: formData.path,
        method: formData.method,
        authentication: formData.authentication,
        requestSchema: formData.requestSchema || undefined,
        responseSchema: formData.responseSchema || undefined,
        handler: {
          type: formData.handlerType,
          functionRef: formData.functionRef,
          paramMapping: formData.paramMapping || undefined,
        },
        rateLimit: formData.rateLimitEnabled
          ? { enabled: true, requestsPerMinute: formData.rateLimitRpm }
          : undefined,
        isActive: formData.isActive,
        createdBy: userId,
      });

      toast.success("Custom API created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to create API");
    }
  };

  const handleDelete = async (apiId: Id<"customApis">) => {
    if (!confirm("Are you sure you want to delete this API endpoint?")) return;

    try {
      await deleteApi({ apiId, userId });
      toast.success("API deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete API");
    }
  };

  const handleToggleStatus = async (apiId: Id<"customApis">, isActive: boolean) => {
    try {
      await toggleStatus({ apiId, isActive: !isActive });
      toast.success(`API ${!isActive ? "activated" : "deactivated"}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to toggle API status");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      path: "/api/custom/",
      method: "GET",
      authentication: "api_key",
      requestSchema: "",
      responseSchema: "",
      handlerType: "query",
      functionRef: "",
      paramMapping: "",
      rateLimitEnabled: false,
      rateLimitRpm: 60,
      isActive: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Analytics */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Custom API Builder</h2>
          <p className="text-sm text-muted-foreground">
            Create and manage custom API endpoints for your business
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New API Endpoint
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Custom API Endpoint</DialogTitle>
              <DialogDescription>
                Define a new API endpoint that maps to your Convex functions
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="handler">Handler</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">API Name</Label>
                  <Input
                    id="name"
                    placeholder="My Custom API"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What does this API do?"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="method">HTTP Method</Label>
                    <Select
                      value={formData.method}
                      onValueChange={(value: any) => setFormData({ ...formData, method: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                        <SelectItem value="PATCH">PATCH</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="path">Path</Label>
                    <Input
                      id="path"
                      placeholder="/api/custom/my-endpoint"
                      value={formData.path}
                      onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="authentication">Authentication</Label>
                  <Select
                    value={formData.authentication}
                    onValueChange={(value: any) => setFormData({ ...formData, authentication: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="api_key">API Key</SelectItem>
                      <SelectItem value="bearer_token">Bearer Token</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="handler" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="handlerType">Handler Type</Label>
                  <Select
                    value={formData.handlerType}
                    onValueChange={(value: any) => setFormData({ ...formData, handlerType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="query">Query (Read)</SelectItem>
                      <SelectItem value="mutation">Mutation (Write)</SelectItem>
                      <SelectItem value="action">Action (External)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="functionRef">Function Reference</Label>
                  <Input
                    id="functionRef"
                    placeholder="workflows.listWorkflows"
                    value={formData.functionRef}
                    onChange={(e) => setFormData({ ...formData, functionRef: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: module.functionName (e.g., workflows.listWorkflows)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paramMapping">Parameter Mapping (JSON)</Label>
                  <Textarea
                    id="paramMapping"
                    placeholder='{"businessId": "$.body.businessId"}'
                    value={formData.paramMapping}
                    onChange={(e) => setFormData({ ...formData, paramMapping: e.target.value })}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Map request parameters to function arguments using JSON path
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="requestSchema">Request Schema (JSON Schema)</Label>
                  <Textarea
                    id="requestSchema"
                    placeholder='{"type": "object", "properties": {...}}'
                    value={formData.requestSchema}
                    onChange={(e) => setFormData({ ...formData, requestSchema: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responseSchema">Response Schema (JSON Schema)</Label>
                  <Textarea
                    id="responseSchema"
                    placeholder='{"type": "object", "properties": {...}}'
                    value={formData.responseSchema}
                    onChange={(e) => setFormData({ ...formData, responseSchema: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="rateLimit">Enable Rate Limiting</Label>
                    <Switch
                      id="rateLimit"
                      checked={formData.rateLimitEnabled}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, rateLimitEnabled: checked })
                      }
                    />
                  </div>

                  {formData.rateLimitEnabled && (
                    <div className="space-y-2">
                      <Label htmlFor="rateLimitRpm">Requests per Minute</Label>
                      <Input
                        id="rateLimitRpm"
                        type="number"
                        value={formData.rateLimitRpm}
                        onChange={(e) =>
                          setFormData({ ...formData, rateLimitRpm: parseInt(e.target.value) || 60 })
                        }
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive">Active on Creation</Label>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create API</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total APIs</CardTitle>
              <Code className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalApis}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.activeApis} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalCalls.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Across all endpoints
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Endpoints</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.activeApis}</div>
              <p className="text-xs text-muted-foreground">
                Ready to receive requests
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* API List */}
      <Card>
        <CardHeader>
          <CardTitle>API Endpoints</CardTitle>
          <CardDescription>Manage your custom API endpoints</CardDescription>
        </CardHeader>
        <CardContent>
          {!apis || apis.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Code className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No custom APIs yet. Create your first endpoint to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {apis.map((api: any) => (
                <div
                  key={api._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={api.method === "GET" ? "default" : "secondary"}>
                        {api.method}
                      </Badge>
                      <code className="text-sm font-mono">{api.path}</code>
                      {api.isActive ? (
                        <Badge variant="outline" className="border-green-300 text-green-700">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-gray-300 text-gray-700">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-medium">{api.name}</h4>
                    {api.description && (
                      <p className="text-sm text-muted-foreground">{api.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Calls: {api.callCount || 0}</span>
                      <span>Auth: {api.authentication}</span>
                      {api.lastCalledAt && (
                        <span>Last called: {new Date(api.lastCalledAt).toLocaleString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleStatus(api._id, api.isActive)}
                    >
                      {api.isActive ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
