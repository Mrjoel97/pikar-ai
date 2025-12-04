import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Smile, Reply, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";

interface TeamChatMessageProps {
  message: {
    _id: Id<"teamMessages">;
    senderId: Id<"users">;
    content: string;
    createdAt: number;
    editedAt?: number;
    reactions: Array<{ userId: Id<"users">; emoji: string }>;
    attachments?: Array<{ name: string; url: string; type: string }>;
  };
  senderName: string;
  currentUserId: Id<"users">;
  onReply: (messageId: Id<"teamMessages">) => void;
}

export function TeamChatMessage({
  message,
  senderName,
  currentUserId,
  onReply,
}: TeamChatMessageProps) {
  const [showReactions, setShowReactions] = useState(false);
  const addReaction = useMutation(api.teamChat.addReaction);
  const deleteMessage = useMutation(api.teamChat.deleteMessage);

  const handleReaction = async (emoji: string) => {
    await addReaction({
      messageId: message._id,
      emoji,
    });
    setShowReactions(false);
  };

  const handleDelete = async () => {
    await deleteMessage({ messageId: message._id });
  };

  const reactionCounts = message.reactions.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="group flex gap-3 px-4 py-2 hover:bg-muted/50">
      <Avatar className="h-8 w-8">
        <AvatarFallback>{senderName[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-sm">{senderName}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(message.createdAt, { addSuffix: true })}
          </span>
          {message.editedAt && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
        </div>
        <p className="text-sm mt-1 whitespace-pre-wrap">{message.content}</p>
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.attachments.map((att, idx) => (
              <a
                key={idx}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline block"
              >
                📎 {att.name}
              </a>
            ))}
          </div>
        )}
        {Object.keys(reactionCounts).length > 0 && (
          <div className="flex gap-1 mt-2">
            {Object.entries(reactionCounts).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="px-2 py-0.5 text-xs bg-muted rounded-full hover:bg-muted/80"
              >
                {emoji} {count}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="opacity-0 group-hover:opacity-100 flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setShowReactions(!showReactions)}
        >
          <Smile className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onReply(message._id)}
        >
          <Reply className="h-4 w-4" />
        </Button>
        {message.senderId === currentUserId && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleDelete}>Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {showReactions && (
        <div className="absolute mt-8 bg-popover border rounded-lg shadow-lg p-2 flex gap-1">
          {["👍", "❤️", "😂", "🎉", "🚀", "👀"].map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className="text-xl hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
