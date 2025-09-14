import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { isGuestMode } from "@/lib/guestUtils";

import { useEffect, useState } from "react";

export function useAuth() {
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.currentUser);
  const authActions = useAuthActions();
  const signIn = authActions?.signIn ?? (async () => {});
  const signOut = authActions?.signOut ?? (async () => {});

  const [isLoading, setIsLoading] = useState(true);

  // Treat guest sessions as fully authenticated for feature access
  const guest = isGuestMode();
  const effectiveAuthenticated = isAuthenticated || guest;

  // This effect updates the loading state once auth is loaded and user data is available
  // It ensures we only show content when both authentication state and user data are ready
  useEffect(() => {
    if (!isAuthLoading && user !== undefined) {
      setIsLoading(false);
    }
  }, [isAuthLoading, user]);

  return {
    isLoading,
    isAuthenticated: effectiveAuthenticated,
    user,
    signIn,
    signOut,
  };
}