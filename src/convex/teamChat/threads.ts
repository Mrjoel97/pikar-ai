import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// Get thread replies for a message
export const getThreadReplies = query({
  args: { parentMessageId: v.id("teamMessages") },
  handler: async (ctx, args) => {
    const replies = await ctx.db
      .query("teamMessages")
      .withIndex("by_parent", (q) => q.eq("parentMessageId", args.parentMessageId))
      .order("asc")
      .collect();

    const repliesWithUsers = await Promise.all(
      replies.map(async (msg) => {
        const sender = await ctx.db.get(msg.senderId);
        return {
          ...msg,
          sender: sender ? { name: sender.name, email: sender.email } : null,
        };
      })
    );

    return repliesWithUsers;
  },
});

// Send a reply to a message (threaded)
export const sendReply = mutation({
  args: {
    businessId: v.id("businesses"),
    parentMessageId: v.id("teamMessages"),
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

    const parentMessage = await ctx.db.get(args.parentMessageId);
    if (!parentMessage) throw new Error("Parent message not found");

    // Extract @mentions
    const mentionRegex = /@(\w+)/g;
    const mentions = [...args.content.matchAll(mentionRegex)].map(m => m[1]);

    const replyId = await ctx.db.insert("teamMessages", {
      businessId: args.businessId,
      senderId: user._id,
      channelId: parentMessage.channelId,
      parentMessageId: args.parentMessageId,
      content: args.content,
      attachments: args.attachments,
      reactions: [],
      createdAt: Date.now(),
    });

    // Notify parent message author
    if (parentMessage.senderId !== user._id) {
      await ctx.db.insert("notifications", {
        businessId: args.businessId,
        userId: parentMessage.senderId,
        type: "assignment",
        title: "New reply to your message",
        message: `${user.name || user.email} replied to your message`,
        data: { messageId: replyId, parentMessageId: args.parentMessageId },
        isRead: false,
        priority: "medium",
        createdAt: Date.now(),
      });
    }

    // Create notifications for @mentions
    if (mentions.length > 0) {
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
            title: "You were mentioned in a reply",
            message: `${user.name || user.email} mentioned you in a reply`,
            data: { messageId: replyId, parentMessageId: args.parentMessageId },
            isRead: false,
            priority: "medium",
            createdAt: Date.now(),
          });
        }
      }
    }

    return replyId;
  },
});
