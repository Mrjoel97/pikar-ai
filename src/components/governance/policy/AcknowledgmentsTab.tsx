import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AcknowledgmentsTabProps {
  businessId: Id<"businesses">;
  policies: any[];
}

export function AcknowledgmentsTab({ businessId, policies }: AcknowledgmentsTabProps) {
  const [selectedPolicyId, setSelectedPolicyId] = useState<Id<"policies"> | null>(null);
  const acknowledgments = useQuery(
    api.policyManagement.getPolicyAcknowledgments,
    selectedPolicyId ? { policyId: selectedPolicyId } : "skip"
  );

  const stats = acknowledgments
    ? {
        total: acknowledgments.length,
        acknowledged: acknowledgments.filter((a: any) => a.status === "acknowledged").length,
        pending: acknowledgments.filter((a: any) => a.status === "pending").length,
        overdue: acknowledgments.filter(
          (a: any) => a.status === "pending" && a.dueDate && a.dueDate < Date.now()
        ).length,
      }
    : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Acknowledgment Tracking</CardTitle>
          <CardDescription>Monitor policy acknowledgment status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Select Policy</Label>
            <Select
              value={selectedPolicyId || ""}
              onValueChange={(value) => setSelectedPolicyId(value as Id<"policies">)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a policy" />
              </SelectTrigger>
              <SelectContent>
                {policies?.map((policy: any) => (
                  <SelectItem key={policy._id} value={policy._id}>
                    {policy.title} (v{policy.version})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {stats && (
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Acknowledged</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.acknowledged}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {stats.pending}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {stats.overdue}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {acknowledgments && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Distributed</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Acknowledged</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {acknowledgments.map((ack: any) => (
                  <TableRow key={ack._id}>
                    <TableCell>{ack.user?.name || ack.user?.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          ack.status === "acknowledged"
                            ? "default"
                            : ack.status === "overdue"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {ack.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(ack.distributedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {ack.dueDate
                        ? new Date(ack.dueDate).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {ack.acknowledgedAt
                        ? new Date(ack.acknowledgedAt).toLocaleDateString()
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}