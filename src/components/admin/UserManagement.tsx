import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Mail, Search, User } from "lucide-react";

export function UserManagement() {
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [emailSubject, setEmailSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  const users = useQuery(api.adminUsers.listAllUsers, {
    limit: 200,
    searchEmail: searchEmail || undefined,
  }) as Array<{
    _id: string;
    email?: string;
    name?: string;
    isAnonymous?: boolean;
    _creationTime: number;
  }> | undefined;

  const sendAdminEmail = useMutation(api.adminUsers.sendAdminEmail);

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const selectAll = () => {
    if (!users) return;
    const allIds = users.filter(u => u.email).map(u => u._id);
    setSelectedUsers(new Set(allIds));
  };

  const clearSelection = () => {
    setSelectedUsers(new Set());
  };

  const handleSendEmail = async () => {
    if (!users || selectedUsers.size === 0) {
      toast.error("No users selected");
      return;
    }

    if (!emailSubject.trim() || !emailContent.trim()) {
      toast.error("Subject and content are required");
      return;
    }

    const recipientEmails = users
      .filter(u => selectedUsers.has(u._id) && u.email)
      .map(u => u.email!);

    if (recipientEmails.length === 0) {
      toast.error("No valid email addresses in selection");
      return;
    }

    try {
      toast.loading(`Sending email to ${recipientEmails.length} users...`);
      await sendAdminEmail({
        recipientEmails,
        subject: emailSubject,
        htmlContent: emailContent,
      });
      toast.success(`Email sent to ${recipientEmails.length} users`);
      setEmailDialogOpen(false);
      setEmailSubject("");
      setEmailContent("");
      clearSelection();
    } catch (error: any) {
      toast.error(error.message || "Failed to send email");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle id="section-user-management">User Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Manage all users in the system and send emails via configured Resend integration.
        </p>

        {/* Search and Actions */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={selectAll}>
              Select All
            </Button>
            <Button size="sm" variant="outline" onClick={clearSelection}>
              Clear
            </Button>
            <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={selectedUsers.size === 0}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email ({selectedUsers.size})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Send Email to Selected Users</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Recipients</label>
                    <div className="text-sm text-muted-foreground">
                      {selectedUsers.size} user(s) selected
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Subject</label>
                    <Input
                      placeholder="Email subject..."
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Content (HTML supported)</label>
                    <Textarea
                      placeholder="Email content..."
                      value={emailContent}
                      onChange={(e) => setEmailContent(e.target.value)}
                      rows={10}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSendEmail}>
                      Send Email
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-md border overflow-hidden">
          <div className="grid grid-cols-5 gap-2 p-3 bg-muted/40 text-xs font-medium">
            <div>Select</div>
            <div>Email</div>
            <div>Name</div>
            <div>Type</div>
            <div>Joined</div>
          </div>
          <Separator />
          <div className="divide-y max-h-[500px] overflow-y-auto">
            {(users || []).map((user) => (
              <div key={user._id} className="grid grid-cols-5 gap-2 p-3 text-sm items-center hover:bg-muted/20">
                <div>
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(user._id)}
                    onChange={() => toggleUserSelection(user._id)}
                    disabled={!user.email}
                    className="h-4 w-4"
                  />
                </div>
                <div className="truncate">{user.email || "—"}</div>
                <div className="truncate">{user.name || "—"}</div>
                <div>
                  <Badge variant={user.isAnonymous ? "secondary" : "outline"}>
                    {user.isAnonymous ? "Guest" : "Registered"}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(user._creationTime).toLocaleDateString()}
                </div>
              </div>
            ))}
            {(!users || users.length === 0) && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No users found
              </div>
            )}
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Total users: {users?.length || 0} | Selected: {selectedUsers.size}
        </div>
      </CardContent>
    </Card>
  );
}
