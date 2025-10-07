import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Social Media Documentation Module
 * Provides tier-specific guides and troubleshooting information
 */

export const getSocialMediaGuide = query({
  args: { tier: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const tier = args.tier || "solopreneur";
    
    const guides = {
      solopreneur: {
        title: "Social Media for Solopreneurs",
        overview: "Connect up to 2 social media platforms and schedule 30 posts per month with AI-powered content generation.",
        quickStart: [
          "1. Navigate to Social Media from your dashboard",
          "2. Click 'Connect Account' and authorize Twitter or LinkedIn",
          "3. Use the Post Composer to create your first post",
          "4. Schedule it for optimal engagement time (AI-suggested)",
          "5. Track basic analytics on the Analytics tab"
        ],
        features: [
          "Connect 2 platforms (Twitter, LinkedIn, or Facebook)",
          "Schedule up to 30 posts per month",
          "AI content generation (20 generations/month)",
          "Basic analytics (engagement, reach)",
          "Optimal posting time suggestions"
        ],
        tips: [
          "Use AI generation to create engaging content quickly",
          "Schedule posts during suggested optimal times for better reach",
          "Review analytics weekly to understand what content performs best",
          "Keep a consistent posting schedule (2-3 times per week)"
        ]
      },
      startup: {
        title: "Social Media for Startups",
        overview: "Collaborate with your team across 3 platforms, schedule 100 posts per month, and track detailed performance metrics.",
        quickStart: [
          "1. Connect up to 3 social media accounts",
          "2. Set up approval workflows for team collaboration",
          "3. Use the Post Composer with team member mentions",
          "4. Schedule posts in bulk using the calendar view",
          "5. Monitor team performance and engagement metrics"
        ],
        features: [
          "Connect 3 platforms",
          "Schedule up to 100 posts per month",
          "AI content generation (100 generations/month)",
          "Team collaboration and approval workflows",
          "Advanced analytics with engagement trends",
          "Bulk scheduling capabilities"
        ],
        tips: [
          "Set up approval workflows to maintain brand consistency",
          "Use bulk scheduling to plan content weeks in advance",
          "Assign team members to specific platforms or content types",
          "Review weekly analytics to optimize posting strategy",
          "A/B test different content types and posting times"
        ]
      },
      sme: {
        title: "Social Media for SMEs",
        overview: "Manage multi-brand presence across 5 platforms with advanced analytics, competitor tracking, and ROI measurement.",
        quickStart: [
          "1. Connect up to 5 social media accounts across brands",
          "2. Configure multi-level approval workflows",
          "3. Set up competitor tracking and benchmarking",
          "4. Use advanced analytics to measure ROI per platform",
          "5. Generate compliance reports for stakeholders"
        ],
        features: [
          "Connect 5 platforms",
          "Schedule up to 500 posts per month",
          "AI content generation (500 generations/month)",
          "Multi-brand management",
          "Competitor analysis and benchmarking",
          "ROI tracking per platform",
          "Advanced analytics with custom reports",
          "Compliance and governance controls"
        ],
        tips: [
          "Use competitor analysis to identify content gaps and opportunities",
          "Track ROI per platform to optimize budget allocation",
          "Set up department-specific approval chains",
          "Generate monthly reports for executive review",
          "Use advanced scheduling to maintain consistent multi-brand presence"
        ]
      },
      enterprise: {
        title: "Social Media for Enterprise",
        overview: "Global multi-brand orchestration with unlimited platforms, API access, white-label reporting, and crisis management.",
        quickStart: [
          "1. Connect unlimited social media accounts globally",
          "2. Configure API access for custom integrations",
          "3. Set up white-label reporting for clients/brands",
          "4. Enable crisis management workflows",
          "5. Use API for programmatic post management"
        ],
        features: [
          "Unlimited platforms and posts",
          "Full API access for custom integrations",
          "White-label reporting and branding",
          "Crisis management and sentiment monitoring",
          "Global multi-brand orchestration",
          "Advanced AI with custom models",
          "Real-time analytics and alerting",
          "Dedicated support and SLA"
        ],
        tips: [
          "Leverage API for custom workflows and integrations",
          "Set up automated crisis detection and response protocols",
          "Use white-label reporting for client presentations",
          "Implement global governance policies across all brands",
          "Monitor sentiment in real-time for proactive management"
        ],
        apiIntegration: {
          authentication: "Use Bearer token or API key in X-API-Key header",
          endpoints: [
            "POST /api/social/posts/create - Create and schedule posts",
            "GET /api/social/analytics - Retrieve performance metrics",
            "GET /api/social/accounts - List connected accounts",
            "PUT /api/social/posts/:id - Update scheduled posts",
            "DELETE /api/social/posts/:id - Delete posts"
          ],
          webhooks: [
            "post.published - Triggered when a post goes live",
            "post.failed - Triggered when posting fails",
            "account.disconnected - Triggered when account token expires",
            "analytics.threshold - Triggered when metrics hit thresholds"
          ]
        }
      }
    };

    return guides[tier as keyof typeof guides] || guides.solopreneur;
  }
});

