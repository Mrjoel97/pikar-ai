import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LockedRibbon } from "./LockedRibbon";

type EnterpriseShortcutsProps = {
  businessId: string | null;
  brandingPortalEnabled: boolean;
  scimProvisioningEnabled: boolean;
  ssoConfigurationEnabled: boolean;
  kmsEncryptionEnabled: boolean;
  onOpenBranding: () => void;
  onOpenDataWarehouse: () => void;
  onOpenSecurity: () => void;
  onOpenScim: () => void;
  onOpenSso: () => void;
  onOpenKms: () => void;
  onOpenApiBuilder: () => void;
  onOpenSupport: () => void;
  onUpgrade: () => void;
};

export function EnterpriseShortcuts({
  businessId,
  brandingPortalEnabled,
  scimProvisioningEnabled,
  ssoConfigurationEnabled,
  kmsEncryptionEnabled,
  onOpenBranding,
  onOpenDataWarehouse,
  onOpenSecurity,
  onOpenScim,
  onOpenSso,
  onOpenKms,
  onOpenApiBuilder,
  onOpenSupport,
  onUpgrade,
}: EnterpriseShortcutsProps) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Enterprise Shortcuts</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="relative">
          {!brandingPortalEnabled && (
            <LockedRibbon label="Branding Portal requires Enterprise tier" onUpgrade={onUpgrade} />
          )}
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Branding</div>
              <div className="text-xs text-muted-foreground">White-label customization</div>
            </div>
            <Button size="sm" variant="outline" onClick={onOpenBranding} disabled={!brandingPortalEnabled}>
              Customize
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Data Warehouse</div>
              <div className="text-xs text-muted-foreground">ETL & data integration</div>
            </div>
            <Button size="sm" variant="outline" onClick={onOpenDataWarehouse}>
              Manage
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Security Dashboard</div>
              <div className="text-xs text-muted-foreground">Threats & compliance</div>
            </div>
            <Button size="sm" variant="outline" onClick={onOpenSecurity}>
              Open
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Feature Flags</div>
              <div className="text-xs text-muted-foreground">Manage rollout</div>
            </div>
            <a href="#feature-flags">
              <Button size="sm" variant="outline">Open</Button>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Audit Export</div>
              <div className="text-xs text-muted-foreground">CSV for compliance</div>
            </div>
            {businessId ? (
              <a href={`/api/audit/export?businessId=${businessId}`} target="_blank" rel="noreferrer">
                <Button size="sm" variant="outline">Download</Button>
              </a>
            ) : (
              <Button size="sm" variant="outline" disabled>Download</Button>
            )}
          </CardContent>
        </Card>

        <Card className="relative">
          {!scimProvisioningEnabled && (
            <LockedRibbon label="SCIM Provisioning requires Enterprise tier" onUpgrade={onUpgrade} />
          )}
          <CardContent className="p-6">
            <div className="text-sm font-medium">SCIM Provisioning</div>
            <div className="text-xs text-muted-foreground mt-1">User sync from IdP</div>
            <Button
              size="sm"
              className="mt-4 w-full"
              onClick={onOpenScim}
              disabled={!scimProvisioningEnabled}
            >
              Configure
            </Button>
          </CardContent>
        </Card>

        <Card className="relative">
          {!ssoConfigurationEnabled && (
            <LockedRibbon label="SSO Configuration requires Enterprise tier" onUpgrade={onUpgrade} />
          )}
          <CardContent className="p-6">
            <div className="text-sm font-medium">SSO Configuration</div>
            <div className="text-xs text-muted-foreground mt-1">SAML & OIDC setup</div>
            <Button
              size="sm"
              className="mt-4 w-full"
              onClick={onOpenSso}
              disabled={!ssoConfigurationEnabled}
            >
              Configure
            </Button>
          </CardContent>
        </Card>

        <Card className="relative">
          {!kmsEncryptionEnabled && (
            <LockedRibbon label="KMS Encryption requires Enterprise tier" onUpgrade={onUpgrade} />
          )}
          <CardContent className="p-6">
            <div className="text-sm font-medium">Encryption (KMS)</div>
            <div className="text-xs text-muted-foreground mt-1">Secure key management</div>
            <Button
              size="sm"
              className="mt-4 w-full"
              onClick={onOpenKms}
              disabled={!kmsEncryptionEnabled}
            >
              Configure
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Custom APIs</div>
              <div className="text-xs text-muted-foreground">Build custom endpoints</div>
            </div>
            <Button size="sm" variant="outline" onClick={onOpenApiBuilder}>
              Open Builder
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Enterprise Support</div>
              <div className="text-xs text-muted-foreground">Tickets & training</div>
            </div>
            <Button size="sm" variant="outline" onClick={onOpenSupport}>
              Open Portal
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
