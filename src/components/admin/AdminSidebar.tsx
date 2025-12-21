import React, { useState, useMemo } from "react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { 
  Settings, 
  LogOut, 
  Shield, 
  Activity, 
  Flag, 
  Users, 
  Building2, 
  Key, 
  FileSearch, 
  CreditCard, 
  Plug, 
  AlertTriangle,
  Bot,
  TestTube,
  BarChart3,
  CheckSquare,
  Search,
  X,
  FileText,
  Video,
  BookOpen,
  Database,
  Zap
} from "lucide-react";

type Props = {
  onNavigate: (sectionId: string) => void;
  isAdminSession: boolean;
  onLogout: () => void;
};

type MenuItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  keywords?: string[];
};

export function AdminSidebar({ onNavigate, isAdminSession, onLogout }: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  const menuItems: MenuItem[] = useMemo(() => [
    {
      id: "admin-assistant",
      label: "Admin Assistant",
      icon: <Bot className="h-4 w-4 text-emerald-200 group-hover:text-white transition-colors" />,
      onClick: () => onNavigate("section-admin-assistant"),
      keywords: ["assistant", "ai", "help", "bot"]
    },
    {
      id: "system-agents",
      label: "System Agents Hub",
      icon: <Zap className="h-4 w-4 text-emerald-200 group-hover:text-white transition-colors" />,
      onClick: () => {
        try {
          window.postMessage({ type: "navigateTo", path: "/admin/system-agents" }, "*");
        } catch {}
        try {
          (window as any).parent?.postMessage?.({ type: "navigateTo", path: "/admin/system-agents" }, "*");
        } catch {}
        window.location.href = "/admin/system-agents";
      },
      keywords: ["agents", "system", "hub", "ai"]
    },
    {
      id: "test-runner",
      label: "Test Runner",
      icon: <TestTube className="h-4 w-4 text-emerald-200 group-hover:text-white transition-colors" />,
      onClick: () => {
        try {
          window.postMessage({ type: "navigateTo", path: "/admin/test-runner" }, "*");
        } catch {}
        try {
          (window as any).parent?.postMessage?.({ type: "navigateTo", path: "/admin/test-runner" }, "*");
        } catch {}
        window.location.href = "/admin/test-runner";
      },
      keywords: ["test", "testing", "runner", "qa"]
    },
    {
      id: "system-health",
      label: "System Health",
      icon: <Activity className="h-4 w-4 text-emerald-200 group-hover:text-white transition-colors" />,
      onClick: () => onNavigate("section-system-health"),
      keywords: ["health", "status", "monitoring", "uptime"]
    },
    {
      id: "roadmap-compliance",
      label: "Roadmap Compliance",
      icon: <CheckSquare className="h-4 w-4 text-emerald-200 group-hover:text-white transition-colors" />,
      onClick: () => onNavigate("section-roadmap-compliance"),
      keywords: ["roadmap", "compliance", "checklist", "progress"]
    },
    {
      id: "kpis",
      label: "KPI Snapshot",
      icon: <BarChart3 className="h-4 w-4 text-emerald-200 group-hover:text-white transition-colors" />,
      onClick: () => onNavigate("section-kpis"),
      keywords: ["kpi", "metrics", "analytics", "stats"]
    },
    {
      id: "feature-flags",
      label: "Feature Flags",
      icon: <Flag className="h-4 w-4 text-emerald-200 group-hover:text-white transition-colors" />,
      onClick: () => onNavigate("section-feature-flags"),
      keywords: ["flags", "features", "toggles", "rollout"]
    },
    {
      id: "pending-senior",
      label: "Pending Requests",
      icon: <Shield className="h-4 w-4 text-emerald-200 group-hover:text-white transition-colors" />,
      onClick: () => onNavigate("section-pending-senior"),
      keywords: ["pending", "requests", "approval", "senior"]
    },
    {
      id: "admins",
      label: "Administrators",
      icon: <Users className="h-4 w-4 text-emerald-200 group-hover:text-white transition-colors" />,
      onClick: () => onNavigate("section-admins"),
      keywords: ["admins", "administrators", "users", "roles"]
    },
    {
      id: "tenants",
      label: "Tenants",
      icon: <Building2 className="h-4 w-4 text-emerald-200 group-hover:text-white transition-colors" />,
      onClick: () => onNavigate("section-tenants"),
      keywords: ["tenants", "organizations", "businesses"]
    },
    {
      id: "api-keys",
      label: "API Keys",
      icon: <Key className="h-4 w-4 text-emerald-200 group-hover:text-white transition-colors" />,
      onClick: () => onNavigate("section-api-keys"),
      keywords: ["api", "keys", "tokens", "credentials"]
    },
    {
      id: "billing",
      label: "Billing & Usage",
      icon: <CreditCard className="h-4 w-4 text-emerald-200 group-hover:text-white transition-colors" />,
      onClick: () => onNavigate("section-billing"),
      keywords: ["billing", "usage", "payments", "subscription"]
    },
    {
      id: "integrations",
      label: "Integrations",
      icon: <Plug className="h-4 w-4 text-emerald-200 group-hover:text-white transition-colors" />,
      onClick: () => onNavigate("section-integrations"),
      keywords: ["integrations", "connections", "plugins", "apis"]
    },
    {
      id: "custom-agents",
      label: "Custom Agents",
      icon: <Bot className="h-4 w-4 text-emerald-200 group-hover:text-white transition-colors" />,
      onClick: () => onNavigate("section-custom-agents"),
      keywords: ["custom", "agents", "ai", "training"]
    },
    {
      id: "content-management",
      label: "Content Management",
      icon: <FileText className="h-4 w-4 text-emerald-200 group-hover:text-white transition-colors" />,
      onClick: () => onNavigate("section-content-management"),
      keywords: ["content", "management", "cms", "docs", "videos", "faq", "documentation"]
    },
    {
      id: "audit-explorer",
      label: "Audit Explorer",
      icon: <FileSearch className="h-4 w-4 text-emerald-200 group-hover:text-white transition-colors" />,
      onClick: () => onNavigate("section-audit-explorer"),
      keywords: ["audit", "logs", "explorer", "history"]
    },
    {
      id: "alerts",
      label: "Alerts & Incidents",
      icon: <AlertTriangle className="h-4 w-4 text-emerald-200 group-hover:text-white transition-colors" />,
      onClick: () => onNavigate("section-alerts"),
      keywords: ["alerts", "notifications", "warnings", "incidents"]
    },
    {
      id: "database",
      label: "Database",
      icon: <Database className="h-4 w-4 text-emerald-200 group-hover:text-white transition-colors" />,
      onClick: () => {
        window.open("https://dashboard.convex.dev/d/hushed-cat-860", "_blank", "noopener,noreferrer");
      },
      keywords: ["database", "convex", "data", "tables"]
    }
  ], [onNavigate]);

  const filteredMenuItems = useMemo(() => {
    if (!searchQuery.trim()) return menuItems;
    
    const query = searchQuery.toLowerCase();
    return menuItems.filter(item => {
      const labelMatch = item.label.toLowerCase().includes(query);
      const keywordsMatch = item.keywords?.some(keyword => keyword.toLowerCase().includes(query));
      return labelMatch || keywordsMatch;
    });
  }, [menuItems, searchQuery]);

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 text-white z-30 shadow-2xl border-r border-emerald-900/50">
      <div className="flex flex-col h-full w-full p-4 gap-1">
        {/* Header */}
        <div className="mb-3 pb-3 border-b border-emerald-500/30">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-5 w-5 text-white" />
            <h2 className="text-lg font-bold text-white">Admin Portal</h2>
          </div>
          <p className="text-xs text-emerald-100">System Management</p>
        </div>

        {/* Search Bar */}
        <div className="mb-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-200" />
          <Input
            type="text"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 h-9 bg-emerald-800/50 border-emerald-600/50 text-white placeholder:text-emerald-200 focus:bg-emerald-800 focus:border-emerald-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-200 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin scrollbar-thumb-emerald-600 scrollbar-track-emerald-800/30">
          {filteredMenuItems.length > 0 ? (
            filteredMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={item.onClick}
                className="group flex items-center gap-3 text-left px-3 py-2 rounded-lg hover:bg-emerald-600/50 transition-all duration-200 text-sm font-medium hover:translate-x-1 w-full"
              >
                {item.icon}
                <span className="text-emerald-50 group-hover:text-white">{item.label}</span>
              </button>
            ))
          ) : (
            <div className="text-center py-8 text-emerald-200 text-sm">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No results found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          )}
        </div>
        
        <Separator className="my-3 bg-emerald-500/30" />
        
        <button
          onClick={() => {
            try {
              window.postMessage({ type: "navigateTo", path: "/settings" }, "*");
            } catch {}
            try {
              (window as any).parent?.postMessage?.({ type: "navigateTo", path: "/settings" }, "*");
            } catch {}
            window.location.href = "/settings";
          }}
          className="group flex items-center gap-3 text-left px-3 py-2.5 rounded-lg bg-emerald-600/40 hover:bg-emerald-600/70 transition-all duration-200 text-sm font-semibold hover:translate-x-1 border border-emerald-500/50"
        >
          <Settings className="h-4 w-4 text-emerald-100 group-hover:text-white transition-colors" />
          <span className="text-emerald-50 group-hover:text-white">Settings</span>
        </button>
        
        {isAdminSession && (
          <button 
            onClick={onLogout} 
            className="group flex items-center gap-3 mt-2 w-full text-left px-3 py-2.5 rounded-lg bg-red-600/30 hover:bg-red-600/50 transition-all duration-200 text-sm font-medium border border-red-500/40 hover:border-red-400/60"
          >
            <LogOut className="h-4 w-4 text-red-200 group-hover:text-white transition-colors" />
            <span className="text-red-100 group-hover:text-white">Logout</span>
          </button>
        )}
      </div>
    </aside>
  );
}