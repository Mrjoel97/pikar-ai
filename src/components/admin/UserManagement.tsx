import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Mail, Search, User, ChevronLeft, ChevronRight, Download, ArrowUpDown, UserCheck, UserX, Award } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import { UserListItem } from "./user-management/UserListItem";
import { EmailDialog } from "./user-management/EmailDialog";
import { UserDetailsDialog } from "./user-management/UserDetailsDialog";

export function UserManagement() {
  const [searchEmail, setSearchEmail] = useState("");
  const [filterTier, setFilterTier] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"active" | "inactive" | "all">("all");
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(null);
  const [sortBy, setSortBy] = useState<"email" | "name" | "tier" | "createdAt">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const usersData = useQuery(api.adminUsers.listAllUsers, { 
    limit: pageSize,
    offset: currentPage * pageSize,
    searchEmail: searchEmail || undefined,
    filterTier: filterTier !== "all" ? filterTier : undefined,
    filterStatus: filterStatus !== "all" ? filterStatus : undefined,
    sortBy,
    sortOrder,
  });

  const users = usersData?.users;
  const totalUsers = usersData?.total ?? 0;
  const hasMore = usersData?.hasMore ?? false;
  
  const userDetails = useQuery(
    api.adminUsers.getUserDetails,
    selectedUserId ? { userId: selectedUserId } : "skip"
  );

  const sendEmail = useMutation(api.adminUsers.sendAdminEmail);
  const updateUserTier = useMutation(api.adminUsers.updateUserTier);
  const updateAgentLimits = useMutation(api.adminUsers.updateAgentLimits);
  const toggleUserAgent = useMutation(api.adminUsers.toggleUserAgent);
  const bulkToggleStatus = useMutation(api.adminUsers.bulkToggleUserStatus);
  const bulkUpdateTier = useMutation(api.adminUsers.bulkUpdateUserTier);
  const updateBusinessProfile = useMutation(api.adminUsers.updateBusinessProfile);

  const handleSelectAll = () => {
    if (!users) return;
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map((u: any) => u._id)));
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setSelectedUsers(new Set());
  };

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(parseInt(newSize));
    setCurrentPage(0);
    setSelectedUsers(new Set());
  };

  const totalPages = Math.ceil(totalUsers / pageSize);

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

  const handleBulkActivate = async () => {
    if (selectedUsers.size === 0) {
      toast.error("No users selected");
      return;
    }

    try {
      const userIds = Array.from(selectedUsers) as Id<"users">[];
      const result = await bulkToggleStatus({ userIds, isActive: true });
      toast.success(`Activated ${result.results.filter((r: any) => r.success).length} of ${result.total} user(s)`);
      setSelectedUsers(new Set());
    } catch (error: any) {
      toast.error(error.message || "Failed to activate users");
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedUsers.size === 0) {
      toast.error("No users selected");
      return;
    }

    try {
      const userIds = Array.from(selectedUsers) as Id<"users">[];
      const result = await bulkToggleStatus({ userIds, isActive: false });
      toast.success(`Deactivated ${result.results.filter((r: any) => r.success).length} of ${result.total} user(s)`);
      setSelectedUsers(new Set());
    } catch (error: any) {
      toast.error(error.message || "Failed to deactivate users");
    }
  };

  const handleBulkUpdateTier = async (tier: string) => {
    if (selectedUsers.size === 0) {
      toast.error("No users selected");
      return;
    }

    try {
      const userIds = Array.from(selectedUsers) as Id<"users">[];
      const result = await bulkUpdateTier({ userIds, tier });
      toast.success(`Updated tier for ${result.results.filter((r: any) => r.success).length} of ${result.total} user(s)`);
      setSelectedUsers(new Set());
    } catch (error: any) {
      toast.error(error.message || "Failed to update tier");
    }
  };

  const toggleUserStatus = useMutation(api.adminUsers.toggleUserStatus);

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

  const handleExportUsers = () => {
    if (!users || users.length === 0) {
      toast.error("No users to export");
      return;
    }

    const headers = ["Email", "Name", "Tier", "Status", "Joined Date"];
    const rows = users.map((user: any) => [
      user.email || "N/A",
      user.name || "N/A",
      user.businessTier || "N/A",
      user.isAnonymous ? "Inactive" : "Active",
      new Date(user._creationTime).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row: any) => row.map((cell: any) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `users_export_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${users.length} user(s)`);
  };

  const handleUpdateBusinessProfile = async (
    businessId: Id<"businesses">,
    updates: {
      name?: string;
      industry?: string;
      website?: string;
      location?: string;
      description?: string;
    }
  ) => {
    try {
      await updateBusinessProfile({ businessId, ...updates });
      toast.success("Business profile updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update business profile");
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
        {/* Search and Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or name..."
              value={searchEmail}
              onChange={(e) => {
                setSearchEmail(e.target.value);
                setCurrentPage(0);
              }}
              className="pl-9"
            />
          </div>
          <Select value={filterTier} onValueChange={(value) => {
            setFilterTier(value);
            setCurrentPage(0);
          }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="solopreneur">Solopreneur</SelectItem>
              <SelectItem value="startup">Startup</SelectItem>
              <SelectItem value="sme">SME</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(value: any) => {
            setFilterStatus(value);
            setCurrentPage(0);
          }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions and Sorting */}
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
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
            <Button
              variant="outline"
              disabled={selectedUsers.size === 0}
              onClick={handleBulkActivate}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Activate
            </Button>
            <Button
              variant="outline"
              disabled={selectedUsers.size === 0}
              onClick={handleBulkDeactivate}
            >
              <UserX className="h-4 w-4 mr-2" />
              Deactivate
            </Button>
            <Select 
              disabled={selectedUsers.size === 0}
              onValueChange={handleBulkUpdateTier}
            >
              <SelectTrigger className="w-[160px]">
                <Award className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Update Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solopreneur">Solopreneur</SelectItem>
                <SelectItem value="startup">Startup</SelectItem>
                <SelectItem value="sme">SME</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={handleExportUsers}
              disabled={!users || users.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
          
          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Join Date</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="tier">Tier</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground">
              {sortOrder === "asc" ? "↑" : "↓"}
            </span>
          </div>
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
          onUpdateBusinessProfile={handleUpdateBusinessProfile}
        />

        {/* Pagination Controls */}
        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Showing {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, totalUsers)} of {totalUsers}
            </span>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
                <SelectItem value="100">100 / page</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage + 1} of {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!hasMore}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Selected: {selectedUsers.size} user(s)
        </p>
      </CardContent>
    </Card>
  );
}