import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MessageSquare, 
  AlertCircle,
  User,
  Calendar,
  Twitter,
  Linkedin,
  Facebook
} from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

interface ApprovalWorkflowProps {
  businessId?: Id<"businesses">;
  userId?: Id<"users">;
  userRole?: "admin" | "editor" | "viewer" | "custom";
}

export default function ApprovalWorkflow({ businessId, userId, userRole }: ApprovalWorkflowProps) {
  const [selectedApproval, setSelectedApproval] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");

  // Fetch pending approvals
  const pendingApprovals = useQuery(
    api.approvals.getApprovalQueue,
    businessId && userId ? { businessId, assigneeId: userId, status: "pending" } : "skip"
  );

  // Fetch approval history
  const approvalHistory = useQuery(
    api.approvals.getApprovalQueue,
    businessId ? { businessId } : "skip"
  );

  // Mutations
  const approveMutation = useMutation(api.approvals.approveSelf);
  const rejectMutation = useMutation(api.approvals.rejectSelf);

  // Check if user has approval permissions
  const canApprove = userRole === "admin" || userRole === "editor";

  // Handle approve action
  const handleApprove = async (approvalId: Id<"approvalQueue">) => {
    if (!canApprove) {
      toast.error("You don't have permission to approve posts");
      return;
    }

    try {
      await approveMutation({ id: approvalId });
      toast.success("Post approved successfully");
      setComment("");
      setSelectedApproval(null);
    } catch (error) {
      toast.error("Failed to approve post");
      console.error(error);
    }
  };

  // Handle reject action
  const handleReject = async (approvalId: Id<"approvalQueue">) => {
    if (!canApprove) {
      toast.error("You don't have permission to reject posts");
      return;
    }

    if (!comment.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      await rejectMutation({ id: approvalId, reason: comment });
      toast.success("Post rejected with feedback");
      setComment("");
      setSelectedApproval(null);
    } catch (error) {
      toast.error("Failed to reject post");
      console.error(error);
    }
  };

  // Get platform icon
  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "twitter":
        return <Twitter className="h-4 w-4" />;
      case "linkedin":
        return <Linkedin className="h-4 w-4" />;
      case "facebook":
        return <Facebook className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get priority badge variant
  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive";
      case "high":
        return "default";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "secondary";
    }
  };

  // Guest/unauthenticated state
  if (!businessId || !userId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Please sign in to view approval workflows</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No permission state
  if (!canApprove) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>You don't have permission to manage approvals</p>
            <p className="text-sm mt-2">Contact your administrator for access</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredHistory = approvalHistory?.filter(
    (a: any) => a.status === "approved" || a.status === "rejected"
  ) || [];

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">
            Pending ({pendingApprovals?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="history">
            History ({filteredHistory.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingApprovals === undefined ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 animate-spin" />
                  <p>Loading approvals...</p>
                </div>
              </CardContent>
            </Card>
          ) : pendingApprovals.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending approvals</p>
                  <p className="text-sm mt-2">All posts have been reviewed</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {pendingApprovals.map((approval: any) => (
                  <Card key={approval._id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-base">{approval.title}</CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>{approval.createdBy}</span>
                            <Separator orientation="vertical" className="h-4" />
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(approval._creationTime)}</span>
                          </div>
                        </div>
                        <Badge variant={getPriorityVariant(approval.priority)}>
                          {approval.priority}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {approval.description}
                      </p>

                      {approval.slaDeadline && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-orange-500" />
                          <span className="text-muted-foreground">
                            Due: {formatDate(approval.slaDeadline)}
                          </span>
                          {approval.slaDeadline < Date.now() && (
                            <Badge variant="destructive" className="ml-2">
                              Overdue
                            </Badge>
                          )}
                        </div>
                      )}

                      {selectedApproval === approval._id && (
                        <div className="space-y-3 pt-2 border-t">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 mt-1 text-muted-foreground" />
                            <Textarea
                              placeholder="Add comments or feedback (required for rejection)..."
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              className="min-h-[80px]"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-2">
                        {selectedApproval === approval._id ? (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApprove(approval._id)}
                              className="flex-1"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(approval._id)}
                              className="flex-1"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedApproval(null);
                                setComment("");
                              }}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedApproval(approval._id)}
                            className="w-full"
                          >
                            Review
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {filteredHistory.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No approval history</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {filteredHistory.map((approval: any) => (
                  <Card key={approval._id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-base">{approval.title}</CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>{approval.createdBy}</span>
                            <Separator orientation="vertical" className="h-4" />
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(approval._creationTime)}</span>
                          </div>
                        </div>
                        <Badge
                          variant={approval.status === "approved" ? "default" : "destructive"}
                        >
                          {approval.status === "approved" ? (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {approval.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {approval.description}
                      </p>

                      {approval.reviewedBy && (
                        <div className="flex items-center gap-2 text-sm pt-2 border-t">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {approval.reviewedBy.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-muted-foreground">
                            Reviewed by {approval.reviewedBy}
                          </span>
                          {approval.reviewedAt && (
                            <>
                              <Separator orientation="vertical" className="h-4" />
                              <span className="text-muted-foreground">
                                {formatDate(approval.reviewedAt)}
                              </span>
                            </>
                          )}
                        </div>
                      )}

                      {approval.comments && (
                        <div className="flex items-start gap-2 pt-2 border-t">
                          <MessageSquare className="h-4 w-4 mt-1 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground flex-1">
                            {approval.comments}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
