const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Rate limiting middleware
 * @param key - Unique identifier for rate limit (e.g., IP, API key, user ID)
 * @param limit - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if rate limit exceeded, false otherwise
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (record.count >= limit) {
    return true; // Rate limit exceeded
  }

  record.count++;
  return false;
}

/**
 * Extract rate limit key from request
 * Priority: API key > User ID > IP address
 */
export function getRateLimitKey(req: any, userId?: string): string {
  const apiKey = req.headers.get("x-api-key");
  if (apiKey) return `api:${apiKey}`;
  
  if (userId) return `user:${userId}`;
  
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  return `ip:${ip}`;
}