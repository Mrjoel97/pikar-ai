import React from "react";
import { TriageWidget } from "@/components/support/TriageWidget";
import { TicketList } from "@/components/support/TicketList";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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