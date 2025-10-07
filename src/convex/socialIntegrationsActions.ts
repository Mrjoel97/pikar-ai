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

      // Don't retry on non-transient errors
      if (!isTransientError(lastError) && attempt > 0) {
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
 * Determine if an error is transient and should be retried
 */
function isTransientError(error: Error): boolean {
  const transientPatterns = [
    "ECONNRESET",
    "ETIMEDOUT",
    "ENOTFOUND",
    "429", // Rate limit
    "500", // Server error
    "502", // Bad gateway
    "503", // Service unavailable
    "504", // Gateway timeout
  ];

  return transientPatterns.some((pattern) => error.message.includes(pattern));
}

/**
 * Post to Twitter with graceful degradation
 */
export const postToTwitter = internalAction({
  args: {
    businessId: v.id("businesses"),
    content: v.string(),
    mediaUrls: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    try {
      return await withRetry(async () => {
        console.log("[TWITTER] Would post:", args.content);
        
        // Simulate potential failures for testing
        // In production, this would be actual Twitter API calls
        
        return {
          success: true,
          postId: `twitter_${Date.now()}`,
          message: "Twitter posting not yet implemented (requires twitter-api-v2)",
        };
      });
    } catch (error) {
      // Graceful degradation: log error but don't crash
      console.error("[TWITTER] Posting failed:", error);
      return {
        success: false,
        postId: null,
        message: `Twitter posting failed: ${(error as Error).message}`,
        error: (error as Error).message,
      };
    }
  },
});

/**
 * Post to LinkedIn with graceful degradation
 */
export const postToLinkedIn = internalAction({
  args: {
    businessId: v.id("businesses"),
    content: v.string(),
    mediaUrls: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    try {
      return await withRetry(async () => {
        console.log("[LINKEDIN] Would post:", args.content);
        
        return {
          success: true,
          postId: `linkedin_${Date.now()}`,
          message: "LinkedIn posting not yet implemented (requires linkedin-api-client)",
        };
      });
    } catch (error) {
      console.error("[LINKEDIN] Posting failed:", error);
      return {
        success: false,
        postId: null,
        message: `LinkedIn posting failed: ${(error as Error).message}`,
        error: (error as Error).message,
      };
    }
  },
});

/**
 * Post to Facebook with graceful degradation
 */
export const postToFacebook = internalAction({
  args: {
    businessId: v.id("businesses"),
    content: v.string(),
    mediaUrls: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    try {
      return await withRetry(async () => {
        console.log("[FACEBOOK] Would post:", args.content);
        
        return {
          success: true,
          postId: `facebook_${Date.now()}`,
          message: "Facebook posting not yet implemented (requires fb-graph-api)",
        };
      });
    } catch (error) {
      console.error("[FACEBOOK] Posting failed:", error);
      return {
        success: false,
        postId: null,
        message: `Facebook posting failed: ${(error as Error).message}`,
        error: (error as Error).message,
      };
    }
  },
});