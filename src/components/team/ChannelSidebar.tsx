import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Hash, Plus, Building2 } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface ChannelSidebarProps {
  channels: Array<{ 
    _id: Id<"teamChannels">; 
    name: string;
    department?: string;
    isCrossDepartment?: boolean;
  }> | undefined;
  selectedChannel: Id<"teamChannels"> | null;
  onChannelSelect: (channelId: Id<"teamChannels">) => void;
  onNewChannel: () => void;
}

export function ChannelSidebar({
  channels,
  selectedChannel,
  onChannelSelect,
  onNewChannel,
}: ChannelSidebarProps) {
  // Group channels by department
  const groupedChannels = channels?.reduce((acc, channel) => {
    const dept = channel.department || "general";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(channel);
    return acc;
  }, {} as Record<string, typeof channels>);

  return (
    <Card className="w-64 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Channels</CardTitle>
          <Button size="sm" variant="ghost" onClick={onNewChannel}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-2">
          {groupedChannels && Object.entries(groupedChannels).map(([dept, deptChannels]) => (
            <div key={dept} className="space-y-1">
              <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                <Building2 className="h-3 w-3" />
                {dept}
              </div>
              {deptChannels?.map((channel) => (
                <Button
                  key={channel._id}
                  variant={selectedChannel === channel._id ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => onChannelSelect(channel._id)}
                >
                  <Hash className="h-4 w-4 mr-2" />
                  {channel.name}
                  {channel.isCrossDepartment && (
                    <Badge variant="outline" className="ml-auto text-xs">
                      Cross
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}