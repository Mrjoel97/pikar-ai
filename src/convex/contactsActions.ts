"use node";

import { internalAction } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/**
 * Run auto-segmentation across all businesses.
 * Actions can't access DB directly, so we fetch business ids via internalQuery, then run the mutation.
 */
export const autoSegmentAll = internalAction({
  args: {},
  handler: async (ctx) => {
    const businessIds = (await ctx.runQuery("contacts:listBusinessIds" as any, {})) as Array<Id<"businesses">>;
    for (const businessId of businessIds) {
      await ctx.runMutation("contacts:autoSegmentContacts" as any, { businessId });
    }
  },
});
