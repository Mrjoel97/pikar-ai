import { Button } from "@/components/ui/button";

interface AuthMethodTabsProps {
  authMethod: "email" | "password" | "google";
  setAuthMethod: (method: "email" | "password" | "google") => void;
}

export function AuthMethodTabs({ authMethod, setAuthMethod }: AuthMethodTabsProps) {
  return (
    <div className="flex rounded-lg bg-muted p-1">
      <button
        type="button"
        onClick={() => setAuthMethod("password")}
        className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          authMethod === "password"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Password
      </button>
      <button
        type="button"
        onClick={() => setAuthMethod("email")}
        className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          authMethod === "email"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Email Code
      </button>
    </div>
  );
}
