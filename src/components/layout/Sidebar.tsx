import { Input } from "@/components/ui/input";
import { LogOut } from "lucide-react";
import React from "react";

type NavItem = { label: string; icon: React.ComponentType<any>; to: string };

type SidebarProps = {
  items: Array<NavItem>;
  userDisplay?: string;
  planLabel?: string;
  onNavigate: (to: string) => void;
  onLogout: () => void;
  featureHighlights?: string[];
  logoUrl?: string;
  primaryColor?: string;
};

export function Sidebar({
  items,
  userDisplay,
  planLabel,
  onNavigate,
  onLogout,
  featureHighlights,
  logoUrl,
  primaryColor,
}: SidebarProps) {
  const bgStyle = primaryColor 
    ? { background: `linear-gradient(to bottom, ${primaryColor}, ${primaryColor}dd)` }
    : {};

  return (
    <aside 
      className="hidden md:flex fixed left-0 top-0 bottom-0 w-72 bg-gradient-to-b from-emerald-900 to-emerald-800 text-white"
      style={bgStyle}
    >
      <div className="flex flex-col h-full w-full p-4">
        {/* Logo Section */}
        {logoUrl && (
          <div className="mb-4 flex justify-center">
            <img 
              src={logoUrl} 
              alt="Company Logo" 
              className="h-12 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}

        {/* Search */}
        <div className="mb-4">
          <Input
            aria-label="Search navigation"
            placeholder="Search..."
            className="bg-white text-emerald-900 placeholder:text-emerald-600 border-white/30"
          />
        </div>

        {/* Menu label */}
        <div className="text-[11px] uppercase tracking-wider text-emerald-200/80 mb-2">
          Menu
        </div>

        {/* Nav items */}
        <nav className="space-y-1 overflow-y-auto pr-1">
          {items.map((item) => (
            <button
              key={`${item.label}-${item.to}`}
              onClick={() => onNavigate(item.to)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/10 transition"
            >
              <item.icon className="h-4 w-4" />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom section: user + logout */}
        <div className="space-y-2">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-sm font-medium truncate">
              {userDisplay || "User"}
            </div>
            {planLabel && (
              <div className="text-xs text-emerald-100/80">{planLabel}</div>
            )}
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-white/10 hover:bg-white/15 transition"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm">Logout</span>
          </button>
        </div>

        {/* Learning Hub Shortcut */}
        <a
          href="/learning-hub"
          onClick={(e) => {
            e.preventDefault();
            onNavigate("/learning-hub");
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground"
          data-testid="sidebar-learninghub-link"
          aria-label="Open Learning Hub"
          role="button"
        >
          <span className="i-lucide-graduation-cap w-4 h-4" />
          <span>Learning Hub</span>
        </a>

        {/* Settings Shortcut */}
        <a
          href="/settings"
          onClick={(e) => {
            e.preventDefault();
            onNavigate("/settings");
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground"
          data-testid="sidebar-settings-link"
          aria-label="Open settings"
          role="button"
        >
          <span className="i-lucide-settings w-4 h-4" />
          <span>Settings</span>
        </a>
      </div>
    </aside>
  );
}