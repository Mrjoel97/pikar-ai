import { IntegrationAnalyticsChart } from "./IntegrationAnalyticsChart";
import { Id } from "@/convex/_generated/dataModel";

interface IntegrationAnalyticsProps {
  businessId: Id<"businesses">;
  isGuest?: boolean;
}

export function IntegrationAnalytics({ businessId, isGuest = false }: IntegrationAnalyticsProps) {
  return (
    <div className="space-y-6">
      <IntegrationAnalyticsChart businessId={businessId} isGuest={isGuest} />
    </div>
  );
}