import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Trash2, Edit, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

interface PublishingQueueProps {
  businessId?: Id<"businesses">;
}

export default function PublishingQueue({ businessId }: PublishingQueueProps) {
  const scheduledCapsules = useQuery(
    api.contentCapsulesData.listContentCapsules,
    businessId ? { businessId, status: "scheduled" } : "skip"
  );

  const publishedCapsules = useQuery(
    api.contentCapsulesData.listContentCapsules,
    businessId ? { businessId, status: "published", limit: 10 } : "skip"
  );

  const updateStatus = useMutation(api.contentCapsulesData.updateStatus);
  const deleteCapsule = useMutation(api.contentCapsulesData.deleteContentCapsule);

  const handleCancel = async (capsuleId: Id<"contentCapsules">) => {
    try {
      await updateStatus({ capsuleId, status: "draft" });
      toast.success("Scheduled post canceled");
    } catch (error) {
      toast.error("Failed to cancel post");
    }
  };

  const handleDelete = async (capsuleId: Id<"contentCapsules">) => {
    try {
      await deleteCapsule({ capsuleId });
      toast.success("Post deleted");
    } catch (error) {
      toast.error("Failed to delete post");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "publishing":
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
      case "published":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Scheduled Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Scheduled Posts ({scheduledCapsules?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scheduledCapsules && scheduledCapsules.length > 0 ? (
            <div className="space-y-3">
              {scheduledCapsules.map((capsule: any) => (
                <div key={capsule._id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(capsule.status)}
                      <h4 className="font-medium">{capsule.title}</h4>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Scheduled for: {new Date(capsule.scheduledAt).toLocaleString()}
                    </div>
                    <div className="flex gap-1 mt-2">
                      {capsule.platforms?.map((platform: string) => (
                        <Badge key={platform} variant="secondary" className="text-xs">
                          {platform}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancel(capsule._id)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(capsule._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No scheduled posts
            </div>
          )}
        </CardContent>
      </Card>

      {/* Publishing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Recent Published Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {publishedCapsules && publishedCapsules.length > 0 ? (
            <div className="space-y-3">
              {publishedCapsules.map((capsule: any) => (
                <div key={capsule._id} className="flex items-start justify-between p-3 border rounded-lg bg-muted/20">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(capsule.status)}
                      <h4 className="font-medium">{capsule.title}</h4>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Published: {capsule.publishedAt ? new Date(capsule.publishedAt).toLocaleString() : "N/A"}
                    </div>
                    <div className="flex gap-1 mt-2">
                      {capsule.platforms?.map((platform: string) => (
                        <Badge key={platform} variant="secondary" className="text-xs">
                          {platform}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No published posts yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
