import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { isGuestMode } from "@/lib/guestUtils";

// Expand the adapter shape so consumers can safely destructure fields app-wide.
type UseAuthResult = {
  isAuthenticated: boolean;
  isLoading: boolean;
  isGuest: boolean;
  user: {
    email?: string;
    name?: string;
    role?: string;
    [key: string]: unknown;
  } | null;
  signIn: (provider: string, formData?: FormData) => Promise<{ signingIn: boolean; redirect?: URL }>;
  signOut: () => Promise<void>;
  [key: string]: unknown;
};

export function useAuth(): UseAuthResult {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  
  // Check if currently in guest mode
  const guestMode = isGuestMode();

  // If in guest mode, override authentication state
  if (guestMode) {
    return {
      isAuthenticated: false,
      isLoading: false,
      isGuest: true,
      user: {
        email: "guest@pikar.ai",
        name: "Guest User",
        role: "guest",
      },
      signIn,
      signOut,
    };
  }

  return {
    isAuthenticated,
    isLoading,
    isGuest: false,
    user: null, // You can fetch user details separately if needed
    signIn,
    signOut,
  };
}