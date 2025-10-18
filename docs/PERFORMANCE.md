# Performance Optimization Guide

## Implemented Optimizations

### 1. Query Result Caching
- **Hook**: `useCachedQuery` in `src/hooks/use-cached-query.ts`
- **Usage**: Wrap Convex queries to cache results client-side
- **Benefits**: Reduces unnecessary re-renders and API calls
- **Configuration**: Adjustable cache time and stale time

