import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// Get messages for a channel with threading support
export const getMessages = query({
  args: { 
    channelId: v.id("teamChannels"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit || 5, 5); // Reduce to 5 messages max
    
    // Get only top-level messages (no parent)
    const messages = await ctx.db
      .query("teamMessages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .filter((q) => q.eq(q.field("parentMessageId"), undefined))
      .order("desc")
      .take(limit);

    // Get sender info for each message
    const messagesWithUsers = await Promise.all(
      messages.map(async (msg) => {
        const sender = await ctx.db.get(msg.senderId);
        
        // Get reply count for threading - just count, don't fetch all
        const replies = await ctx.db
          .query("teamMessages")
          .withIndex("by_parent", (q) => q.eq("parentMessageId", msg._id))
          .take(3); // Reduce reply count limit to 3
        
        // Minimal attachment data - only first 1 attachment
        const compactAttachments = (msg.attachments || []).slice(0, 1).map(att => ({
          name: att.name.substring(0, 20), // Truncate to 20 chars
          type: att.type,
        }));
        
        // Limit reactions to first 3
        const limitedReactions = (msg.reactions || []).slice(0, 3);
        
        return {
          _id: msg._id,
          channelId: msg.channelId,
          content: msg.content.substring(0, 200), // Reduce to 200 chars
          attachments: compactAttachments,
          reactions: limitedReactions,
          createdAt: msg.createdAt,
          sender: sender ? { 
            name: (sender.name || "").substring(0, 20), 
          } : null,
          replyCount: replies.length,
        };
      })
    );

    return messagesWithUsers.reverse();
  },
});

// Search messages
export const searchMessages = query({
  args: {
    businessId: v.id("businesses"),
    searchTerm: v.string(),
    channelId: v.optional(v.id("teamChannels")),
  },
  handler: async (ctx, args) => {
    let messages = await ctx.db
      .query("teamMessages")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    // Filter by channel if specified
    if (args.channelId) {
      messages = messages.filter((m) => m.channelId === args.channelId);
    }

    // Search in content
    const searchLower = args.searchTerm.toLowerCase();
    const filtered = messages.filter((m) =>
      m.content.toLowerCase().includes(searchLower)
    );

    // Get sender info
    const messagesWithUsers = await Promise.all(
      filtered.slice(0, 50).map(async (msg) => {
        const sender = await ctx.db.get(msg.senderId);
        return {
          ...msg,
          sender: sender ? { name: sender.name, email: sender.email } : null,
        };
      })
    );

    return messagesWithUsers;
  },
});

// Send a message with @mention detection
export const sendMessage = mutation({
  args: {
    businessId: v.id("businesses"),
    channelId: v.id("teamChannels"),
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

    // Extract @mentions from content
    const mentionRegex = /@(\w+)/g;
    const mentions = [...args.content.matchAll(mentionRegex)].map(m => m[1]);

    const messageId = await ctx.db.insert("teamMessages", {
      businessId: args.businessId,
      senderId: user._id,
      channelId: args.channelId,
      content: args.content,
      attachments: args.attachments,
      reactions: [],
      createdAt: Date.now(),
    });

    // Create notifications for @mentions
    if (mentions.length > 0) {
      const business = await ctx.db.get(args.businessId);
      if (business) {
        for (const mention of mentions) {
          const mentionedUser = await ctx.db
            .query("users")
            .filter((q) => 
              q.or(
                q.eq(q.field("name"), mention),
                q.eq(q.field("email"), `${mention}@`)
              )
            )
            .first();

          if (mentionedUser && mentionedUser._id !== user._id) {
            await ctx.db.insert("notifications", {
              businessId: args.businessId,
              userId: mentionedUser._id,
              type: "assignment",
              title: "You were mentioned",
              message: `${user.name || user.email} mentioned you in a message`,
              data: { messageId, channelId: args.channelId },
              isRead: false,
              priority: "medium",
              createdAt: Date.now(),
            });
          }
        }
      }
    }

    return messageId;
  },
});

// Delete a message
export const deleteMessage = mutation({
  args: { messageId: v.id("teamMessages") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();

    if (!user || message.senderId !== user._id) {
      throw new Error("Not authorized to delete this message");
    }

    await ctx.db.delete(args.messageId);
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

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();

    if (!user || message.senderId !== user._id) {
      throw new Error("Not authorized to edit this message");
    }

    await ctx.db.patch(args.messageId, {
      content: args.content,
      editedAt: Date.now(),
    });
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

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(
      (r) => r.userId === user._id && r.emoji === args.emoji
    );

    if (existingReaction) {
      // Remove reaction
      await ctx.db.patch(args.messageId, {
        reactions: message.reactions.filter(
          (r) => !(r.userId === user._id && r.emoji === args.emoji)
        ),
      });
    } else {
      // Add reaction
      await ctx.db.patch(args.messageId, {
        reactions: [...message.reactions, { userId: user._id, emoji: args.emoji }],
      });
    }
  },
});

// Get users for @mention autocomplete
export const getUsersForMention = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const business = await ctx.db.get(args.businessId);
    if (!business) return [];

    const users = await Promise.all(
      business.teamMembers.map(async (userId) => {
        const user = await ctx.db.get(userId);
        return user ? { 
          _id: user._id, 
          name: user.name || "Unknown", 
          email: user.email || "" 
        } : null;
      })
    );

    return users.filter((u) => u !== null);
  },
});
