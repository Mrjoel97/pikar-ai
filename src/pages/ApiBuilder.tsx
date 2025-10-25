import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Plus, Download, BarChart3, Code, Settings, Eye } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function ApiBuilderPage() {
  const { user } = useAuth();
  const business = useQuery(api.businesses.getByOwnerId, user ? { ownerId: user.id } : "skip");
  const apis = useQuery(api.customApis.listApis, business ? { businessId: business._id } : "skip");
  
  const [selectedApi, setSelectedApi] = useState<Id<"customApis"> | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [sdkLanguage, setSdkLanguage] = useState<"javascript" | "python" | "curl">("javascript");

  const apiAnalytics = useQuery(
    api.customApis.getApiAnalytics,
    selectedApi ? { apiId: selectedApi } : "skip"
  );

  const apiDocs = useQuery(
    api.customApis.getApiDocs,
    selectedApi ? { apiId: selectedApi } : "skip"
  );

  const generateSdk = useMutation(api.apiSdk.generateSdk);
  const createApi = useMutation(api.customApis.createApi);
  const updateApi = useMutation(api.customApis.updateApi);

  const handleGenerateSdk = async () => {
    if (!selectedApi) return;
    
    try {
      const sdk = await generateSdk({ apiId: selectedApi, language: sdkLanguage });
      
      // Download SDK as file
      const blob = new Blob([sdk.code], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `api-sdk.${sdkLanguage === "javascript" ? "js" : sdkLanguage === "python" ? "py" : "sh"}`;
      a.click();
      
      toast.success("SDK downloaded successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate SDK");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card>
          <CardContent className="p-6 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <span>Please sign in to access the API Builder</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const selectedApiData = apis?.find(a => a._id === selectedApi);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Custom API Builder</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage custom API endpoints with versioning and analytics
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create API
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New API</DialogTitle>
                <DialogDescription>
                  Configure a new custom API endpoint
                </DialogDescription>
              </DialogHeader>
              {/* Create API form would go here */}
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* API List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Your APIs</CardTitle>
              <CardDescription>{apis?.length || 0} endpoints</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {apis?.map((api) => (
                <button
                  key={api._id}
                  onClick={() => setSelectedApi(api._id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedApi === api._id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{api.name}</p>
                      <p className="text-xs opacity-70">{api.method} {api.path}</p>
                    </div>
                    <Badge variant={api.isActive ? "default" : "secondary"}>
                      {api.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* API Details */}
          <Card className="lg:col-span-2">
            {selectedApiData ? (
              <Tabs defaultValue="overview" className="w-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedApiData.name}</CardTitle>
                      <CardDescription>{selectedApiData.description}</CardDescription>
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
                      <TabsTrigger value="sdk">
                        <Code className="h-4 w-4 mr-2" />
                        SDK
                      </TabsTrigger>
                      <TabsTrigger value="settings">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </TabsTrigger>
                    </TabsList>
                  </div>
                </CardHeader>

                <CardContent>
                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Method</Label>
                        <p className="text-sm font-mono">{selectedApiData.method}</p>
                      </div>
                      <div>
                        <Label>Path</Label>
                        <p className="text-sm font-mono">{selectedApiData.path}</p>
                      </div>
                      <div>
                        <Label>Rate Limit</Label>
                        <p className="text-sm">{selectedApiData.rateLimit || 100} calls/hour</p>
                      </div>
                      <div>
                        <Label>Total Calls</Label>
                        <p className="text-sm">{selectedApiData.totalCalls || 0}</p>
                      </div>
                    </div>

                    {apiDocs && (
                      <div className="mt-6">
                        <h3 className="font-semibold mb-2">API Documentation</h3>
                        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                          <pre className="text-xs">
                            {JSON.stringify(apiDocs.examples, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="analytics" className="space-y-4">
                    {apiAnalytics && (
                      <>
                        <div className="grid grid-cols-4 gap-4">
                          <Card>
                            <CardHeader className="pb-2">
                              <CardDescription>Total Calls</CardDescription>
                              <CardTitle className="text-2xl">{apiAnalytics.totalCalls}</CardTitle>
                            </CardHeader>
                          </Card>
                          <Card>
                            <CardHeader className="pb-2">
                              <CardDescription>Success Rate</CardDescription>
                              <CardTitle className="text-2xl">{apiAnalytics.successRate.toFixed(1)}%</CardTitle>
                            </CardHeader>
                          </Card>
                          <Card>
                            <CardHeader className="pb-2">
                              <CardDescription>Avg Response</CardDescription>
                              <CardTitle className="text-2xl">{apiAnalytics.avgResponseTime.toFixed(0)}ms</CardTitle>
                            </CardHeader>
                          </Card>
                          <Card>
                            <CardHeader className="pb-2">
                              <CardDescription>Failed Calls</CardDescription>
                              <CardTitle className="text-2xl">{apiAnalytics.failedCalls}</CardTitle>
                            </CardHeader>
                          </Card>
                        </div>

                        <Card>
                          <CardHeader>
                            <CardTitle>API Calls Over Time</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                              <LineChart data={Object.entries(apiAnalytics.callsByDay).map(([date, count]) => ({ date, calls: count }))}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="calls" stroke="#10b981" strokeWidth={2} />
                              </LineChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="sdk" className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Select value={sdkLanguage} onValueChange={(v: any) => setSdkLanguage(v)}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="javascript">JavaScript</SelectItem>
                          <SelectItem value="python">Python</SelectItem>
                          <SelectItem value="curl">cURL</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={handleGenerateSdk} className="gap-2">
                        <Download className="h-4 w-4" />
                        Download SDK
                      </Button>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>SDK Preview</CardTitle>
                        <CardDescription>
                          Generated {sdkLanguage} code for your API
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                          <pre className="text-xs">
                            {/* SDK code preview would be shown here */}
                            Loading SDK preview...
                          </pre>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <Label>Rate Limit (calls per hour)</Label>
                        <Input type="number" defaultValue={selectedApiData.rateLimit || 100} />
                      </div>
                      <div>
                        <Label>API Status</Label>
                        <Select defaultValue={selectedApiData.isActive ? "active" : "inactive"}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button>Save Changes</Button>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            ) : (
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  Select an API to view details and analytics
                </p>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}