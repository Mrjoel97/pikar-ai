import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ScimConfiguration from "@/components/scim/ScimConfiguration";
import ScimSyncStatus from "@/components/scim/ScimSyncStatus";
import { Id } from "@/convex/_generated/dataModel";

export default function ScimProvisioningPage() {
  const business = useQuery(api.businesses.currentUserBusiness);
  const businessId = business?._id as Id<"businesses"> | undefined;

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
        <h1 className="text-3xl font-bold">SCIM Provisioning</h1>
        <p className="text-muted-foreground mt-2">
          Automate user and group provisioning from your Identity Provider
        </p>
      </div>

      <Tabs defaultValue="configuration" className="space-y-6">
        <TabsList>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="status">Sync Status</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration">
          <ScimConfiguration businessId={businessId} />
        </TabsContent>

        <TabsContent value="status">
          <ScimSyncStatus businessId={businessId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
