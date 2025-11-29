import { Input } from "@/components/ui/input";
import { LogOut } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

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

export function Sidebar(props: SidebarProps) {
  const { t } = useTranslation();

  return (
    <aside 
      className="hidden md:flex fixed left-0 top-0 bottom-0 w-72 bg-gradient-to-b from-emerald-900 to-emerald-800 text-white overflow-y-auto z-40"
      style={props.primaryColor ? { background: `linear-gradient(to bottom, ${props.primaryColor}, ${props.primaryColor}dd)` } : {}}
    >
      <div className="flex flex-col h-full w-full p-4">
        {/* Logo Section */}
        {props.logoUrl && (
          <div className="mb-4 flex justify-center flex-shrink-0">
            <img 
              src={props.logoUrl} 
              alt="Company Logo" 
              className="h-12 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}

        {/* Search */}
        <div className="mb-4 flex-shrink-0">
          <Input
            aria-label={t("common.search")}
            placeholder={t("common.search")}
            className="bg-white text-emerald-900 placeholder:text-emerald-600 border-white/30"
          />
        </div>

        {/* Language Switcher */}
        <div className="mb-4 flex justify-center flex-shrink-0">
          <LanguageSwitcher />
        </div>

        {/* Menu label */}
        <div className="text-[11px] uppercase tracking-wider text-emerald-200/80 mb-2 flex-shrink-0">
          {t("common.menu")}
        </div>

        {/* Nav items - scrollable */}
        <nav className="space-y-1 overflow-y-auto pr-1 flex-1 min-h-0">
          {props.items.map((item) => (
            <button
              key={`${item.label}-${item.to}`}
              onClick={() => props.onNavigate(item.to)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/10 transition touch-manipulation active:scale-95"
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm truncate">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom section: user + logout */}
        <div className="space-y-2 flex-shrink-0 mt-4">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-sm font-medium truncate">
              {props.userDisplay || t("common.user", "User")}
            </div>
            {props.planLabel && (
              <div className="text-xs text-emerald-100/80 truncate">{props.planLabel}</div>
            )}
          </div>
          <button
            onClick={props.onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-white/10 hover:bg-white/15 transition touch-manipulation active:scale-95"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{t("common.logout")}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}