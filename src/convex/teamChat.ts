import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// Send a message to a channel or direct message
export const sendMessage = mutation({
  args: {
    businessId: v.id("businesses"),
    channelId: v.optional(v.id("teamChannels")),
    recipientUserId: v.optional(v.id("users")),
    content: v.string(),
    attachments: v.optional(v.array(v.object({
      name: v.string(),
      url: v.string(),
      type: v.string(),
      size: v.optional(v.number()),
    }))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();
    if (!user) throw new Error("User not found");

    // Validate business membership
    const business = await ctx.db.get(args.businessId);
    if (!business) throw new Error("Business not found");
    
    const isMember = business.teamMembers.includes(user._id) || business.ownerId === user._id;
    if (!isMember) throw new Error("Not a team member");

    // Validate message type
    if (!args.channelId && !args.recipientUserId) {
      throw new Error("Must specify either channelId or recipientUserId");
    }

    const messageId = await ctx.db.insert("teamMessages", {
      businessId: args.businessId,
      senderId: user._id,
      channelId: args.channelId,
      recipientUserId: args.recipientUserId,
      content: args.content,
      parentMessageId: undefined,
      attachments: args.attachments,
      createdAt: Date.now(),
      editedAt: undefined,
      reactions: [],
    });

    // Send notification for direct messages
    if (args.recipientUserId && args.recipientUserId !== user._id) {
      await ctx.runMutation("internal:notifications:sendIfPermitted" as any, {
        userId: args.recipientUserId,
        businessId: args.businessId,
        type: "assignment",
        title: "New direct message",
        message: `${user.name}: ${args.content.slice(0, 50)}${args.content.length > 50 ? '...' : ''}`,
        priority: "medium",
      });
    }

    // Audit log
    await ctx.runMutation("audit:write" as any, {
      businessId: args.businessId,
      action: "message_sent",
      entityType: "team_message",
      entityId: String(messageId),
      details: {
        channelId: args.channelId,
        recipientUserId: args.recipientUserId ? String(args.recipientUserId) : undefined,
      },
    });

    return messageId;
  },
});

// Add: shared attachment validator
const chatAttachment = v.object({
  name: v.string(),
  url: v.string(),
  type: v.string(),
  size: v.optional(v.number()),
});

// Add: Reply to a message (thread)
export const sendReply = mutation({
  args: {
    businessId: v.id("businesses"),
    parentMessageId: v.id("teamMessages"),
    content: v.string(),
    attachments: v.optional(v.array(chatAttachment)),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();
    if (!user) throw new Error("User not found");

    const parent = await ctx.db.get(args.parentMessageId);
    if (!parent) throw new Error("Parent message not found");
    if (parent.businessId !== args.businessId) {
      throw new Error("Parent message does not belong to this business");
    }

    const now = Date.now();
    const replyId = await ctx.db.insert("teamMessages", {
      businessId: args.businessId,
      senderId: user._id,
      channelId: parent.channelId ?? undefined,
      recipientUserId: parent.recipientUserId ?? undefined,
      content: args.content,
      parentMessageId: args.parentMessageId,
      attachments: args.attachments ?? [],
      reactions: [],
      createdAt: now,
      editedAt: undefined,
    });

    // Notify DM recipient (if this thread is a DM)
    if (parent.recipientUserId) {
      const currentUserId = user._id;
      const notifyUserId =
        parent.recipientUserId === currentUserId ? parent.senderId : parent.recipientUserId;

      const preview =
        args.content.length > 120 ? `${args.content.slice(0, 117)}...` : args.content;

      await ctx.db.insert("notifications", {
        businessId: args.businessId,
        userId: notifyUserId,
        type: "system_alert",
        title: `New reply from ${user.name ?? "Teammate"}`,
        message: preview,
        data: {
          parentMessageId: args.parentMessageId,
          replyMessageId: replyId,
          channelId: parent.channelId ?? null,
          dm: true,
        },
        isRead: false,
        priority: "low",
        createdAt: now,
      });
    }

    return replyId;
  },
});

// List messages for a channel or direct conversation
export const listMessages = query({
  args: {
    businessId: v.id("businesses"),
    channelId: v.optional(v.id("teamChannels")),
    recipientUserId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();
    if (!user) return [];

    const limit = args.limit || 50;

    let messages;
    if (args.channelId) {
      // Channel messages
      messages = await ctx.db
        .query("teamMessages")
        .withIndex("by_business_and_channel", (q) => 
          q.eq("businessId", args.businessId).eq("channelId", args.channelId!)
        )
        .order("desc")
        .take(limit);
    } else if (args.recipientUserId) {
      // Direct messages between current user and recipient
      const allMessages = await ctx.db
        .query("teamMessages")
        .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
        .collect();

      messages = allMessages
        .filter(m => 
          (m.senderId === user._id && m.recipientUserId === args.recipientUserId) ||
          (m.senderId === args.recipientUserId && m.recipientUserId === user._id)
        )
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limit);
    } else {
      return [];
    }

    // Enrich with sender info
    const enriched = await Promise.all(
      messages.map(async (msg) => {
        const sender = await ctx.db.get(msg.senderId);
        // Type guard: ensure sender exists and has the expected properties
        const senderName = sender && 'name' in sender && sender.name ? sender.name : "Unknown";
        const senderEmail = sender && 'email' in sender && sender.email ? sender.email : "";
        return {
          ...msg,
          senderName,
          senderEmail,
        };
      })
    );
    return enriched.reverse(); // Return in chronological order
  },
});

