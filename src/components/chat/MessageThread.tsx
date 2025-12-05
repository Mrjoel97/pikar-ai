import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { X, Send } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface MessageThreadProps {
  parentMessageId: Id<"teamMessages"> | null;
  businessId: Id<"businesses">;
  onClose: () => void;
}

export function MessageThread({ parentMessageId, businessId, onClose }: MessageThreadProps) {
  const [replyContent, setReplyContent] = useState("");
  
  const threadReplies = useQuery(
    api.teamChat.threads.getThreadReplies,
    parentMessageId ? { parentMessageId } : "skip"
  );
  
  const sendReply = useMutation(api.teamChat.threads.sendReply);

  const handleSendReply = async () => {
    if (!replyContent.trim() || !parentMessageId) return;

    try {
      await sendReply({
        businessId,
        parentMessageId,
        content: replyContent,
      });
      setReplyContent("");
      toast.success("Reply sent");
    } catch (error) {
      toast.error("Failed to send reply");
    }
  };

  if (!parentMessageId) return null;

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
    >
      <Card className="w-96 flex flex-col h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Thread</CardTitle>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 pb-4">
            {threadReplies?.map((reply: any) => (
              <motion.div
                key={reply._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {reply.sender?.name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      {reply.sender?.name || "Unknown"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(reply.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{reply.content}</p>

                  {reply.attachments && reply.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {reply.attachments.map((att: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2 rounded bg-muted/50 text-xs"
                        >
                          <span className="flex-1 truncate">{att.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>

        <CardContent className="p-4 border-t">
          <div className="flex gap-2">
            <Textarea
              placeholder="Reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendReply();
                }
              }}
              className="min-h-[60px] resize-none"
            />
            <Button onClick={handleSendReply}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}