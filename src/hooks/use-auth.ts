import * as AuthReact from "@convex-dev/auth/react";

// Expand the adapter shape so consumers can safely destructure fields app-wide.
type UseAuthResult = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  signIn: (provider: string, formData?: FormData) => Promise<any>;
  signOut: () => Promise<any>;
  [key: string]: any; // allow passthrough of additional fields from the underlying hook
};

export function useAuth(): UseAuthResult {
  const anyMod = AuthReact as any;

  // If the Convex auth hook exists, return it while ensuring required fields are present.
  if (typeof anyMod.useAuth === "function") {
    const res: any = anyMod.useAuth();
    return {
      ...res,
      isAuthenticated: !!res?.isAuthenticated,
      isLoading: !!res?.isLoading,
      user: res?.user ?? null,
      signIn: (res?.signIn ?? (async () => {})) as any,
      signOut: (res?.signOut ?? (async () => {})) as any,
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