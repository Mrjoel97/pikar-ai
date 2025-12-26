const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : undefined;

function AppProviders({ children }: { children: React.ReactNode }) {
  if (!convex) {
     // error
  }
  return <ConvexAuthProvider client={convex}>{children}</ConvexAuthProvider>;
}