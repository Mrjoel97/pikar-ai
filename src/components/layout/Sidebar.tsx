import { Input } from "@/components/ui/input";
import { LogOut, CheckCircle } from "lucide-react";
import React from "react";

type NavItem = { label: string; icon: React.ComponentType<any>; to: string };

type SidebarProps = {
  items: Array<NavItem>;
  userDisplay?: string;
  planLabel?: string;
  onNavigate: (to: string) => void;
  onLogout: () => void;
  featureHighlights?: string[];
};

export function Sidebar({
  items,
  userDisplay,
  planLabel,
  onNavigate,
  onLogout,
  featureHighlights,
}: SidebarProps) {
  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-72 bg-gradient-to-b from-emerald-900 to-emerald-800 text-white">
      <div className="flex flex-col h-full w-full p-4">
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

        {/* Plan features */}
        {Array.isArray(featureHighlights) && featureHighlights.length > 0 && (
          <div className="mt-4">
            <div className="text-[11px] uppercase tracking-wider text-emerald-200/80 mb-2">
              Your plan includes
            </div>
            <ul className="space-y-1.5">
              {featureHighlights.slice(0, 6).map((feat, idx) => (
                <li key={`${feat}-${idx}`} className="flex items-start gap-2 text-emerald-50/90">
                  <CheckCircle className="h-3.5 w-3.5 mt-0.5 text-emerald-200/80 flex-shrink-0" />
                  <span className="text-xs leading-snug">{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

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
      </div>
    </aside>
  );
}