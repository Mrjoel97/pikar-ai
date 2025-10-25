import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send } from "lucide-react";
import { toast } from "sonner";

interface DistributionTabProps {
  businessId: Id<"businesses">;
  policies: any[];
}

export function DistributionTab({ businessId, policies }: DistributionTabProps) {
  const distributePolicy = useMutation(api.policyManagement.distributePolicy);
  const [selectedPolicyId, setSelectedPolicyId] = useState<Id<"policies"> | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Id<"users">[]>([]);
  const [dueDate, setDueDate] = useState<string>("");

  const handleDistribute = async () => {
    if (!selectedPolicyId || selectedUsers.length === 0) {
      toast.error("Please select a policy and at least one user");
      return;
    }

    try {
      await distributePolicy({
        policyId: selectedPolicyId,
        userIds: selectedUsers,
        dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
      });
      toast.success("Policy distributed successfully");
      setSelectedPolicyId(null);
      setSelectedUsers([]);
      setDueDate("");
    } catch (error) {
      toast.error("Failed to distribute policy");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribute Policy</CardTitle>
        <CardDescription>
          Send policies to users for acknowledgment
        </CardDescription>
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
              {policies
                ?.filter((p: any) => p.status === "active")
                .map((policy: any) => (
                  <SelectItem key={policy._id} value={policy._id}>
                    {policy.title} (v{policy.version})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="dueDate">Due Date (Optional)</Label>
          <Input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div>
          <Label>Select Users</Label>
          <p className="text-sm text-muted-foreground mb-2">
            User selection interface would go here
          </p>
        </div>

        <Button onClick={handleDistribute} disabled={!selectedPolicyId}>
          <Send className="mr-2 h-4 w-4" />
          Distribute Policy
        </Button>
      </CardContent>
    </Card>
  );
}