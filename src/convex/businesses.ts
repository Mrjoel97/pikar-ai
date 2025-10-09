import { v } from "convex/values";
import { query, mutation, internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const listAllBusinesses = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("businesses").collect();
  },
});