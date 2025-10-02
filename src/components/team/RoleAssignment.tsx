import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

interface RoleAssignmentProps {
  userId: Id<"users">;
  businessId: Id<"businesses">;
}

export function RoleAssignment({ userId, businessId }: RoleAssignmentProps) {
  const [selectedRole, setSelectedRole] = useState<"admin" | "editor" | "viewer" | "custom">("viewer");
  const [permissions, setPermissions] = useState({
    canApprove: false,
    canEdit: false,
    canView: true,
    canManageTeam: false,
    canManageSettings: false,
  });

  const userRole = useQuery(api.teamOnboarding.getUserPermissions, { userId, businessId });
  const assignRole = useMutation(api.teamOnboarding.assignRole);

  const handleRoleChange = (role: "admin" | "editor" | "viewer" | "custom") => {
    setSelectedRole(role);

    // Set default permissions based on role
    switch (role) {
      case "admin":
        setPermissions({
          canApprove: true,
          canEdit: true,
          canView: true,
          canManageTeam: true,
          canManageSettings: true,
        });
        break;
      case "editor":
        setPermissions({
          canApprove: true,
          canEdit: true,
          canView: true,
          canManageTeam: false,
          canManageSettings: false,
        });
        break;
      case "viewer":
        setPermissions({
          canApprove: false,
          canEdit: false,
          canView: true,
          canManageTeam: false,
          canManageSettings: false,
        });
        break;
      case "custom":
        // Keep current permissions
        break;
    }
  };

  const handleSave = async () => {
    try {
      await assignRole({
        userId,
        businessId,
        role: selectedRole,
        permissions,
      });
      toast.success("Role assigned successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to assign role");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Assignment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Role Display */}
        {userRole && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm">
              <strong>Current Role:</strong> <span className="capitalize">{userRole.role}</span>
            </p>
          </div>
        )}

        {/* Role Selection */}
        <div className="space-y-2">
          <Label>Select Role</Label>
          <Select value={selectedRole} onValueChange={handleRoleChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Permissions */}
        <div className="space-y-3">
          <Label>Permissions</Label>
          <div className="space-y-2">
            {[
              { key: "canApprove", label: "Can Approve Workflows" },
              { key: "canEdit", label: "Can Edit Content" },
              { key: "canView", label: "Can View Analytics" },
              { key: "canManageTeam", label: "Can Manage Team" },
              { key: "canManageSettings", label: "Can Manage Settings" },
            ].map((perm) => (
              <div key={perm.key} className="flex items-center space-x-2">
                <Checkbox
                  id={perm.key}
                  checked={permissions[perm.key as keyof typeof permissions]}
                  onCheckedChange={(checked) =>
                    setPermissions({ ...permissions, [perm.key]: checked === true })
                  }
                  disabled={selectedRole !== "custom"}
                />
                <Label htmlFor={perm.key} className="cursor-pointer">
                  {perm.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} className="w-full">
          Save Role Assignment
        </Button>
      </CardContent>
    </Card>
  );
}
