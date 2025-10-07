import { api, internal } from "./_generated/api";

async function validateAdminAccess(ctx: any, args: any) {
  if (args.adminToken) {
    try {
      const res: any = await ctx.runQuery(internal.adminAuthData.validateSession, { token: args.adminToken });
      if (res?.valid && res?.adminId) {
        return { isAdmin: true, adminId: res.adminId };
      }
    } catch (err) {
      console.error("Admin token validation failed:", err);
    }
  }
}