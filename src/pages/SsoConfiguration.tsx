import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SsoConfiguration } from "@/components/sso/SsoConfiguration";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
      <div>
        <h1 className="text-3xl font-bold">SSO Configuration</h1>
        <p className="text-gray-600 mt-2">
          Configure SAML 2.0 or OIDC for enterprise single sign-on
        </p>
      </div>

      <SsoConfiguration businessId={business._id} />
    </div>
  );
}
