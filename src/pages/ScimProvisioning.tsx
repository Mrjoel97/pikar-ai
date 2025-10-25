import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ScimConfiguration from "@/components/scim/ScimConfiguration";
import ScimSyncStatus from "@/components/scim/ScimSyncStatus";
import { Id } from "@/convex/_generated/dataModel";
import { Settings, Activity, Users, Shield, Database } from "lucide-react";

export default function ScimProvisioningPage() {
  const business = useQuery(api.businesses.currentUserBusiness);
  const businessId = business?._id as Id<"businesses"> | undefined;
  const scimConfig = useQuery(api.scim.getScimConfig, businessId ? { businessId } : "skip");
  const provisionedUsers = useQuery(api.scim.getProvisionedUsers, businessId ? { businessId, limit: 10 } : "skip");
  const provisionedGroups = useQuery(api.scim.getProvisionedGroups, businessId ? { businessId, limit: 10 } : "skip");

  if (!businessId) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">SCIM 2.0 Provisioning</h1>
        <p className="text-muted-foreground mt-2">
          Automate user and group provisioning from your Identity Provider with full SCIM 2.0 compliance
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configuration</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={scimConfig?.isConfigured ? "default" : "secondary"}>
                {scimConfig?.isConfigured ? "Configured" : "Not Configured"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {scimConfig?.tokenCount || 0} token(s) active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Provisioned Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{provisionedUsers?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Active users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Provisioned Groups</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{provisionedGroups?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Active groups</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attribute Mappings</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scimConfig?.mappingCount || 0}</div>
            <p className="text-xs text-muted-foreground">Field mappings</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="configuration" className="space-y-6">
        <TabsList>
          <TabsTrigger value="configuration" className="gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="status" className="gap-2">
            <Activity className="h-4 w-4" />
            Sync Status
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="groups" className="gap-2">
            <Shield className="h-4 w-4" />
            Groups
          </TabsTrigger>
          <TabsTrigger value="mappings" className="gap-2">
            <Database className="h-4 w-4" />
            Attribute Mappings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configuration">
          <ScimConfiguration businessId={businessId} />
        </TabsContent>

        <TabsContent value="status">
          <ScimSyncStatus businessId={businessId} />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Provisioned Users</CardTitle>
              <CardDescription>Users synced from your Identity Provider</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {provisionedUsers && provisionedUsers.length > 0 ? (
                  provisionedUsers.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{item.user?.name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">{item.user?.email}</p>
                        <p className="text-xs text-muted-foreground">
                          SCIM ID: {item.scimId}
                        </p>
                      </div>
                      <Badge variant={item.active ? "default" : "secondary"}>
                        {item.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No users provisioned yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Provisioned Groups</CardTitle>
              <CardDescription>Groups synced from your Identity Provider</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {provisionedGroups && provisionedGroups.length > 0 ? (
                  provisionedGroups.map((group) => (
                    <div
                      key={group._id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{group.displayName}</p>
                        <p className="text-sm text-muted-foreground">
                          {group.memberCount} member(s)
                        </p>
                        <p className="text-xs text-muted-foreground">
                          SCIM ID: {group.scimId}
                        </p>
                      </div>
                      <Badge variant="default">Active</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No groups provisioned yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mappings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attribute Mappings</CardTitle>
              <CardDescription>
                Map SCIM attributes to your internal user fields
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 font-semibold text-sm border-b pb-2">
                  <div>SCIM Attribute</div>
                  <div>Internal Field</div>
                  <div>Type</div>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-4 text-sm p-2 border rounded">
                    <div className="font-mono">userName</div>
                    <div>email</div>
                    <div>
                      <Badge variant="outline">string</Badge>
                      <Badge variant="destructive" className="ml-2">required</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm p-2 border rounded">
                    <div className="font-mono">name.givenName</div>
                    <div>firstName</div>
                    <div>
                      <Badge variant="outline">string</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm p-2 border rounded">
                    <div className="font-mono">name.familyName</div>
                    <div>lastName</div>
                    <div>
                      <Badge variant="outline">string</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm p-2 border rounded">
                    <div className="font-mono">emails[primary eq true].value</div>
                    <div>email</div>
                    <div>
                      <Badge variant="outline">string</Badge>
                      <Badge variant="destructive" className="ml-2">required</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm p-2 border rounded">
                    <div className="font-mono">active</div>
                    <div>isActive</div>
                    <div>
                      <Badge variant="outline">boolean</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm p-2 border rounded">
                    <div className="font-mono">title</div>
                    <div>jobTitle</div>
                    <div>
                      <Badge variant="outline">string</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm p-2 border rounded">
                    <div className="font-mono">department</div>
                    <div>department</div>
                    <div>
                      <Badge variant="outline">string</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}