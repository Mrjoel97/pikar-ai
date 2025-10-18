import { useQuery } from "convex/react";
import { useMemo, useRef } from "react";
import type { FunctionReference, FunctionArgs } from "convex/server";

/**
 * A wrapper around useQuery that implements client-side caching
 * to reduce unnecessary re-renders and improve performance.
 * 
 * @param query - The Convex query function reference
 * @param args - The query arguments
 * @param options - Caching options
 * @returns The cached query result
 */
export function useCachedQuery<Query extends FunctionReference<"query">>(
  query: Query,
  args: FunctionArgs<Query> | "skip",
  options?: {
    cacheTime?: number; // Time in ms to cache results (default: 5000ms)
    staleTime?: number; // Time in ms before data is considered stale (default: 1000ms)
  }
) {
  const cacheTime = options?.cacheTime ?? 5000;
  const staleTime = options?.staleTime ?? 1000;
  
  const cacheRef = useRef<{
    data: any;
    timestamp: number;
    args: string;
  } | null>(null);

  const result = useQuery(query, args);
  
  const cachedResult = useMemo(() => {
    const now = Date.now();
    const argsKey = JSON.stringify(args);
    
    // If we have cached data and it's not expired
    if (
      cacheRef.current &&
      cacheRef.current.args === argsKey &&
      now - cacheRef.current.timestamp < cacheTime
    ) {
      // If data is still fresh, return cached version
      if (now - cacheRef.current.timestamp < staleTime) {
        return cacheRef.current.data;
      }
      // If data is stale but cache not expired, return cached while updating
      if (result !== undefined) {
        cacheRef.current = { data: result, timestamp: now, args: argsKey };
      }
      return cacheRef.current.data;
    }
    
    // Update cache with new data
    if (result !== undefined) {
      cacheRef.current = { data: result, timestamp: now, args: argsKey };
      return result;
    }
    
    // Return cached data if available, otherwise undefined
    return cacheRef.current?.data;
  }, [result, args, cacheTime, staleTime]);

  return cachedResult;
}
