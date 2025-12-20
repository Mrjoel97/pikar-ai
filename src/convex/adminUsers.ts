import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Helper to check if user is platform admin
async function isPlatformAdmin(ctx: any): Promise<boolean> {
  const identity = await ctx.auth.getUserIdentity();
  const email = identity?.email?.toLowerCase();
  if (!email) return false;

  const envAllow = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (envAllow.includes(email)) return true;

  const admin = await ctx.db
    .query("admins")
    .withIndex("by_email", (q: any) => q.eq("email", email))
    .unique();
  const role = admin?.role;
  return role === "super_admin" || role === "senior" || role === "admin";
}

// List all users in the system (admin only)
export const listAllUsers = query({
  args: {
    limit: v.optional(v.number()),
    searchEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const isAdmin = await isPlatformAdmin(ctx);
    if (!isAdmin) return [];

    const limit = Math.min(args.limit ?? 100, 500);
    
    let users = await ctx.db.query("users").take(limit);
    
    // Filter by email if search term provided
    if (args.searchEmail) {
      const searchTerm = args.searchEmail.toLowerCase();
      users = users.filter((u: any) => 
        u.email?.toLowerCase().includes(searchTerm)
      );
    }

    return users.map((u: any) => ({
      _id: u._id,
      email: u.email,
      name: u.name,
      isAnonymous: u.isAnonymous,
      _creationTime: u._creationTime,
    }));
  },
});

// Get user details (admin only)
export const getUserDetails = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const isAdmin = await isPlatformAdmin(ctx);
    if (!isAdmin) throw new Error("Admin access required");

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // Find businesses this user belongs to
    const businesses = await ctx.db.query("businesses").collect();
    const userBusinesses = businesses.filter((b: any) => 
      String(b.ownerId) === String(args.userId) ||
      (Array.isArray(b.teamMembers) && b.teamMembers.some((m: any) => String(m) === String(args.userId)))
    );

    return {
      user,
      businesses: userBusinesses.map((b: any) => ({
        _id: b._id,
        name: b.name,
        plan: b.plan,
        role: String(b.ownerId) === String(args.userId) ? "owner" : "member",
      })),
    };
  },
});

// Send email to user(s) via Resend (admin only)
export const sendAdminEmail = mutation({
  args: {
    recipientEmails: v.array(v.string()),
    subject: v.string(),
    htmlContent: v.string(),
    textContent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const isAdmin = await isPlatformAdmin(ctx);
    if (!isAdmin) throw new Error("Admin access required");

    const identity = await ctx.auth.getUserIdentity();
    const adminEmail = identity?.email || "admin@pikar-ai.com";

    // Get system Resend API key
    const resendConfig = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q: any) => q.eq("key", "resendApiKey"))
      .unique();

    if (!resendConfig?.value) {
      throw new Error("Resend API key not configured in admin settings");
    }

    // Schedule email sending action for each recipient
    const internal = require("./_generated/api").internal;
    
    for (const email of args.recipientEmails) {
      await ctx.scheduler.runAfter(0, internal.adminUsersActions.sendEmailViaResend, {
        to: email,
        subject: args.subject,
        html: args.htmlContent,
        text: args.textContent || args.htmlContent.replace(/<[^>]*>/g, ""),
        resendApiKey: resendConfig.value,
        fromEmail: adminEmail,
      });
    }

    // Log audit event
    await ctx.db.insert("audit_logs", {
      businessId: "system" as any,
      action: "admin_email_sent",
      entityType: "email",
      entityId: "bulk",
      details: {
        recipientCount: args.recipientEmails.length,
        subject: args.subject,
        sentBy: adminEmail,
      },
      createdAt: Date.now(),
    });

    return { success: true, recipientCount: args.recipientEmails.length };
  },
});