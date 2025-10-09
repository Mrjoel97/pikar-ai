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
  MessageSquare 
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  const createChannel = useMutation(api.teamChat.createChannel);
  const deleteMessage = useMutation(api.teamChat.deleteMessage);
  const addReaction = useMutation(api.teamChat.addReaction);

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

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    try {
      if (activeTab === "channels" && selectedChannelId) {
        await sendMessage({
          businessId,
          channelId: selectedChannelId,
          content: messageInput,
        });
      } else if (activeTab === "direct" && selectedUserId) {
        await sendMessage({
          businessId,
          recipientUserId: selectedUserId,
          content: messageInput,
        });
      }
      setMessageInput("");
    } catch (error: any) {
      toast.error(`Failed to send message: ${error.message}`);
    }
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
              <div key={msg._id} className="flex gap-3 group">
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
                  <p className="text-sm mt-1">{msg.content}</p>
                  
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
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
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
                activeTab === "channels"
                  ? `Message #${channels?.find((c: { _id: string; name: string }) => c._id === selectedChannelId)?.name || "channel"}`
                  : `Message ${teamMembers?.find((m: { _id: string; name: string }) => m._id === selectedUserId)?.name || "user"}`
              }
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeamChat;
