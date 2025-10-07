/**
 * Client-side error handling utilities for social media features
 */

export interface SocialError {
  code: string;
  message: string;
  userMessage: string;
  retryable: boolean;
}

/**
 * Parse Convex error and return user-friendly message
 */
export function parseSocialError(error: any): SocialError {
  const errorMessage = error?.message || error?.toString() || "Unknown error";

  // Rate limit errors
  if (errorMessage.includes("ERR_RATE_LIMIT_EXCEEDED")) {
    return {
      code: "RATE_LIMIT",
      message: errorMessage,
      userMessage: "You've reached your posting limit for this hour. Please try again later.",
      retryable: true,
    };
  }

  // Scheduling conflict errors
  if (errorMessage.includes("ERR_SCHEDULING_CONFLICT")) {
    return {
      code: "SCHEDULING_CONFLICT",
      message: errorMessage,
      userMessage: "Another post is scheduled too close to this time. Please choose a different time slot.",
      retryable: false,
    };
  }

  // Platform limit errors
  if (errorMessage.includes("ERR_PLATFORM_LIMIT_EXCEEDED")) {
    return {
      code: "PLATFORM_LIMIT",
      message: errorMessage,
      userMessage: "You've reached the maximum number of connected platforms for your tier. Please upgrade or disconnect an existing platform.",
      retryable: false,
    };
  }

  // Authentication errors
  if (errorMessage.includes("ERR_NOT_AUTHENTICATED")) {
    return {
      code: "NOT_AUTHENTICATED",
      message: errorMessage,
      userMessage: "Please sign in to continue.",
      retryable: false,
    };
  }

  // Authorization errors
  if (errorMessage.includes("ERR_FORBIDDEN")) {
    return {
      code: "FORBIDDEN",
      message: errorMessage,
      userMessage: "You don't have permission to perform this action.",
      retryable: false,
    };
  }

  // Invalid token errors
  if (errorMessage.includes("ERR_INVALID_TOKEN")) {
    return {
      code: "INVALID_TOKEN",
      message: errorMessage,
      userMessage: "The platform connection token is invalid. Please reconnect your account.",
      retryable: false,
    };
  }

  // Network/transient errors
  if (
    errorMessage.includes("ECONNRESET") ||
    errorMessage.includes("ETIMEDOUT") ||
    errorMessage.includes("ENOTFOUND") ||
    errorMessage.includes("429") ||
    errorMessage.includes("500") ||
    errorMessage.includes("502") ||
    errorMessage.includes("503") ||
    errorMessage.includes("504")
  ) {
    return {
      code: "NETWORK_ERROR",
      message: errorMessage,
      userMessage: "Network error occurred. Please try again in a moment.",
      retryable: true,
    };
  }

  // Generic error
  return {
    code: "UNKNOWN",
    message: errorMessage,
    userMessage: "An unexpected error occurred. Please try again or contact support if the issue persists.",
    retryable: true,
  };
}

/**
 * Determine if an error should trigger a retry
 */
export function shouldRetry(error: SocialError, attemptCount: number, maxAttempts: number = 3): boolean {
  return error.retryable && attemptCount < maxAttempts;
}

/**
 * Calculate backoff delay for retries
 */
export function getRetryDelay(attemptCount: number, baseDelay: number = 1000): number {
  return Math.min(baseDelay * Math.pow(2, attemptCount), 10000); // Max 10 seconds
}

/**
 * Format error for display in toast notifications
 */
export function formatErrorForToast(error: SocialError): { title: string; description: string } {
  const titles: Record<string, string> = {
    RATE_LIMIT: "Rate Limit Reached",
    SCHEDULING_CONFLICT: "Scheduling Conflict",
    PLATFORM_LIMIT: "Platform Limit Reached",
    NOT_AUTHENTICATED: "Authentication Required",
    FORBIDDEN: "Permission Denied",
    INVALID_TOKEN: "Invalid Connection",
    NETWORK_ERROR: "Network Error",
    UNKNOWN: "Error",
  };

  return {
    title: titles[error.code] || "Error",
    description: error.userMessage,
  };
}
