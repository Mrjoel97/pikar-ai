import { internal } from "./_generated/api";

async function validateAdminAccess(ctx: any, args: any) {
  if (args.adminToken) {
    try {
      // Direct database query to avoid type instantiation issues
      const session = await ctx.db
        .query("adminSessions")
        .withIndex("by_token", (q: any) => q.eq("token", args.adminToken))
        .first();
      
      if (session && session.expiresAt > Date.now()) {
        return { isAdmin: true, adminId: session.adminId };
      }
    } catch (err) {
      console.error("Admin token validation failed:", err);
    }
  }
  return { isAdmin: false, adminId: null };
}

export { validateAdminAccess };