import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const getCustomerContext = internalQuery({
  args: {
    businessId: v.id("businesses"),
    recipientEmail: v.string(),
  },
  handler: async (ctx, args) => {
    // Get contact info
    const contact = await ctx.db
      .query("contacts")
      .withIndex("by_business_and_email", (q) =>
        q.eq("businessId", args.businessId).eq("email", args.recipientEmail)
      )
      .first();

    // Get recent emails to/from this recipient
    const recentEmails = await ctx.db
      .query("emails")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) =>
        q.or(
          q.eq(q.field("fromEmail"), args.recipientEmail),
          q.eq(q.field("recipients"), [args.recipientEmail])
        )
      )
      .order("desc")
      .take(5);

    // Get recent audit activity
    const recentActivity = await ctx.db
      .query("audit_logs")
      .filter((q) =>
        q.and(
          q.eq(q.field("businessId"), args.businessId),
          q.eq(q.field("details"), { email: args.recipientEmail })
        )
      )
      .order("desc")
      .take(5);

    return {
      contact,
      recentEmails,
      recentActivity,
    };
  },
});