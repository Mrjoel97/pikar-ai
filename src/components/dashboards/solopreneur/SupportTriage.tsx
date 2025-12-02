import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";

interface SupportTriageProps {
  businessId: Id<"businesses">;
}

export function SupportTriage({ businessId }: SupportTriageProps) {
  const tickets = useQuery(api.supportTickets.listByBusiness, { businessId, limit: 5 });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Support Triage</CardTitle>
      </CardHeader>
      <CardContent>
        {tickets && tickets.length > 0 ? (
          <div className="space-y-3">
            {tickets.map((ticket: any) => (
              <div key={ticket._id} className="flex items-start gap-3 p-3 border rounded-lg">
                {getStatusIcon(ticket.status)}
                <div className="flex-1">
                  <p className="text-sm font-medium">{ticket.subject}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ticket.customerEmail}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={getPriorityColor(ticket.priority)} className="text-xs">
                      {ticket.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {ticket.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">No open support tickets</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}