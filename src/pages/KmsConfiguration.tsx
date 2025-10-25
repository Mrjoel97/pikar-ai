import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { KmsConfiguration } from "@/components/kms/KmsConfiguration";
import { KeyRotationScheduler } from "@/components/kms/KeyRotationScheduler";
import { EncryptionPolicyBuilder } from "@/components/kms/EncryptionPolicyBuilder";
import { KmsAnalyticsDashboard } from "@/components/kms/KmsAnalyticsDashboard";
import { ComplianceDashboard } from "@/components/kms/ComplianceDashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">KMS Encryption Management</h1>
          <p className="text-muted-foreground mt-2">
            Configure cloud provider key management, rotation policies, and compliance monitoring
          </p>
        </div>

        <Tabs defaultValue="configuration" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="rotation">Key Rotation</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>

          <TabsContent value="configuration" className="mt-6">
            <KmsConfiguration businessId={business._id} />
          </TabsContent>

          <TabsContent value="rotation" className="mt-6">
            <KeyRotationScheduler businessId={business._id} />
          </TabsContent>

          <TabsContent value="policies" className="mt-6">
            <EncryptionPolicyBuilder businessId={business._id} />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <KmsAnalyticsDashboard businessId={business._id} />
          </TabsContent>

          <TabsContent value="compliance" className="mt-6">
            <ComplianceDashboard businessId={business._id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}