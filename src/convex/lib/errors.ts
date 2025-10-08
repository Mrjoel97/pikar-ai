/**
 * Standardized Error Handling System for Pikar AI
 * 
 * This module provides a comprehensive error code system with:
 * - Categorized error codes
 * - HTTP-like status codes
 * - User-friendly messages
 * - Structured error metadata
 */

export const ErrorCategory = {
  AUTH: "AUTH",
  VALIDATION: "VALIDATION",
  PERMISSION: "PERMISSION",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMIT: "RATE_LIMIT",
  ENTITLEMENT: "ENTITLEMENT",
  INTEGRATION: "INTEGRATION",
  INTERNAL: "INTERNAL",
} as const;

export type ErrorCategory = typeof ErrorCategory[keyof typeof ErrorCategory];

export const ErrorCode = {
  // Authentication Errors (1xxx)
  AUTH_NOT_AUTHENTICATED: "AUTH_001",
  AUTH_INVALID_CREDENTIALS: "AUTH_002",
  AUTH_SESSION_EXPIRED: "AUTH_003",
  AUTH_TOKEN_INVALID: "AUTH_004",
  AUTH_PASSWORD_TOO_WEAK: "AUTH_005",
  
  // Validation Errors (2xxx)
  VALIDATION_REQUIRED_FIELD: "VAL_001",
  VALIDATION_INVALID_FORMAT: "VAL_002",
  VALIDATION_OUT_OF_RANGE: "VAL_003",
  VALIDATION_INVALID_TYPE: "VAL_004",
  VALIDATION_DUPLICATE: "VAL_005",
  
  // Permission Errors (3xxx)
  PERMISSION_DENIED: "PERM_001",
  PERMISSION_ADMIN_REQUIRED: "PERM_002",
  PERMISSION_OWNER_REQUIRED: "PERM_003",
  PERMISSION_TEAM_MEMBER_REQUIRED: "PERM_004",
  
  // Not Found Errors (4xxx)
  NOT_FOUND_RESOURCE: "NF_001",
  NOT_FOUND_USER: "NF_002",
  NOT_FOUND_BUSINESS: "NF_003",
  NOT_FOUND_WORKFLOW: "NF_004",
  NOT_FOUND_AGENT: "NF_005",
  NOT_FOUND_CONTACT: "NF_006",
  NOT_FOUND_CAMPAIGN: "NF_007",
  
  // Conflict Errors (5xxx)
  CONFLICT_ALREADY_EXISTS: "CONF_001",
  CONFLICT_DUPLICATE_EMAIL: "CONF_002",
  CONFLICT_DUPLICATE_NAME: "CONF_003",
  CONFLICT_STATE_MISMATCH: "CONF_004",
  
  // Rate Limit Errors (6xxx)
  RATE_LIMIT_EXCEEDED: "RATE_001",
  RATE_LIMIT_DAILY_QUOTA: "RATE_002",
  RATE_LIMIT_MONTHLY_QUOTA: "RATE_003",
  
  // Entitlement Errors (7xxx)
  ENTITLEMENT_TIER_LIMIT: "ENT_001",
  ENTITLEMENT_FEATURE_DISABLED: "ENT_002",
  ENTITLEMENT_UPGRADE_REQUIRED: "ENT_003",
  ENTITLEMENT_TRIAL_EXPIRED: "ENT_004",
  
  // Integration Errors (8xxx)
  INTEGRATION_API_ERROR: "INT_001",
  INTEGRATION_TIMEOUT: "INT_002",
  INTEGRATION_INVALID_CONFIG: "INT_003",
  INTEGRATION_RATE_LIMIT: "INT_004",
  
  // Internal Errors (9xxx)
  INTERNAL_SERVER_ERROR: "INT_500",
  INTERNAL_DATABASE_ERROR: "INT_501",
  INTERNAL_UNKNOWN_ERROR: "INT_502",
} as const;

export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode];

export interface ErrorMetadata {
  code: ErrorCode;
  category: ErrorCategory;
  message: string;
  httpStatus: number;
  userMessage: string;
  details?: Record<string, any>;
  timestamp?: number;
  correlationId?: string;
}

export class PikarError extends Error {
  public code: ErrorCode;
  public category: ErrorCategory;
  public httpStatus: number;
  public userMessage: string;
  public details?: Record<string, any>;
  public timestamp: number;
  public correlationId?: string;

  constructor(metadata: Partial<ErrorMetadata> & { code: ErrorCode; message: string }) {
    super(metadata.message);
    this.name = "PikarError";
    this.code = metadata.code;
    this.category = metadata.category || this.inferCategory(metadata.code);
    this.httpStatus = metadata.httpStatus || this.inferHttpStatus(this.category);
    this.userMessage = metadata.userMessage || metadata.message;
    this.details = metadata.details;
    this.timestamp = metadata.timestamp || Date.now();
    this.correlationId = metadata.correlationId || this.generateCorrelationId();
  }

