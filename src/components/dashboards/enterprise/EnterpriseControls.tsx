import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface EnterpriseControlsProps {
  hasTier: (tier: string) => boolean;
  onUpgrade: () => void;
}

export function EnterpriseControls({ hasTier, onUpgrade }: EnterpriseControlsProps) {
  return (
    <Card className="xl:col-span-1">
      <CardHeader className="pb-2">
        <CardTitle>Enterprise Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">SSO & RBAC</span>
          <Button size="sm" disabled>Manage</Button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">API Access</span>
          <Button size="sm" disabled>Configure</Button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Integrations</span>
          <Button size="sm" disabled>Open</Button>
        </div>
        <div className="text-xs text-muted-foreground">
          Contact support to enable enterprise controls.
        </div>
        {!hasTier("enterprise") && (
          <div className="pt-2 border-t mt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="border-amber-300 text-amber-700">Locked</Badge>
              <span>Advanced controls are Enterprise+</span>
              <Button size="sm" variant="outline" onClick={onUpgrade} className="ml-auto">Upgrade</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
