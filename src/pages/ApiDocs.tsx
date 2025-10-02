import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Copy, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function ApiDocsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Documentation</h1>
          <p className="text-muted-foreground mt-2">
            Complete API reference and interactive documentation
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Download OpenAPI Spec
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="authentication">Authentication</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="sdk">SDK</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Learn how to integrate with the Pikar AI API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Base URL</h3>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md font-mono text-sm">
                  <code>https://api.pikar.ai/v1</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard("https://api.pikar.ai/v1")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Rate Limits</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>1000 requests per hour for authenticated requests</li>
                  <li>100 requests per hour for unauthenticated requests</li>
                  <li>Rate limit headers included in all responses</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="authentication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Methods</CardTitle>
              <CardDescription>
                Secure your API requests with bearer tokens or API keys
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Bearer Token (JWT)</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Include your JWT token in the Authorization header:
                </p>
                <div className="p-3 bg-muted rounded-md font-mono text-sm">
                  <code>Authorization: Bearer YOUR_JWT_TOKEN</code>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">API Key</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Include your API key in the X-API-Key header:
                </p>
                <div className="p-3 bg-muted rounded-md font-mono text-sm">
                  <code>X-API-Key: YOUR_API_KEY</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoints</CardTitle>
              <CardDescription>
                Available REST API endpoints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                    GET
                  </span>
                  <code className="text-sm">/api/workflows/list</code>
                </div>
                <p className="text-sm text-muted-foreground">
                  List all workflows for your business
                </p>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                    POST
                  </span>
                  <code className="text-sm">/api/workflows/run</code>
                </div>
                <p className="text-sm text-muted-foreground">
                  Execute a workflow with parameters
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                    GET
                  </span>
                  <code className="text-sm">/api/campaigns/list</code>
                </div>
                <p className="text-sm text-muted-foreground">
                  List all email campaigns
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Events</CardTitle>
              <CardDescription>
                Subscribe to real-time events from Pikar AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Configure webhooks to receive notifications when events occur in your account.
              </p>
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Manage Webhooks
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sdk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SDK Downloads</CardTitle>
              <CardDescription>
                Official client libraries for popular languages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">TypeScript / JavaScript</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    npm install @pikar/api-client
                  </p>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Python</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    pip install pikar-api
                  </p>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
