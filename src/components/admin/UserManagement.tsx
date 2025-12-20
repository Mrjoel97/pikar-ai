import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, Search, User } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import { UserListItem } from "./user-management/UserListItem";
import { EmailDialog } from "./user-management/EmailDialog";
import { UserDetailsDialog } from "./user-management/UserDetailsDialog";

export function UserManagement() {
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(null);

  const users = useQuery(api.adminUsers.listAllUsers, { 
    limit: 100,
    searchEmail: searchEmail || undefined 
  });
  
  const userDetails = useQuery(
    api.adminUsers.getUserDetails,
    selectedUserId ? { userId: selectedUserId } : "skip"
  );

  const sendEmail = useMutation(api.adminUsers.sendAdminEmail);
  const toggleUserStatus = useMutation(api.adminUsers.toggleUserStatus);
  const updateUserTier = useMutation(api.adminUsers.updateUserTier);
  const updateAgentLimits = useMutation(api.adminUsers.updateAgentLimits);
  const toggleUserAgent = useMutation(api.adminUsers.toggleUserAgent);

  const handleSelectAll = () => {
    if (!users) return;
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map((u: any) => u._id)));
    }
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSendEmail = async (subject: string, content: string) => {
    if (!subject || !content) {
      toast.error("Please fill in subject and content");
      return;
    }

    const selectedEmails = users
      ?.filter((u: any) => selectedUsers.has(u._id))
      .map((u: any) => u.email)
      .filter(Boolean) as string[];

    if (!selectedEmails || selectedEmails.length === 0) {
      toast.error("No valid email addresses selected");
      return;
    }

    try {
      await sendEmail({
        recipientEmails: selectedEmails,
        subject,
        htmlContent: content,
      });
      toast.success(`Email sent to ${selectedEmails.length} user(s)`);
      setEmailDialogOpen(false);
      setSelectedUsers(new Set());
    } catch (error: any) {
      toast.error(error.message || "Failed to send email");
    }
  };

  const handleToggleUserStatus = async (userId: Id<"users">, currentStatus: boolean) => {
    try {
      await toggleUserStatus({ userId, isActive: !currentStatus });
      toast.success(`User ${!currentStatus ? "activated" : "deactivated"} successfully`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update user status");
    }
  };

  const handleUpdateTier = async (userId: Id<"users">, tier: string) => {
    try {
      await updateUserTier({ userId, tier });
      toast.success(`User tier updated to ${tier}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update tier");
    }
  };

  const handleUpdateAgentLimit = async (businessId: Id<"businesses">, maxAgents: number) => {
    try {
      await updateAgentLimits({ businessId, maxAgents });
      toast.success(`Agent limit updated to ${maxAgents}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update agent limit");
    }
  };

  const handleToggleAgent = async (agentId: Id<"aiAgents">, isActive: boolean) => {
    try {
      await toggleUserAgent({ agentId, isActive: !isActive });
      toast.success(`Agent ${!isActive ? "activated" : "deactivated"}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to toggle agent");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          User Management
        </CardTitle>
        <CardDescription>
          Manage users, send emails, and control access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Actions */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            onClick={handleSelectAll}
            disabled={!users || users.length === 0}
          >
            {selectedUsers.size === users?.length ? "Deselect All" : "Select All"}
          </Button>
          <Button 
            disabled={selectedUsers.size === 0}
            onClick={() => setEmailDialogOpen(true)}
          >
            <Mail className="h-4 w-4 mr-2" />
            Email ({selectedUsers.size})
          </Button>
        </div>

        {/* User List */}
        <div className="border rounded-lg divide-y">
          {!users ? (
            <div className="p-4 text-center text-muted-foreground">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No users found</div>
          ) : (
            users.map((user: any) => (
              <UserListItem
                key={user._id}
                user={user}
                isSelected={selectedUsers.has(user._id)}
                onSelect={handleSelectUser}
                onManage={(userId) => {
                  setSelectedUserId(userId);
                  setDetailsDialogOpen(true);
                }}
              />
            ))
          )}
        </div>

        <EmailDialog
          open={emailDialogOpen}
          onOpenChange={setEmailDialogOpen}
          selectedCount={selectedUsers.size}
          onSend={handleSendEmail}
        />

        <UserDetailsDialog
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          userDetails={userDetails || null}
          onToggleStatus={handleToggleUserStatus}
          onUpdateTier={handleUpdateTier}
          onUpdateAgentLimit={handleUpdateAgentLimit}
          onToggleAgent={handleToggleAgent}
        />

        <p className="text-sm text-muted-foreground">
          Total users: {users?.length || 0} • Selected: {selectedUsers.size}
        </p>
      </CardContent>
    </Card>
  );
}