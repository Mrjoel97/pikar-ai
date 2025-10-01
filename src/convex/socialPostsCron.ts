"use node";

import { internalAction } from "./_generated/server";
import { internal, api } from "./_generated/api";

/**
 * Process due social posts (called by cron every 5 minutes)
 */
export const processSocialPosts = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log("[CRON] Processing social posts...");

    // Get due posts
    const duePosts = await ctx.runQuery(internal.socialPosts.listDuePosts);

    console.log(`[CRON] Found ${duePosts.length} due posts`);

    for (const post of duePosts) {
      try {
        // Update status to posting
        await ctx.runMutation(api.socialPosts.updatePostStatus, {
          postId: post._id,
          status: "posting",
        });

        const postIds: any = {};
        let allSuccess = true;
        let errorMessage = "";

        // Post to each platform
        for (const platform of post.platforms) {
          try {
            let result: { success: boolean; postId?: string; message?: string } = { success: false };
            if (platform === "twitter") {
              result = await ctx.runAction(internal.socialIntegrationsActions.postToTwitter, {
                businessId: post.businessId,
                content: post.content,
                mediaUrls: post.mediaUrls?.map(String),
              });
              if (result.success && result.postId) postIds.twitter = result.postId;
            } else if (platform === "linkedin") {
              result = await ctx.runAction(internal.socialIntegrationsActions.postToLinkedIn, {
                businessId: post.businessId,
                content: post.content,
                mediaUrls: post.mediaUrls?.map(String),
              });
              if (result.success && result.postId) postIds.linkedin = result.postId;
            } else if (platform === "facebook") {
              result = await ctx.runAction(internal.socialIntegrationsActions.postToFacebook, {
                businessId: post.businessId,
                content: post.content,
                mediaUrls: post.mediaUrls?.map(String),
              });
              if (result.success && result.postId) postIds.facebook = result.postId;
            }
          } catch (err: any) {
            allSuccess = false;
            errorMessage += `${platform}: ${err.message}; `;
            console.error(`[CRON] Error posting to ${platform}:`, err);
          }
        }

        // Update final status
        if (allSuccess) {
          await ctx.runMutation(api.socialPosts.updatePostStatus, {
            postId: post._id,
            status: "posted",
            postedAt: Date.now(),
            postIds,
          });

          // Log success audit
          // Log success audit
          try {
            await ctx.runMutation(internal.audit.write, {
              businessId: post.businessId,
              action: "social_post_published",
              entityType: "social_post",
              entityId: post._id,
              details: {
                platforms: post.platforms,
                postIds,
              },
            });
          } catch (auditErr) {
            console.error("[CRON] Audit log failed:", auditErr);
          }
        } else {
          await ctx.runMutation(api.socialPosts.updatePostStatus, {
            postId: post._id,
            status: "failed",
            errorMessage: errorMessage.trim(),
            postIds: Object.keys(postIds).length > 0 ? postIds : undefined,
          });

          // Log failure audit
          // Log failure audit
          try {
            await ctx.runMutation(internal.audit.write, {
              businessId: post.businessId,
              action: "social_post_failed",
              entityType: "social_post",
              entityId: post._id,
              details: {
                platforms: post.platforms,
                errorMessage,
              },
            });
          } catch (auditErr) {
            console.error("[CRON] Audit log failed:", auditErr);
          }
        }
      } catch (err: any) {
        console.error(`[CRON] Error processing post ${post._id}:`, err);
        
        // Mark as failed
        await ctx.runMutation(api.socialPosts.updatePostStatus, {
          postId: post._id,
          status: "failed",
          errorMessage: err.message,
        });
      }
    }

    console.log("[CRON] Social posts processing complete");
  },
});