  private inferCategory(code: ErrorCode): ErrorCategory {
    const prefix = code.split("_")[0];
    switch (prefix) {
      case "AUTH": return ErrorCategory.AUTH;
      case "VAL": return ErrorCategory.VALIDATION;
      case "PERM": return ErrorCategory.PERMISSION;
      case "NF": return ErrorCategory.NOT_FOUND;
      case "CONF": return ErrorCategory.CONFLICT;
      case "RATE": return ErrorCategory.RATE_LIMIT;
      case "ENT": return ErrorCategory.ENTITLEMENT;
      case "INT": return ErrorCategory.INTEGRATION;
      default: return ErrorCategory.INTERNAL;
    }
  }

  private inferHttpStatus(category: ErrorCategory): number {
    switch (category) {
      case ErrorCategory.AUTH: return 401;
      case ErrorCategory.VALIDATION: return 400;
      case ErrorCategory.PERMISSION: return 403;
      case ErrorCategory.NOT_FOUND: return 404;
      case ErrorCategory.CONFLICT: return 409;
      case ErrorCategory.RATE_LIMIT: return 429;
      case ErrorCategory.ENTITLEMENT: return 402;
      case ErrorCategory.INTEGRATION: return 502;
      case ErrorCategory.INTERNAL: return 500;
      default: return 500;
    }
  }

  private generateCorrelationId(): string {
    return `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  toJSON(): ErrorMetadata {
    return {
      code: this.code,
      category: this.category,
      message: this.message,
      httpStatus: this.httpStatus,
      userMessage: this.userMessage,
      details: this.details,
      timestamp: this.timestamp,
      correlationId: this.correlationId,
    };
  }
}

// Factory functions for common errors
export const createAuthError = (message: string, details?: Record<string, any>) =>
  new PikarError({
    code: ErrorCode.AUTH_NOT_AUTHENTICATED,
    message,
    userMessage: "Authentication required. Please sign in to continue.",
    details,
  });

export const createValidationError = (message: string, details?: Record<string, any>) =>
  new PikarError({
    code: ErrorCode.VALIDATION_REQUIRED_FIELD,
    message,
    userMessage: "Invalid input. Please check your data and try again.",
    details,
  });

export const createPermissionError = (message: string, details?: Record<string, any>) =>
  new PikarError({
    code: ErrorCode.PERMISSION_DENIED,
    message,
    userMessage: "You don't have permission to perform this action.",
    details,
  });

export const createNotFoundError = (resource: string, details?: Record<string, any>) =>
  new PikarError({
    code: ErrorCode.NOT_FOUND_RESOURCE,
    message: `${resource} not found`,
    userMessage: `The requested ${resource.toLowerCase()} could not be found.`,
    details,
  });

export const createEntitlementError = (message: string, details?: Record<string, any>) =>
  new PikarError({
    code: ErrorCode.ENTITLEMENT_TIER_LIMIT,
    message,
    userMessage: "This feature is not available on your current plan. Please upgrade to continue.",
    details,
  });

export const createRateLimitError = (message: string, details?: Record<string, any>) =>
  new PikarError({
    code: ErrorCode.RATE_LIMIT_EXCEEDED,
    message,
    userMessage: "Rate limit exceeded. Please try again later.",
    details,
  });

// Error handler wrapper for mutations and actions
export function withErrorHandling<T extends (...args: any[]) => any>(
  handler: T,
  context?: { operation?: string; module?: string }
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    try {
      return await handler(...args);
    } catch (error) {
      // If already a PikarError, rethrow with context
      if (error instanceof PikarError) {
        if (context) {
          error.details = { ...error.details, ...context };
        }
        throw error;
      }

      // Convert generic errors to PikarError
      const message = error instanceof Error ? error.message : String(error);
      throw new PikarError({
        code: ErrorCode.INTERNAL_UNKNOWN_ERROR,
        message,
        userMessage: "An unexpected error occurred. Please try again.",
        details: { ...context, originalError: message },
      });
    }
  };
}

// Helper to check if error is a specific type
export function isErrorCode(error: unknown, code: ErrorCode): boolean {
  return error instanceof PikarError && error.code === code;
}

export function isErrorCategory(error: unknown, category: ErrorCategory): boolean {
  return error instanceof PikarError && error.category === category;
}

// Audit logging helper for errors
export async function logError(
  ctx: any,
  error: PikarError,
  additionalContext?: Record<string, any>
) {
  try {
    await ctx.runMutation("audit:write" as any, {
      businessId: additionalContext?.businessId,
      action: "error_occurred",
      entityType: "system",
      entityId: error.correlationId || "unknown",
      details: {
        code: error.code,
        category: error.category,
        message: error.message,
        httpStatus: error.httpStatus,
        ...additionalContext,
      },
    });
  } catch (auditError) {
    console.error("Failed to log error to audit:", auditError);
  }
}
