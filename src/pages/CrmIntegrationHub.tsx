import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CRMConnectionManager } from "@/components/crm/CRMConnectionManager";
import { ContactSyncStatus } from "@/components/crm/ContactSyncStatus";
import { DealPipeline } from "@/components/crm/DealPipeline";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Network, Users, TrendingUp } from "lucide-react";

export default function CrmIntegrationHub() {
  const { user } = useAuth();
  const business = useQuery(api.businesses.getCurrentBusiness, user ? {} : "skip");

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Network className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <div className="font-medium">Sign in to access CRM Integration Hub</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Network className="h-8 w-8" />
            CRM Integration Hub
          </h1>
          <p className="text-muted-foreground mt-2">
            Connect and manage your CRM integrations, sync contacts, and track deals
          </p>
        </div>

        <Tabs defaultValue="connections" className="w-full">
          <TabsList>
            <TabsTrigger value="connections">
              <Network className="h-4 w-4 mr-2" />
              Connections
            </TabsTrigger>
            <TabsTrigger value="contacts">
              <Users className="h-4 w-4 mr-2" />
              Contact Sync
            </TabsTrigger>
            <TabsTrigger value="deals">
              <TrendingUp className="h-4 w-4 mr-2" />
              Deal Pipeline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connections" className="space-y-4">
            <CRMConnectionManager businessId={business?._id} />
          </TabsContent>

          <TabsContent value="contacts" className="space-y-4">
            <ContactSyncStatus businessId={business?._id} />
          </TabsContent>

          <TabsContent value="deals" className="space-y-4">
            <DealPipeline businessId={business?._id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
