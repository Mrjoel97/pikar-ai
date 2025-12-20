import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Mail, Search, User, Building2, Shield, Bot, Settings, CheckCircle, XCircle } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

export function UserManagement() {
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");

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

  const handleSendEmail = async () => {
    if (!emailSubject || !emailContent) {
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
        subject: emailSubject,
        htmlContent: emailContent,
      });
      toast.success(`Email sent to ${selectedEmails.length} user(s)`);
      setEmailDialogOpen(false);
      setEmailSubject("");
      setEmailContent("");
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
          <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={selectedUsers.size === 0}>
                <Mail className="h-4 w-4 mr-2" />
                Email ({selectedUsers.size})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Send Email to Selected Users</DialogTitle>
                <DialogDescription>
                  Compose an email to send to {selectedUsers.size} selected user(s)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Email subject..."
                  />
                </div>
                <div>
                  <Label htmlFor="content">HTML Content</Label>
                  <Textarea
                    id="content"
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                    placeholder="<h1>Hello!</h1><p>Your message here...</p>"
                    rows={10}
                  />
                </div>
                <Button onClick={handleSendEmail} className="w-full">
                  Send Email
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* User List */}
        <div className="border rounded-lg divide-y">
          {!users ? (
            <div className="p-4 text-center text-muted-foreground">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No users found</div>
          ) : (
            users.map((user: any) => (
              <div key={user._id} className="p-4 flex items-center gap-4 hover:bg-muted/50">
                <Checkbox
                  checked={selectedUsers.has(user._id)}
                  onCheckedChange={() => handleSelectUser(user._id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{user.email || "No email"}</p>
                    {user.isAnonymous && (
                      <Badge variant="secondary">Guest</Badge>
                    )}
                    {user.businessTier && (
                      <Badge variant="outline">{user.businessTier}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {user.name || "Unnamed"} • Joined {new Date(user._creationTime).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedUserId(user._id as Id<"users">);
                    setDetailsDialogOpen(true);
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage
                </Button>
              </div>
            ))
          )}
        </div>

        {/* User Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>User Management</DialogTitle>
              <DialogDescription>
                Manage user account, tier, and AI agent access
              </DialogDescription>
            </DialogHeader>
            
            {userDetails && (
              <div className="space-y-6">
                {/* User Info */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    User Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label>Email</Label>
                      <p className="text-muted-foreground">{userDetails.user.email || "N/A"}</p>
                    </div>
                    <div>
                      <Label>Name</Label>
                      <p className="text-muted-foreground">{userDetails.user.name || "N/A"}</p>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <div className="flex items-center gap-2">
                        {!userDetails.user.isAnonymous ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Inactive
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleUserStatus(
                            userDetails.user._id,
                            !userDetails.user.isAnonymous
                          )}
                        >
                          {!userDetails.user.isAnonymous ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label>Current Tier</Label>
                      <Select
                        value={userDetails.user.businessTier || "solopreneur"}
                        onValueChange={(tier) => handleUpdateTier(userDetails.user._id, tier)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solopreneur">Solopreneur</SelectItem>
                          <SelectItem value="startup">Startup</SelectItem>
                          <SelectItem value="sme">SME</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Business Profiles */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Business Profiles ({userDetails.businesses.length})
                  </h3>
                  <div className="space-y-3">
                    {userDetails.businesses.map((business: any) => (
                      <Card key={business._id}>
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <Label>Business Name</Label>
                              <p className="text-muted-foreground">{business.name}</p>
                            </div>
                            <div>
                              <Label>Role</Label>
                              <Badge>{business.role}</Badge>
                            </div>
                            <div>
                              <Label>Tier</Label>
                              <Badge variant="outline">{business.tier || "N/A"}</Badge>
                            </div>
                            <div>
                              <Label>Industry</Label>
                              <p className="text-muted-foreground">{business.industry || "N/A"}</p>
                            </div>
                            <div>
                              <Label>Website</Label>
                              <p className="text-muted-foreground truncate">{business.website || "N/A"}</p>
                            </div>
                            <div>
                              <Label>Location</Label>
                              <p className="text-muted-foreground">{business.location || "N/A"}</p>
                            </div>
                            <div className="col-span-2">
                              <Label>Description</Label>
                              <p className="text-muted-foreground text-xs">{business.description || "N/A"}</p>
                            </div>
                            <div>
                              <Label>Max Agents</Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="1"
                                  max="100"
                                  defaultValue={business.limits?.maxAgents || 3}
                                  className="w-20"
                                  onBlur={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (val > 0) {
                                      handleUpdateAgentLimit(business._id, val);
                                    }
                                  }}
                                />
                                <span className="text-xs text-muted-foreground">
                                  Current: {business.limits?.maxAgents || 3}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* AI Agents */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    AI Agents ({userDetails.aiAgents.length})
                  </h3>
                  <div className="space-y-2">
                    {userDetails.aiAgents.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No AI agents configured</p>
                    ) : (
                      userDetails.aiAgents.map((agent: any) => (
                        <div
                          key={agent._id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Bot className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{agent.name}</p>
                              <p className="text-xs text-muted-foreground">{agent.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {agent.isActive ? (
                              <Badge variant="default" className="gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1">
                                <XCircle className="h-3 w-3" />
                                Inactive
                              </Badge>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleAgent(agent._id, agent.isActive)}
                            >
                              {agent.isActive ? "Deactivate" : "Activate"}
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <p className="text-sm text-muted-foreground">
          Total users: {users?.length || 0} • Selected: {selectedUsers.size}
        </p>
      </CardContent>
    </Card>
  );
}