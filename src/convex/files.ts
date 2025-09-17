"use node";

import { action } from "./_generated/server";

// Generate a signed upload URL for client to PUT a file (returns {url, storageIdField: "storageId"})
export const getUploadUrl = action({
  args: {},
  handler: async (ctx) => {
    const url = await ctx.storage.generateUploadUrl();
    return { url };
  },
});
