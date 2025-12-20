import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface FeatureFlagsPanelProps {
  flags: Array<{
    _id: string;
    flagName: string;
    isEnabled: boolean;
    rolloutPercentage?: number;
    businessId?: string | null;
  }> | undefined;
  flagAnalytics: {
    flags: any[];
    totalFlags: number;
    enabledFlags: number;
    usageEvents: number;
  } | undefined;
  toggleFlag: any;
  updateFlag: any;
}

export function FeatureFlagsPanel({
  flags,
  flagAnalytics,
  toggleFlag,
  updateFlag,
}: FeatureFlagsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle id="section-feature-flags">Feature Flags</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Manage global and tenant-specific feature flags. Toggling and edits take effect immediately.
        </p>
        <div className="rounded-md border overflow-hidden">
          <div className="grid grid-cols-3 md:grid-cols-7 gap-2 p-3 bg-muted/40 text-xs font-medium">
            <div>Name</div>
            <div>Status</div>
            <div>Rollout %</div>
            <div className="hidden md:block">Scope</div>
            <div className="hidden md:block">Edit %</div>
            <div className="hidden md:block">Scope To</div>
            <div className="text-right">Toggle</div>
          </div>
          <Separator />
          <div className="divide-y">
            {(flags || []).map((f) => (
              <div key={f._id} className="grid grid-cols-3 md:grid-cols-7 gap-2 p-3 text-sm items-center">
                <div className="truncate">{f.flagName}</div>
                <div>
                  <Badge variant={f.isEnabled ? "outline" : "secondary"}>
                    {f.isEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div>{typeof f.rolloutPercentage === "number" ? `${f.rolloutPercentage}%` : "—"}</div>
                <div className="hidden md:block">{f.businessId ? "Tenant" : "Global"}</div>

                <div className="hidden md:block">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      const current = typeof f.rolloutPercentage === "number" ? f.rolloutPercentage : 100;
                      const input = prompt(`Set rollout percentage for "${f.flagName}" (0-100):`, String(current));
                      if (input == null) return;
                      const pct = Number(input);
                      if (Number.isNaN(pct) || pct < 0 || pct > 100) {
                        toast.error("Please enter a valid number between 0 and 100.");
                        return;
                      }
                      try {
                        await updateFlag({ flagId: f._id as any, rolloutPercentage: pct });
                        toast.success(`Updated rollout to ${pct}%`);
                      } catch (e: any) {
                        toast.error(e?.message || "Failed to update rollout");
                      }
                    }}
                  >
                    Edit %
                  </Button>
                </div>

                <div className="hidden md:flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      const bid = prompt(
                        `Scope "${f.flagName}" to a tenant businessId.\nEnter "global" to remove tenant scope.`,
                        f.businessId ? String(f.businessId) : "global"
                      );
                      if (bid == null) return;
                      try {
                        if (bid.toLowerCase() === "global") {
                          await updateFlag({ flagId: f._id as any, businessId: null });
                          toast.success("Scoped to Global");
                        } else {
                          await updateFlag({ flagId: f._id as any, businessId: bid as any });
                          toast.success(`Scoped to tenant: ${bid}`);
                        }
                      } catch (e: any) {
                        toast.error(e?.message || "Failed to update scope");
                      }
                    }}
                  >
                    Scope
                  </Button>
                </div>

                <div className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        const newVal = await toggleFlag({ flagId: f._id as any });
                        toast.success(`Flag "${f.flagName}" is now ${newVal ? "Enabled" : "Disabled"}`);
                      } catch (e: any) {
                        toast.error(e?.message || "Failed to toggle flag");
                      }
                    }}
                  >
                    Toggle
                  </Button>
                </div>
              </div>
            ))}
            {(!flags || flags.length === 0) && (
              <div className="p-3 text-sm text-muted-foreground">No flags configured yet.</div>
            )}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Usage events observed: {flagAnalytics?.usageEvents ?? 0}
        </div>
      </CardContent>
    </Card>
  );
}
