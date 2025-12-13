import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import PoliciesTab from "./policy/PoliciesTab";
import { ApprovalsTab } from "./policy/ApprovalsTab";
import DistributionTab from "./policy/DistributionTab";
import { AcknowledgmentsTab } from "./policy/AcknowledgmentsTab";
import AnalyticsTab from "./policy/AnalyticsTab";
import PolicyEditorDialog from "./policy/PolicyEditorDialog";
import { PolicyVersionHistory } from "./policy/PolicyVersionHistory";

interface PolicyManagementProps {
  businessId: Id<"businesses">;
}

export function PolicyManagement({ businessId }: PolicyManagementProps) {
  const [activeTab, setActiveTab] = useState("policies");
  const [selectedPolicy, setSelectedPolicy] = useState<Id<"policies"> | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const policies = useQuery(api.policyManagement.getPolicies, { businessId });
  const pendingApprovals = useQuery(api.policyManagement.getPendingApprovals, { businessId });
  const effectiveness = useQuery(api.policyManagement.getPolicyEffectiveness, { businessId });
  const trends = useQuery(api.policyManagement.getPolicyTrends, { businessId, days: 30 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Policy Management</h2>
          <p className="text-muted-foreground">
            Manage organizational policies with versioning, approvals, and tracking
          </p>
        </div>
        <Button onClick={() => setIsEditorOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Policy
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="versions">Versions</TabsTrigger>
          <TabsTrigger value="approvals">
            Approvals
            {pendingApprovals && pendingApprovals.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingApprovals.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="acknowledgments">Acknowledgments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="space-y-4">
          <PoliciesTab
            businessId={businessId}
            policies={policies || []}
            onEdit={(policyId: Id<"policies">) => {
              setSelectedPolicy(policyId);
              setIsEditorOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <ApprovalsTab businessId={businessId} approvals={pendingApprovals || []} />
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <DistributionTab businessId={businessId} policies={policies || []} />
        </TabsContent>

        <TabsContent value="acknowledgments" className="space-y-4">
          <AcknowledgmentsTab businessId={businessId} policies={policies || []} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsTab
            businessId={businessId}
            effectiveness={effectiveness || []}
            trends={trends || []}
          />
        </TabsContent>

        <TabsContent value="versions" className="space-y-4">
          {selectedPolicy ? (
            <PolicyVersionHistory policyId={selectedPolicy} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Select a policy from the Policies tab to view its version history</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <PolicyEditorDialog
        businessId={businessId}
        policyId={selectedPolicy}
        open={isEditorOpen}
        onOpenChange={(open: boolean) => {
          setIsEditorOpen(open);
          if (!open) setSelectedPolicy(null);
        }}
      />
    </div>
  );
}