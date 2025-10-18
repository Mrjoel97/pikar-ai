import * as AuthReact from "@convex-dev/auth/react";
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
  signIn: (provider: string, formData?: FormData) => Promise<void>;
  signOut: () => Promise<void>;
  [key: string]: unknown; // allow passthrough of additional fields from the underlying hook
};

export function useAuth(): UseAuthResult {
  const authModule = AuthReact as {
    useAuth?: () => Partial<UseAuthResult>;
  };

  // Check if currently in guest mode
  const guestMode = isGuestMode();

  // If the Convex auth hook exists, return it while ensuring required fields are present.
  if (typeof authModule.useAuth === "function") {
    const res = authModule.useAuth();
    
    // If in guest mode, override authentication state
    if (guestMode) {
      return {
        ...res,
        isAuthenticated: false,
        isLoading: false,
        isGuest: true,
        user: {
          email: "guest@pikar.ai",
          name: "Guest User",
          role: "guest",
        },
        signIn: res?.signIn ?? (async () => {}),
        signOut: res?.signOut ?? (async () => {}),
      };
    }

    return {
      ...res,
      isAuthenticated: !!res?.isAuthenticated,
      isLoading: !!res?.isLoading,
      isGuest: false,
      user: res?.user ?? null,
      signIn: res?.signIn ?? (async () => {}),
      signOut: res?.signOut ?? (async () => {}),
    };
  }

  // Safe fallback for environments where the auth hook isn't available
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
      signIn: async () => {},
      signOut: async () => {},
    };
  }

  return {
    isAuthenticated: false,
    isLoading: false,
    isGuest: false,
    user: null,
    signIn: async () => {},
    signOut: async () => {},
  };
}