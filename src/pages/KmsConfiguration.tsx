import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { KmsConfiguration } from "@/components/kms/KmsConfiguration";
import { Card, CardContent } from "@/components/ui/card";

export default function KmsConfigurationPage() {
  const business = useQuery(api.businesses.currentUserBusiness, {});

  if (business === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
              <p className="text-sm text-muted-foreground">
                Please sign in to configure KMS encryption.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tier = business.settings?.plan || business.tier || "solopreneur";
  if (tier !== "enterprise") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Enterprise Feature</h2>
              <p className="text-sm text-muted-foreground">
                KMS encryption is only available for Enterprise tier customers.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">KMS Encryption Configuration</h1>
          <p className="text-muted-foreground mt-2">
            Configure cloud provider key management services to encrypt sensitive data like API keys.
          </p>
        </div>

        <KmsConfiguration businessId={business._id} />
      </div>
    </div>
  );
}
