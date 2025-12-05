import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Hash, Search } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ChannelList } from "./ChannelList";
import { MessageThread } from "./MessageThread";
import { TeamChatMessage } from "../team/TeamChatMessage";
import { MessageInput } from "../team/MessageInput";

interface ChatInterfaceProps {
  businessId: Id<"businesses">;
  currentUserId: Id<"users">;
}

export function ChatInterface({ businessId, currentUserId }: ChatInterfaceProps) {
  const [selectedChannel, setSelectedChannel] = useState<Id<"teamChannels"> | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelPrivate, setNewChannelPrivate] = useState(false);
  const [selectedThread, setSelectedThread] = useState<Id<"teamMessages"> | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [attachments, setAttachments] = useState<Array<{
    name: string;
    url: string;
    type: string;
    size?: number;
  }>>([]);
  const messageEndRef = useRef<HTMLDivElement>(null);

  const channels = useQuery(api.teamChat.channels.getChannels, { businessId });
  const messages = useQuery(
    api.teamChat.messages.getMessages,
    selectedChannel ? { channelId: selectedChannel } : "skip"
  );
  const searchResults = useQuery(
    api.teamChat.messages.searchMessages,
    showSearch && searchTerm
      ? { businessId, searchTerm, channelId: selectedChannel || undefined }
      : "skip"
  );
  const users = useQuery(api.teamChat.messages.getUsersForMention, { businessId });

  const sendMessage = useMutation(api.teamChat.messages.sendMessage);
  const createChannel = useMutation(api.teamChat.channels.createChannel);

  // Auto-scroll to bottom
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Select first channel by default
  useEffect(() => {
    if (channels && channels.length > 0 && !selectedChannel) {
      setSelectedChannel(channels[0]._id);
    }
  }, [channels, selectedChannel]);

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !selectedChannel) return;

    try {
      await sendMessage({
        businessId,
        channelId: selectedChannel,
        content: messageContent,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      setMessageContent("");
      setAttachments([]);
      toast.success("Message sent");
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;

    try {
      await createChannel({
        businessId,
        name: newChannelName,
        isPrivate: newChannelPrivate,
      });
      setNewChannelName("");
      setNewChannelPrivate(false);
      setShowNewChannel(false);
      toast.success("Channel created");
    } catch (error) {
      toast.error("Failed to create channel");
    }
  };

  const handleMessageInput = (value: string) => {
    setMessageContent(value);

    // Check for @ mentions
    const lastAtPos = value.lastIndexOf("@");
    if (lastAtPos !== -1) {
      const searchText = value.substring(lastAtPos + 1);
      if (!searchText.includes(" ")) {
        setShowMentions(true);
        setMentionSearch(searchText);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (userName: string) => {
    const lastAtPos = messageContent.lastIndexOf("@");
    const newText = messageContent.substring(0, lastAtPos) + `@${userName} `;
    setMessageContent(newText);
    setShowMentions(false);
    setMentionSearch("");
  };

  const filteredUsers = users?.filter((user: any) =>
    user.name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-4">
      {/* Channels Sidebar */}
      <ChannelList
        channels={channels}
        selectedChannel={selectedChannel}
        onChannelSelect={(channelId) => {
          setSelectedChannel(channelId);
          setSelectedThread(null);
        }}
        onNewChannel={() => setShowNewChannel(true)}
      />

      {/* Main Chat Area */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              {channels?.find((c: any) => c._id === selectedChannel)?.name || "Select a channel"}
            </CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          {showSearch && (
            <Input
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-2"
            />
          )}
        </CardHeader>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 pb-4">
            {showSearch && searchResults ? (
              searchResults.map((msg: any) => (
                <motion.div
                  key={msg._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-muted/50"
                >
                  <div className="font-semibold text-sm">{msg.sender?.name || "Unknown"}</div>
                  <p className="text-sm mt-1">{msg.content}</p>
                </motion.div>
              ))
            ) : (
              messages?.map((msg: any) => (
                <TeamChatMessage
                  key={msg._id}
                  message={msg}
                  senderName={msg.sender?.name || "Unknown"}
                  currentUserId={currentUserId}
                  onReply={(messageId) => setSelectedThread(messageId)}
                />
              ))
            )}
            <div ref={messageEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <MessageInput
          value={messageContent}
          onChange={handleMessageInput}
          onSend={handleSendMessage}
          attachments={attachments}
          onAttachmentsChange={setAttachments}
          showMentions={showMentions}
          filteredUsers={filteredUsers}
          onMentionSelect={insertMention}
        />
      </Card>

      {/* Thread Sidebar */}
      <AnimatePresence>
        {selectedThread && (
          <MessageThread
            parentMessageId={selectedThread}
            businessId={businessId}
            onClose={() => setSelectedThread(null)}
          />
        )}
      </AnimatePresence>

      {/* New Channel Dialog */}
      <Dialog open={showNewChannel} onOpenChange={setShowNewChannel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Channel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Channel name"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newChannelPrivate}
                onChange={(e) => setNewChannelPrivate(e.target.checked)}
              />
              <span className="text-sm">Private channel</span>
            </label>
            <Button onClick={handleCreateChannel} className="w-full">
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}