// Create a channel
export const createChannel = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    isPrivate: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();
    if (!user) throw new Error("User not found");

    const channelId = await ctx.db.insert("teamChannels", {
      businessId: args.businessId,
      name: args.name,
      description: args.description,
      isPrivate: args.isPrivate || false,
      createdBy: user._id,
      createdAt: Date.now(),
    });

    await ctx.runMutation("audit:write" as any, {
      businessId: args.businessId,
      action: "channel_created",
      entityType: "team_channel",
      entityId: String(channelId),
      details: { name: args.name },
    });

    return channelId;
  },
});

// List channels for a business
export const listChannels = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const channels = await ctx.db
      .query("teamChannels")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .collect();

    return channels;
  },
});

// Edit a message
export const editMessage = mutation({
  args: {
    messageId: v.id("teamMessages"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();
    if (!user) throw new Error("User not found");

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");
    if (message.senderId !== user._id) throw new Error("Not authorized");

    await ctx.db.patch(args.messageId, {
      content: args.content,
      editedAt: Date.now(),
    });

    return { success: true };
  },
});

// Delete a message
export const deleteMessage = mutation({
  args: { messageId: v.id("teamMessages") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();
    if (!user) throw new Error("User not found");

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");
    if (message.senderId !== user._id) throw new Error("Not authorized");

    await ctx.db.delete(args.messageId);

    return { success: true };
  },
});

// Add reaction to a message
export const addReaction = mutation({
  args: {
    messageId: v.id("teamMessages"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();
    if (!user) throw new Error("User not found");

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    const hasReaction = message.reactions.some((r: any) => r.userId === user._id && r.emoji === args.emoji);

    if (hasReaction) {
      // Remove reaction if already exists
      await ctx.db.patch(args.messageId, {
        reactions: message.reactions.filter((r: any) => !(r.userId === user._id && r.emoji === args.emoji)),
      });
    } else {
      // Add new reaction
      await ctx.db.patch(args.messageId, {
        reactions: [...message.reactions, { userId: user._id, emoji: args.emoji }],
      });
    }

    return { success: true };
  },
});

// List team members for direct messaging
export const listTeamMembers = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const business = await ctx.db.get(args.businessId);
    if (!business) return [];

    const members = await Promise.all(
      [...business.teamMembers, business.ownerId].map(async (userId) => {
        const user = await ctx.db.get(userId);
        return user ? {
          _id: user._id,
          name: user.name,
          email: user.email,
          isOwner: userId === business.ownerId,
        } : null;
      })
    );

    return members.filter(Boolean);
  },
});

// Add: List thread replies (reactive)
export const getThreadReplies = query({
  args: {
    parentMessageId: v.id("teamMessages"),
  },
  handler: async (ctx, args) => {
    const replies = await ctx.db
      .query("teamMessages")
      .withIndex("by_parent", (q) => q.eq("parentMessageId", args.parentMessageId))
      .collect();

    // Default asc by _creationTime; keep as-is
    return replies;
  },
});

// Optional: DM send with notification (use on frontend if desired)
export const sendMessageWithNotify = mutation({
  args: {
    businessId: v.id("businesses"),
    channelId: v.optional(v.id("teamChannels")),
    recipientUserId: v.optional(v.id("users")),
    content: v.string(),
    attachments: v.optional(v.array(chatAttachment)),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();
    if (!user) throw new Error("User not found");

    const now = Date.now();
    const messageId = await ctx.db.insert("teamMessages", {
      businessId: args.businessId,
      senderId: user._id,
      channelId: args.channelId ?? undefined,
      recipientUserId: args.recipientUserId ?? undefined,
      content: args.content,
      attachments: args.attachments ?? [],
      reactions: [],
      createdAt: now,
      editedAt: undefined,
    });

    // Notify DM recipient
    if (args.recipientUserId) {
      const preview =
        args.content.length > 120 ? `${args.content.slice(0, 117)}...` : args.content;

      await ctx.db.insert("notifications", {
        businessId: args.businessId,
        userId: args.recipientUserId,
        type: "system_alert",
        title: `New message from ${user.name ?? "Teammate"}`,
        message: preview,
        data: {
          messageId,
          channelId: args.channelId ?? null,
          dm: true,
        },
        isRead: false,
        priority: "low",
        createdAt: now,
      });
    }

    return messageId;
  },
});