import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Hash,
  Send,
  Plus,
  Search,
  Paperclip,
  Smile,
  MessageSquare,
  X,
  Edit2,
  Trash2,
  Download,
  FileText,
  Image as ImageIcon,
  File,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface TeamChatProps {
  businessId: Id<"businesses">;
}

export function TeamChat({ businessId }: TeamChatProps) {
  const [selectedChannel, setSelectedChannel] = useState<Id<"teamChannels"> | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelPrivate, setNewChannelPrivate] = useState(false);
  const [selectedThread, setSelectedThread] = useState<Id<"teamMessages"> | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [attachments, setAttachments] = useState<Array<{
    name: string;
    url: string;
    type: string;
    size?: number;
  }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);

  const channels = useQuery(api.teamChat.getChannels, { businessId });
  const messages = useQuery(
    api.teamChat.getMessages,
    selectedChannel ? { channelId: selectedChannel } : "skip"
  );
  const threadReplies = useQuery(
    api.teamChat.getThreadReplies,
    selectedThread ? { parentMessageId: selectedThread } : "skip"
  );
  const searchResults = useQuery(
    api.teamChat.searchMessages,
    showSearch && searchTerm
      ? { businessId, searchTerm, channelId: selectedChannel || undefined }
      : "skip"
  );
  const usersForMention = useQuery(api.teamChat.getUsersForMention, { businessId });

  const sendMessage = useMutation(api.teamChat.sendMessage);
  const sendReply = useMutation(api.teamChat.sendReply);
  const createChannel = useMutation(api.teamChat.createChannel);
  const addReaction = useMutation(api.teamChat.addReaction);
  const deleteMessage = useMutation(api.teamChat.deleteMessage);
  const editMessage = useMutation(api.teamChat.editMessage);

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

  const handleSendReply = async () => {
    if (!replyContent.trim() || !selectedThread) return;

    try {
      await sendReply({
        businessId,
        parentMessageId: selectedThread,
        content: replyContent,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      setReplyContent("");
      setAttachments([]);
      toast.success("Reply sent");
    } catch (error) {
      toast.error("Failed to send reply");
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

  const handleReaction = async (messageId: Id<"teamMessages">, emoji: string) => {
    try {
      await addReaction({ messageId, emoji });
    } catch (error) {
      toast.error("Failed to add reaction");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // In production, upload to storage and get URLs
    // For now, simulate with placeholder URLs
    const newAttachments = Array.from(files).map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type,
      size: file.size,
    }));

    setAttachments([...attachments, ...newAttachments]);
    toast.success(`${files.length} file(s) attached`);
  };

  const insertMention = (userName: string) => {
    const textarea = document.querySelector("textarea");
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBefore = messageContent.substring(0, cursorPos);
    const textAfter = messageContent.substring(cursorPos);
    
    // Find the @ symbol position
    const atPos = textBefore.lastIndexOf("@");
    const newText = textBefore.substring(0, atPos) + `@${userName} ` + textAfter;
    
    setMessageContent(newText);
    setShowMentions(false);
    setMentionSearch("");
  };

  const handleMessageInput = (value: string) => {
    setMessageContent(value);

    // Check for @ mentions
    const cursorPos = document.querySelector("textarea")?.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtPos = textBeforeCursor.lastIndexOf("@");
    
    if (lastAtPos !== -1 && lastAtPos === textBeforeCursor.length - 1) {
      setShowMentions(true);
      setMentionSearch("");
    } else if (lastAtPos !== -1) {
      const searchText = textBeforeCursor.substring(lastAtPos + 1);
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

  const filteredUsers = usersForMention?.filter((user) =>
    user.name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />;
    if (type.includes("pdf")) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const reactionEmojis = ["👍", "❤️", "😂", "🎉", "🚀", "👀"];

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-4">
      {/* Channels Sidebar */}
      <Card className="w-64 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Channels</CardTitle>
            <Dialog open={showNewChannel} onOpenChange={setShowNewChannel}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
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
        </CardHeader>
        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            {channels?.map((channel) => (
              <Button
                key={channel._id}
                variant={selectedChannel === channel._id ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => {
                  setSelectedChannel(channel._id);
                  setSelectedThread(null);
                }}
              >
                <Hash className="h-4 w-4 mr-2" />
                {channel.name}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Main Chat Area */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              {channels?.find((c) => c._id === selectedChannel)?.name || "Select a channel"}
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
              // Search Results
              searchResults.map((msg) => (
                <motion.div
                  key={msg._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <Avatar>
                    <AvatarFallback>
                      {msg.sender?.name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        {msg.sender?.name || "Unknown"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{msg.content}</p>
                  </div>
                </motion.div>
              ))
            ) : (
              // Regular Messages
              messages?.map((msg) => (
                <motion.div
                  key={msg._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 group"
                >
                  <Avatar>
                    <AvatarFallback>
                      {msg.sender?.name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        {msg.sender?.name || "Unknown"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </span>
                      {msg.editedAt && (
                        <Badge variant="outline" className="text-xs">
                          edited
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{msg.content}</p>

                    {/* Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {msg.attachments.map((att, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-2 rounded bg-muted/50 text-sm"
                          >
                            {getFileIcon(att.type)}
                            <span className="flex-1 truncate">{att.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(att.size)}
                            </span>
                            <Button size="sm" variant="ghost" asChild>
                              <a href={att.url} download={att.name}>
                                <Download className="h-3 w-3" />
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reactions */}
                    <div className="flex items-center gap-2 mt-2">
                      {msg.reactions.length > 0 && (
                        <div className="flex gap-1">
                          {Object.entries(
                            msg.reactions.reduce((acc, r) => {
                              acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>)
                          ).map(([emoji, count]) => (
                            <Button
                              key={emoji}
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs"
                              onClick={() => handleReaction(msg._id, emoji)}
                            >
                              {emoji} {count}
                            </Button>
                          ))}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                              <Smile className="h-3 w-3" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-2">
                            <div className="flex gap-1">
                              {reactionEmojis.map((emoji) => (
                                <Button
                                  key={emoji}
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleReaction(msg._id, emoji)}
                                >
                                  {emoji}
                                </Button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => setSelectedThread(msg._id)}
                        >
                          <MessageSquare className="h-3 w-3" />
                        </Button>
                      </div>

                      {msg.replyCount > 0 && (
                        <Button
                          size="sm"
                          variant="link"
                          className="h-6 text-xs"
                          onClick={() => setSelectedThread(msg._id)}
                        >
                          {msg.replyCount} {msg.replyCount === 1 ? "reply" : "replies"}
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
            <div ref={messageEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t">
          {attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachments.map((att, idx) => (
                <Badge key={idx} variant="secondary" className="gap-2">
                  {getFileIcon(att.type)}
                  {att.name}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-4 w-4 p-0"
                    onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}

          <div className="flex gap-2 relative">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            <div className="flex-1 relative">
              <Textarea
                placeholder="Type a message... (use @ to mention)"
                value={messageContent}
                onChange={(e) => handleMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="min-h-[60px] resize-none"
              />

              {/* @Mention Autocomplete */}
              <AnimatePresence>
                {showMentions && filteredUsers && filteredUsers.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute bottom-full left-0 mb-2 w-64 bg-popover border rounded-lg shadow-lg p-2 z-50"
                  >
                    {filteredUsers.map((user) => (
                      <Button
                        key={user._id}
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => insertMention(user.name)}
                      >
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarFallback>{user.name[0]}</AvatarFallback>
                        </Avatar>
                        {user.name}
                      </Button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Button onClick={handleSendMessage}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Thread Sidebar */}
      <AnimatePresence>
        {selectedThread && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
          >
            <Card className="w-96 flex flex-col h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Thread</CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedThread(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <ScrollArea className="flex-1 px-4">
                <div className="space-y-4 pb-4">
                  {threadReplies?.map((reply) => (
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
                            {reply.attachments.map((att, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 p-2 rounded bg-muted/50 text-xs"
                              >
                                {getFileIcon(att.type)}
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

              <div className="p-4 border-t">
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
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TeamChat;