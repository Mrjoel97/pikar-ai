import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, User, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CollaborationFeedProps {
  businessId: Id<"businesses">;
}

export function CollaborationFeed({ businessId }: CollaborationFeedProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const activities = useQuery(
    api.activityFeed.getRecent,
    businessId
      ? {
          businessId,
          limit: 20,
          searchTerm: searchTerm || undefined,
          userId: selectedUserId as Id<"users"> | undefined,
          activityTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
        }
      : "skip"
  );

  const teamMembers = useQuery(
    api.activityFeed.getTeamMembers,
    businessId ? { businessId } : "skip"
  );

  const activityTypes = useQuery(api.activityFeed.getActivityTypes);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "notification":
        return "🔔";
      case "workflow_run":
        return "⚙️";
      case "team_message":
        return "💬";
      case "goal_update":
        return "🎯";
      case "approval":
        return "✅";
      case "social_post":
        return "📱";
      default:
        return "📋";
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "succeeded":
      case "completed":
      case "approved":
      case "posted":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "failed":
      case "rejected":
        return "bg-red-500/10 text-red-700 dark:text-red-400";
      case "running":
      case "in_progress":
      case "pending":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
    }
  };

  const highlightMentions = (text: string) => {
    return text.replace(/@(\w+)/g, '<span class="text-blue-600 font-semibold">@$1</span>');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Team Collaboration Feed</span>
          <Badge variant="outline" className="ml-2">
            {activities && activities !== "skip" ? activities.length : 0} activities
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select
            value={selectedUserId || "all"}
            onValueChange={(value) => setSelectedUserId(value === "all" ? undefined : value)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <User className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All members" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All members</SelectItem>
              {teamMembers &&
                teamMembers !== "skip" &&
                teamMembers.map((member: any) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedTypes.length > 0 ? selectedTypes[0] : "all"}
            onValueChange={(value) =>
              setSelectedTypes(value === "all" ? [] : [value])
            }
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {activityTypes &&
                activityTypes !== "skip" &&
                activityTypes.map((type: any) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Activity List */}
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {!activities || activities === "skip" ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              Loading activities...
            </div>
          ) : activities.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              No activities found. {searchTerm && "Try adjusting your search."}
            </div>
          ) : (
            activities.map((activity: any) => (
              <div
                key={activity.id}
                className="flex gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{activity.title}</h4>
                      {activity.userName && (
                        <p className="text-xs text-muted-foreground">
                          by {activity.userName}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {activity.status && (
                        <Badge
                          variant="outline"
                          className={getStatusColor(activity.status)}
                        >
                          {activity.status}
                        </Badge>
                      )}
                      {activity.priority && (
                        <Badge variant="outline">{activity.priority}</Badge>
                      )}
                    </div>
                  </div>
                  <p
                    className="text-sm text-muted-foreground mt-1"
                    dangerouslySetInnerHTML={{
                      __html: highlightMentions(activity.message),
                    }}
                  />
                  {activity.mentions && activity.mentions.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {activity.mentions.map((mention: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          @{mention}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(activity.createdAt, { addSuffix: true })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}