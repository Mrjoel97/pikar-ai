import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Hash, Plus } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface ChannelListProps {
  channels: Array<{ _id: Id<"teamChannels">; name: string }> | undefined;
  selectedChannel: Id<"teamChannels"> | null;
  onChannelSelect: (channelId: Id<"teamChannels">) => void;
  onNewChannel: () => void;
}

export function ChannelList({
  channels,
  selectedChannel,
  onChannelSelect,
  onNewChannel,
}: ChannelListProps) {
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
        <div className="space-y-1 p-2">
          {channels?.map((channel) => (
            <Button
              key={channel._id}
              variant={selectedChannel === channel._id ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => onChannelSelect(channel._id)}
            >
              <Hash className="h-4 w-4 mr-2" />
              {channel.name}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
