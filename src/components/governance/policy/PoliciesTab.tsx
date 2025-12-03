import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface PoliciesTabProps {
  businessId: Id<"businesses">;
  policies: any[];
  onEdit: (policyId: Id<"policies">) => void;
}

export default function PoliciesTab({ businessId, policies, onEdit }: PoliciesTabProps) {
  const deletePolicy = useMutation(api.policyManagement.deletePolicy);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredPolicies = policies?.filter((p: any) =>
    statusFilter === "all" ? true : p.status === statusFilter
  );

  const handleDelete = async (policyId: Id<"policies">) => {
    if (!confirm("Are you sure you want to delete this policy?")) return;
    try {
      await deletePolicy({ policyId });
      toast.success("Policy deleted successfully");
    } catch (error) {
      toast.error("Failed to delete policy");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>All Policies</CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="deprecated">Deprecated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPolicies?.map((policy: any) => (
              <TableRow key={policy._id}>
                <TableCell className="font-medium">{policy.title}</TableCell>
                <TableCell>{policy.category}</TableCell>
                <TableCell>{policy.version}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      policy.status === "active"
                        ? "default"
                        : policy.status === "draft"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {policy.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      policy.severity === "critical"
                        ? "destructive"
                        : policy.severity === "high"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {policy.severity}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(policy._id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(policy._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}