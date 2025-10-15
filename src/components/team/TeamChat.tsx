import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Send, 
  Hash, 
  User, 
  Plus, 
  Smile,
  Edit2,
  Trash2,
  MessageSquare,
  Paperclip,
  Reply,
  X
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface TeamChatProps {
  businessId: Id<"businesses">;
}

export function TeamChat({ businessId }: TeamChatProps) {
  const [activeTab, setActiveTab] = useState<"channels" | "direct">("channels");
  const [selectedChannelId, setSelectedChannelId] = useState<Id<"teamChannels"> | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [attachments, setAttachments] = useState<Array<{ name: string; url: string; type: string; size?: number }>>([]);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const channels = useQuery(api.teamChat.listChannels, { businessId });
  const teamMembers = useQuery(api.teamChat.listTeamMembers, { businessId });
  const messages = useQuery(
    api.teamChat.listMessages,
    activeTab === "channels" && selectedChannelId
      ? { businessId, channelId: selectedChannelId }
      : activeTab === "direct" && selectedUserId
      ? { businessId, recipientUserId: selectedUserId }
      : "skip"
  );

  // Mutations
  const sendMessage = useMutation(api.teamChat.sendMessage);
  const sendReply = useMutation(api.teamChat.sendReply);
  const createChannel = useMutation(api.teamChat.createChannel);
  const deleteMessage = useMutation(api.teamChat.deleteMessage);
  const addReaction = useMutation(api.teamChat.addReaction);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Select first channel by default
  useEffect(() => {
    if (channels && channels.length > 0 && !selectedChannelId && activeTab === "channels") {
      setSelectedChannelId(channels[0]._id);
    }
  }, [channels, selectedChannelId, activeTab]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setUploadingFile(true);
    try {
      const { uploadUrl, storageId } = await generateUploadUrl();
      
      const uploadResult = await fetch(uploadUrl, {
        method: "POST",
        body: file,
      });

      if (!uploadResult.ok) throw new Error("Upload failed");

      const fileUrl = uploadUrl.split('?')[0];
      
      setAttachments([...attachments, {
        name: file.name,
        url: fileUrl,
        type: file.type,
        size: file.size,
      }]);
      
      toast.success("File uploaded successfully");
    } catch (error: any) {
      toast.error(`Failed to upload file: ${error.message}`);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() && attachments.length === 0) return;

    try {
      if (replyingTo) {
        await sendReply({
          businessId,
          parentMessageId: replyingTo._id,
          content: messageInput,
          attachments: attachments.length > 0 ? attachments : undefined,
        });
        setReplyingTo(null);
      } else if (activeTab === "channels" && selectedChannelId) {
        await sendMessage({
          businessId,
          channelId: selectedChannelId,
          content: messageInput,
          attachments: attachments.length > 0 ? attachments : undefined,
        });
      } else if (activeTab === "direct" && selectedUserId) {
        await sendMessage({
          businessId,
          recipientUserId: selectedUserId,
          content: messageInput,
          attachments: attachments.length > 0 ? attachments : undefined,
        });
      }
      setMessageInput("");
      setAttachments([]);
    } catch (error: any) {
      toast.error(`Failed to send message: ${error.message}`);
    }
  };

  const toggleThread = (messageId: string) => {
    const newExpanded = new Set(expandedThreads);
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId);
    } else {
      newExpanded.add(messageId);
    }
    setExpandedThreads(newExpanded);
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) {
      toast.error("Channel name is required");
      return;
    }

    try {
      await createChannel({
        businessId,
        name: newChannelName,
        description: newChannelDesc,
      });
      toast.success("Channel created!");
      setNewChannelName("");
      setNewChannelDesc("");
      setCreateChannelOpen(false);
    } catch (error: any) {
      toast.error(`Failed to create channel: ${error.message}`);
    }
  };

  const handleDeleteMessage = async (messageId: Id<"teamMessages">) => {
    try {
      await deleteMessage({ messageId });
      toast.success("Message deleted");
    } catch (error: any) {
      toast.error(`Failed to delete: ${error.message}`);
    }
  };

  const handleReaction = async (messageId: Id<"teamMessages">, emoji: string) => {
    try {
      await addReaction({ messageId, emoji });
    } catch (error: any) {
      toast.error(`Failed to add reaction: ${error.message}`);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/30">
        <div className="p-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Team Chat
          </h3>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="w-full grid grid-cols-2 m-2">
            <TabsTrigger value="channels">
              <Hash className="h-4 w-4 mr-1" />
              Channels
            </TabsTrigger>
            <TabsTrigger value="direct">
              <User className="h-4 w-4 mr-1" />
              Direct
            </TabsTrigger>
          </TabsList>

          <TabsContent value="channels" className="mt-0">
            <div className="p-2">
              <Dialog open={createChannelOpen} onOpenChange={setCreateChannelOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full mb-2">
                    <Plus className="h-4 w-4 mr-1" />
                    New Channel
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Channel</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Channel Name</Label>
                      <Input
                        value={newChannelName}
                        onChange={(e) => setNewChannelName(e.target.value)}
                        placeholder="general"
                      />
                    </div>
                    <div>
                      <Label>Description (optional)</Label>
                      <Textarea
                        value={newChannelDesc}
                        onChange={(e) => setNewChannelDesc(e.target.value)}
                        placeholder="Channel description"
                        rows={3}
                      />
                    </div>
                    <Button onClick={handleCreateChannel} className="w-full">
                      Create Channel
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <ScrollArea className="h-[450px]">
                <div className="space-y-1">
                  {channels?.map((channel: { _id: string; name: string; isPublic: boolean }) => (
                    <Button
                      key={channel._id}
                      variant={selectedChannelId === channel._id ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setSelectedChannelId(channel._id as any)}
                    >
                      <Hash className="h-4 w-4 mr-2" />
                      {channel.name}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="direct" className="mt-0">
            <ScrollArea className="h-[500px] p-2">
              <div className="space-y-1">
                {teamMembers?.map((member: { _id: string; name: string; email: string }) => (
                  <Button
                    key={member._id}
                    variant={selectedUserId === member._id ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedUserId(member._id as any)}
                  >
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarFallback className="text-xs">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{member.name}</span>
                    {(member as any).isOwner && (
                      <Badge variant="outline" className="ml-auto text-xs">
                        Owner
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            {activeTab === "channels" && selectedChannelId && (
              <>
                <Hash className="h-5 w-5" />
                <span className="font-semibold">
                  {channels?.find((c: { _id: string; name: string }) => c._id === selectedChannelId)?.name}
                </span>
              </>
            )}
            {activeTab === "direct" && selectedUserId && (
              <>
                <User className="h-5 w-5" />
                <span className="font-semibold">
                  {teamMembers?.find((m: { _id: string; name: string }) => m._id === selectedUserId)?.name}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages?.map((msg: any) => (
              <div key={msg._id} className="space-y-2">
                <div className="flex gap-3 group">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(msg.senderName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-sm">{msg.senderName}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </span>
                      {msg.editedAt && (
                        <Badge variant="outline" className="text-xs">
                          edited
                        </Badge>
                      )}
                    </div>
                    {msg.parentMessageId && (
                      <div className="text-xs text-muted-foreground mb-1">
                        Replying to a message
                      </div>
                    )}
                    <p className="text-sm mt-1">{msg.content}</p>
                    
                    {/* Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {msg.attachments.map((att: any, idx: number) => (
                          <a
                            key={idx}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-muted rounded text-xs hover:bg-muted/80"
                          >
                            <Paperclip className="h-3 w-3" />
                            <span>{att.name}</span>
                            {att.size && <span className="text-muted-foreground">({(att.size / 1024).toFixed(1)}KB)</span>}
                          </a>
                        ))}
                      </div>
                    )}
                    
                    {/* Reactions */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {msg.reactions.map((reaction: any, idx: number) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => handleReaction(msg._id, reaction.emoji)}
                          >
                            {reaction.emoji}
                          </Button>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 mt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => setReplyingTo(msg)}
                      >
                        <Reply className="h-3 w-3 mr-1" />
                        Reply
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => handleReaction(msg._id, "👍")}
                      >
                        <Smile className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => handleDeleteMessage(msg._id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t">
          {replyingTo && (
            <div className="mb-2 p-2 bg-muted rounded flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Reply className="h-4 w-4" />
                <span>Replying to {replyingTo.senderName}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachments.map((att, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-muted rounded text-xs">
                  <Paperclip className="h-3 w-3" />
                  <span>{att.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0"
                    onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,application/pdf,.doc,.docx,.txt"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFile}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={
                replyingTo
                  ? "Type your reply..."
                  : activeTab === "channels"
                  ? `Message #${channels?.find((c: { _id: string; name: string }) => c._id === selectedChannelId)?.name || "channel"}`
                  : `Message ${teamMembers?.find((m: { _id: string; name: string }) => m._id === selectedUserId)?.name || "user"}`
              }
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={!messageInput.trim() && attachments.length === 0}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeamChat;