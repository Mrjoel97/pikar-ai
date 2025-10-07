"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";

/**
 * Helper function for retry logic with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on authentication errors
      if (lastError.message.includes("401") || lastError.message.includes("403")) {
        throw lastError;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error("Max retries exceeded");
}

/**
 * Post to Twitter (placeholder - requires twitter-api-v2)
 */
export const postToTwitter = internalAction({
  args: {
    businessId: v.id("businesses"),
    content: v.string(),
    mediaUrls: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // TODO: Implement with twitter-api-v2 library
    // For now, return mock success with retry logic
    return await withRetry(async () => {
      console.log("[TWITTER] Would post:", args.content);
      
      return {
        success: true,
        postId: `twitter_${Date.now()}`,
        message: "Twitter posting not yet implemented (requires twitter-api-v2)",
      };
    });
  },
});

/**
 * Post to LinkedIn (placeholder - requires linkedin-api-client)
 */
export const postToLinkedIn = internalAction({
  args: {
    businessId: v.id("businesses"),
    content: v.string(),
    mediaUrls: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // TODO: Implement with linkedin-api-client library
    return await withRetry(async () => {
      console.log("[LINKEDIN] Would post:", args.content);
      
      return {
        success: true,
        postId: `linkedin_${Date.now()}`,
        message: "LinkedIn posting not yet implemented (requires linkedin-api-client)",
      };
    });
  },
});

/**
 * Post to Facebook (placeholder - requires fb-graph-api)
 */
export const postToFacebook = internalAction({
  args: {
    businessId: v.id("businesses"),
    content: v.string(),
    mediaUrls: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // TODO: Implement with fb-graph-api library
    return await withRetry(async () => {
      console.log("[FACEBOOK] Would post:", args.content);
      
      return {
        success: true,
        postId: `facebook_${Date.now()}`,
        message: "Facebook posting not yet implemented (requires fb-graph-api)",
      };
    });
  },
});