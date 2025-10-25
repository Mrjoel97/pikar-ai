import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Shield, Users, BarChart3, Settings } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IdpManagement } from "@/components/sso/IdpManagement";
import { AttributeMapper } from "@/components/sso/AttributeMapper";
import { JitProvisioningSettings } from "@/components/sso/JitProvisioningSettings";
import { SsoAnalyticsDashboard } from "@/components/sso/SsoAnalyticsDashboard";

export default function SsoConfigurationPage() {
  const business = useQuery(api.businesses.currentUserBusiness);

  if (business === undefined) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No business found. Please complete onboarding first.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check if Enterprise tier
  const tier = business.tier || business.settings?.plan;
  if (tier !== "enterprise") {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            SSO configuration is only available for Enterprise tier customers.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-emerald-600" />
        <div>
          <h1 className="text-3xl font-bold">SSO Configuration</h1>
          <p className="text-gray-600 mt-1">
            Manage SAML 2.0 and OIDC identity providers for enterprise single sign-on
          </p>
        </div>
      </div>

      <Tabs defaultValue="idps" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="idps" className="gap-2">
            <Shield className="h-4 w-4" />
            Identity Providers
          </TabsTrigger>
          <TabsTrigger value="mapping" className="gap-2">
            <Settings className="h-4 w-4" />
            Attribute Mapping
          </TabsTrigger>
          <TabsTrigger value="jit" className="gap-2">
            <Users className="h-4 w-4" />
            JIT Provisioning
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="idps" className="space-y-4">
          <IdpManagement businessId={business._id} />
        </TabsContent>

        <TabsContent value="mapping" className="space-y-4">
          <AttributeMapper businessId={business._id} />
        </TabsContent>

        <TabsContent value="jit" className="space-y-4">
          <JitProvisioningSettings businessId={business._id} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <SsoAnalyticsDashboard businessId={business._id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}