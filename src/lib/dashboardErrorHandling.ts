/**
 * Dashboard Error Handling Utilities
 * 
 * Provides standardized error handling patterns for dashboard components,
 * including consistent error messages, toast notifications, and error logging.
 */

import { toast } from "sonner";

/**
 * Standard error message prefixes for different operation types
 */
export const ERROR_PREFIXES = {
  LOAD: "Failed to load",
  CREATE: "Failed to create",
  UPDATE: "Failed to update",
  DELETE: "Failed to delete",
  APPROVE: "Failed to approve",
  REJECT: "Failed to reject",
  EXECUTE: "Failed to execute",
  FETCH: "Failed to fetch",
} as const;

/**
 * Extract error message from various error types
 * 
 * @param {unknown} error - Error object (can be Error, string, or any)
 * @returns {string} Extracted error message
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return "An unexpected error occurred";
}

/**
 * Handle dashboard mutation errors with consistent toast notifications
 * 
 * @param {unknown} error - Error object
 * @param {string} operation - Operation name (e.g., "diagnostics", "approval")
 * @param {keyof typeof ERROR_PREFIXES} [prefix="EXECUTE"] - Error prefix type
 */
export function handleMutationError(
  error: unknown,
  operation: string,
  prefix: keyof typeof ERROR_PREFIXES = "EXECUTE"
): void {
  const message = extractErrorMessage(error);
  const fullMessage = `${ERROR_PREFIXES[prefix]} ${operation}: ${message}`;
  
  toast.error(fullMessage);
  
  // Log to console for debugging
  console.error(`[Dashboard Error] ${fullMessage}`, error);
}

/**
 * Handle dashboard query errors with consistent fallback behavior
 * 
 * @param {unknown} error - Error object
 * @param {string} queryName - Query name (e.g., "KPIs", "approvals")
 * @returns {null} Always returns null for consistent fallback
 */
export function handleQueryError(error: unknown, queryName: string): null {
  const message = extractErrorMessage(error);
  const fullMessage = `${ERROR_PREFIXES.LOAD} ${queryName}: ${message}`;
  
  toast.error(fullMessage);
  console.error(`[Dashboard Query Error] ${fullMessage}`, error);
  
  return null;
}

/**
 * Wrap an async mutation function with standardized error handling
 * 
 * @param {() => Promise<T>} fn - Async function to execute
 * @param {string} operation - Operation name for error messages
 * @param {string} [successMessage] - Optional success message
 * @param {keyof typeof ERROR_PREFIXES} [errorPrefix="EXECUTE"] - Error prefix type
 * @returns {Promise<T | null>} Result of the function or null on error
 */
export async function withMutationErrorHandling<T>(
  fn: () => Promise<T>,
  operation: string,
  successMessage?: string,
  errorPrefix: keyof typeof ERROR_PREFIXES = "EXECUTE"
): Promise<T | null> {
  try {
    const result = await fn();
    if (successMessage) {
      toast.success(successMessage);
    }
    return result;
  } catch (error) {
    handleMutationError(error, operation, errorPrefix);
    return null;
  }
}

/**
 * Check if a query result is in a loading state
 * 
 * @param {T | undefined} queryResult - Query result from useQuery
 * @returns {boolean} True if loading, false otherwise
 */
export function isQueryLoading<T>(queryResult: T | undefined): queryResult is undefined {
  return queryResult === undefined;
}

/**
 * Get a loading message for a specific query
 * 
 * @param {string} queryName - Name of the query (e.g., "approvals", "KPIs")
 * @returns {string} Formatted loading message
 */
export function getLoadingMessage(queryName: string): string {
  return `Loading ${queryName}...`;
}

/**
 * Get an empty state message for a query with no results
 * 
 * @param {string} queryName - Name of the query (e.g., "approvals", "KPIs")
 * @returns {string} Formatted empty state message
 */
export function getEmptyStateMessage(queryName: string): string {
  return `No ${queryName} found.`;
}
