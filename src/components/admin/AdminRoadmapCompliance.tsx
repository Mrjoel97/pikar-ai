import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AdminRoadmapCompliance() {
  return (
    <Card>
      <CardHeader>
        <CardTitle id="section-roadmap-compliance">Admin Roadmap Compliance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Feature Management */}
          <div className="p-3 rounded-md border">
            <div className="font-medium">Feature Flags & Rollouts</div>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="outline">Implemented</Badge>
              <span className="text-muted-foreground">Per-tenant flags, toggle, rollout % edit, scope</span>
            </div>
          </div>

          {/* Audit & Compliance */}
          <div className="p-3 rounded-md border">
            <div className="font-medium">Audit & Compliance</div>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="outline">Implemented</Badge>
              <span className="text-muted-foreground">Audit Explorer with filters and CSV export</span>
            </div>
          </div>

          {/* System Health & Observability */}
          <div className="p-3 rounded-md border">
            <div className="font-medium">System Health & Alerting</div>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="outline">Implemented</Badge>
              <span className="text-muted-foreground">Env checks, queue depth, cron freshness, SLA</span>
            </div>
          </div>

          {/* Tenant & User Management */}
          <div className="p-3 rounded-md border">
            <div className="font-medium">Tenant & User Management</div>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="secondary">Partial</Badge>
              <span className="text-muted-foreground">Admin roles present; full tenant provisioning planned</span>
            </div>
          </div>

          {/* Auth/Onboarding/SSO/SCIM */}
          <div className="p-3 rounded-md border">
            <div className="font-medium">SSO/SCIM & Onboarding</div>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="secondary">Partial</Badge>
              <span className="text-muted-foreground">Independent admin auth done; SSO/SCIM planned</span>
            </div>
          </div>

          {/* API Key Management */}
          <div className="p-3 rounded-md border">
            <div className="font-medium">API Key Management</div>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="secondary">Planned</Badge>
              <span className="text-muted-foreground">Create/rotate/revoke service keys pending</span>
            </div>
          </div>

          {/* Billing & Usage */}
          <div className="p-3 rounded-md border">
            <div className="font-medium">Billing & Usage</div>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="secondary">Partial</Badge>
              <span className="text-muted-foreground">Stripe onboarding integrated; usage metering planned</span>
            </div>
          </div>

          {/* Agent Orchestration */}
          <div className="p-3 rounded-md border">
            <div className="font-medium">Agent Orchestration & Templates</div>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="secondary">Partial</Badge>
              <span className="text-muted-foreground">Custom AI Agent base present; registry/rollback planned</span>
            </div>
          </div>

          {/* Integrations & Connectors */}
          <div className="p-3 rounded-md border">
            <div className="font-medium">Integrations & Connectors</div>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="secondary">Planned</Badge>
              <span className="text-muted-foreground">Connector store, webhooks, secret store pending</span>
            </div>
          </div>

          {/* Support & Changelog */}
          <div className="p-3 rounded-md border">
            <div className="font-medium">Support & Changelog</div>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="secondary">Planned</Badge>
              <span className="text-muted-foreground">Support console & release notes pending</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Note: This checklist reflects current implementation within the Admin Panel UI and supporting backend. Items marked "Planned" or "Partial" are on the roadmap.
        </div>
      </CardContent>
    </Card>
  );
}
