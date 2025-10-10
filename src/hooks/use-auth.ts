import * as AuthReact from "@convex-dev/auth/react";

// Expand the adapter shape so consumers can safely destructure fields app-wide.
type UseAuthResult = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    email?: string;
    name?: string;
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

  // If the Convex auth hook exists, return it while ensuring required fields are present.
  if (typeof authModule.useAuth === "function") {
    const res = authModule.useAuth();
    return {
      ...res,
      isAuthenticated: !!res?.isAuthenticated,
      isLoading: !!res?.isLoading,
      user: res?.user ?? null,
      signIn: res?.signIn ?? (async () => {}),
      signOut: res?.signOut ?? (async () => {}),
    };
  }

  // Safe fallback for environments where the auth hook isn't available
  return {
    isAuthenticated: false,
    isLoading: false,
    user: null,
    signIn: async () => {},
    signOut: async () => {},
  };
}