"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

const internal = require("./_generated/api").internal as any;

/**
 * Fix admin accounts that exist in adminAuths but not in admins table
 * This is a one-time fix for accounts created during the schema transition
 */
export const fixAdminAccount = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.toLowerCase().trim();

    // Check if adminAuth exists
    const adminAuth = (await ctx.runQuery(
      (internal as any)["adminAuthData"]["getAdminAuthByEmail"],
      { email: normalizedEmail } as any
    )) as any;

    if (!adminAuth) {
      throw new Error("Admin auth account not found");
    }

    // Ensure admin role exists
    await ctx.runMutation(
      (internal as any)["adminAuthData"]["ensureAdminRole"],
      {
        email: normalizedEmail,
        role: "admin",
      }
    );

    return { success: true, message: "Admin account fixed successfully" };
  },
});
