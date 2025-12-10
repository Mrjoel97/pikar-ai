import React from "react";
import { TriageWidget } from "@/components/support/TriageWidget";
import { TicketList } from "@/components/support/TicketList";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, AlertTriangle } from "lucide-react";

interface SupportTriageProps {
  isGuest: boolean;
}

export function SupportTriage({ isGuest }: SupportTriageProps) {
  // For demo purposes - in production, get from auth context
  const demoBusinessId = "demo-business-id" as any;
  
  const analytics = useQuery(
    isGuest ? undefined : api.supportTickets.getTicketAnalytics,
    isGuest ? "skip" : { businessId: demoBusinessId }
  );

  const sla = useQuery(
    isGuest ? undefined : api.supportTickets.trackSLA,
    isGuest ? "skip" : { businessId: demoBusinessId }
  );

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Support Triage</h2>
        {isGuest && (
          <Badge variant="outline">Guest Mode - Limited Features</Badge>
        )}
      </div>

      {!isGuest && analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{analytics.total}</div>
              <div className="text-xs text-muted-foreground">Total Tickets</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{analytics.open}</div>
              <div className="text-xs text-muted-foreground">Open</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{analytics.inProgress}</div>
              <div className="text-xs text-muted-foreground">In Progress</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{analytics.resolved}</div>
              <div className="text-xs text-muted-foreground">Resolved</div>
            </CardContent>
          </Card>
        </div>
      )}

      {!isGuest && sla && (
        <Card className="bg-muted/20 border-dashed">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className={`h-8 w-8 ${sla.complianceRate >= 90 ? 'text-green-600' : 'text-yellow-600'}`} />
              <div>
                <div className="font-semibold">SLA Compliance: {sla.complianceRate.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">
                  {sla.withinSLA} tickets within target time • {sla.breachedSLA} breached
                </div>
              </div>
            </div>
            {sla.breachedSLA > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Attention Needed
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="triage" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="triage">AI Triage</TabsTrigger>
          <TabsTrigger value="tickets" disabled={isGuest}>
            Ticket List {isGuest && "(Sign in)"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="triage" className="space-y-4">
          <TriageWidget 
            businessId={isGuest ? undefined : demoBusinessId}
          />
        </TabsContent>

        <TabsContent value="tickets" className="space-y-4">
          {!isGuest && <TicketList businessId={demoBusinessId} />}
        </TabsContent>
      </Tabs>
    </section>
  );
}