export const getTroubleshootingGuide = query({
  args: {},
  handler: async () => {
    return {
      title: "Social Media Troubleshooting Guide",
      commonIssues: [
        {
          issue: "Cannot connect social media account",
          causes: [
            "Browser blocking pop-ups",
            "Account already connected to another business",
            "Platform API temporarily unavailable"
          ],
          solutions: [
            "Enable pop-ups for this site in browser settings",
            "Disconnect account from other business first",
            "Wait 5-10 minutes and try again",
            "Clear browser cache and cookies, then retry"
          ]
        },
        {
          issue: "Post failed to publish",
          causes: [
            "Account token expired",
            "Content violates platform policies",
            "Platform API rate limit exceeded",
            "Network connectivity issue"
          ],
          solutions: [
            "Reconnect the social media account",
            "Review and modify content to comply with platform guidelines",
            "Wait for rate limit reset (usually 15 minutes)",
            "Check internet connection and retry",
            "Contact support if issue persists"
          ]
        },
        {
          issue: "Scheduled post not appearing",
          causes: [
            "Scheduling conflict with another post",
            "Post scheduled in the past",
            "Account disconnected before scheduled time"
          ],
          solutions: [
            "Check for other posts scheduled within 5 minutes",
            "Verify scheduled time is in the future",
            "Ensure account is still connected",
            "Reschedule to a different time slot"
          ]
        },
        {
          issue: "Analytics not updating",
          causes: [
            "Platform API delay (can take 1-2 hours)",
            "Account permissions insufficient",
            "Post too recent (less than 1 hour old)"
          ],
          solutions: [
            "Wait 2-4 hours for platform data to sync",
            "Reconnect account with full permissions",
            "Check back after post has been live for at least 1 hour",
            "Refresh the analytics page"
          ]
        },
        {
          issue: "Reached monthly post limit",
          causes: [
            "Tier limit reached",
            "Counting includes deleted/failed posts"
          ],
          solutions: [
            "Upgrade to higher tier for more posts",
            "Wait for monthly reset (1st of each month)",
            "Delete unnecessary scheduled posts to free up quota",
            "Contact sales for temporary limit increase"
          ]
        },
        {
          issue: "AI content generation not working",
          causes: [
            "Monthly AI generation limit reached",
            "Input prompt too vague or too long",
            "Temporary AI service unavailable"
          ],
          solutions: [
            "Check remaining AI generations in your tier",
            "Provide more specific, concise prompts",
            "Try again in a few minutes",
            "Use manual content creation as fallback"
          ]
        }
      ],
      errorCodes: [
        {
          code: "ERR_INVALID_TOKEN",
          meaning: "Social media account authentication has expired",
          action: "Reconnect the account through Account Connector"
        },
        {
          code: "ERR_RATE_LIMIT",
          meaning: "Monthly post limit reached for your tier",
          action: "Upgrade tier or wait for monthly reset"
        },
        {
          code: "ERR_SCHEDULING_CONFLICT",
          meaning: "Another post scheduled within 5 minutes",
          action: "Choose a different time slot"
        },
        {
          code: "ERR_PLATFORM_LIMIT_EXCEEDED",
          meaning: "Maximum connected platforms reached",
          action: "Upgrade tier or disconnect unused platforms"
        },
        {
          code: "ERR_CONTENT_TOO_LONG",
          meaning: "Post content exceeds platform character limit",
          action: "Shorten content or split into multiple posts"
        },
        {
          code: "ERR_MEDIA_UPLOAD_FAILED",
          meaning: "Media file upload failed",
          action: "Check file size (max 10MB) and format, then retry"
        }
      ],
      bestPractices: [
        "Always test account connections after setup",
        "Schedule posts at least 1 hour in advance",
        "Review analytics weekly to optimize strategy",
        "Keep account tokens fresh by reconnecting monthly",
        "Use AI suggestions for optimal posting times",
        "Monitor error notifications and act promptly",
        "Maintain backup content for failed posts"
      ]
    };
  }
});
