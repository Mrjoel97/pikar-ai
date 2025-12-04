import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Clock, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface TicketListProps {
  businessId: Id<"businesses">;
  showFilters?: boolean;
}

export function TicketList({ businessId, showFilters = true }: TicketListProps) {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>(undefined);

  const tickets = useQuery(api.supportTickets.listTickets, {
    businessId,
    status: statusFilter as any,
    priority: priorityFilter as any,
  });

  const updateStatus = useMutation(api.supportTickets.updateTicketStatus);

  const handleStatusChange = async (ticketId: Id<"supportTickets">, newStatus: string) => {
    try {
      await updateStatus({ ticketId, status: newStatus as any });
      toast.success("Ticket status updated");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update status");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open": return <AlertCircle className="h-4 w-4" />;
      case "in_progress": return <Clock className="h-4 w-4" />;
      case "resolved": return <CheckCircle2 className="h-4 w-4" />;
      case "closed": return <XCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Support Tickets</CardTitle>
        {showFilters && (
          <div className="flex gap-2 pt-2">
            <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? undefined : v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="waiting_customer">Waiting</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter || "all"} onValueChange={(v) => setPriorityFilter(v === "all" ? undefined : v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {!tickets ? (
          <div className="text-center py-8 text-muted-foreground">Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No tickets found</div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket: any) => (
              <Card key={ticket._id} className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ticket.status)}
                        <h4 className="font-semibold">{ticket.subject}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {ticket.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Created {new Date(ticket.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Updated {new Date(ticket.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={getPriorityColor(ticket.priority) as any} className="capitalize">
                        {ticket.priority}
                      </Badge>
                      <Select
                        value={ticket.status}
                        onValueChange={(v) => handleStatusChange(ticket._id, v)}
                      >
                        <SelectTrigger className="w-36 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="waiting_customer">Waiting</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
