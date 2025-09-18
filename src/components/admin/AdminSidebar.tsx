import React from "react";

type Props = {
  onNavigate: (sectionId: string) => void;
  isAdminSession: boolean;
  onLogout: () => void;
};

export function AdminSidebar({ onNavigate, isAdminSession, onLogout }: Props) {
  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-gradient-to-b from-emerald-900 to-emerald-800 text-emerald-50 z-30">
      <div className="flex flex-col h-full w-full p-4 gap-3">
        <div className="text-xs uppercase tracking-wider text-emerald-200/80 mb-2">Admin Menu</div>

        <button onClick={() => onNavigate("section-admin-assistant")} className="text-left px-3 py-2 rounded-md hover:bg-white/10 transition">
          Admin Assistant
        </button>
        <button onClick={() => onNavigate("section-system-agents")} className="text-left px-3 py-2 rounded-md hover:bg-white/10 transition">
          System Agents
        </button>
        <button onClick={() => onNavigate("section-system-health")} className="text-left px-3 py-2 rounded-md hover:bg-white/10 transition">
          System Health
        </button>
        <button onClick={() => onNavigate("section-roadmap-compliance")} className="text-left px-3 py-2 rounded-md hover:bg-white/10 transition">
          Roadmap Compliance
        </button>
        <button onClick={() => onNavigate("section-kpis")} className="text-left px-3 py-2 rounded-md hover:bg-white/10 transition">
          KPI Snapshot
        </button>
        <button onClick={() => onNavigate("section-feature-flags")} className="text-left px-3 py-2 rounded-md hover:bg-white/10 transition">
          Feature Flags
        </button>
        <button onClick={() => onNavigate("section-pending-senior")} className="text-left px-3 py-2 rounded-md hover:bg-white/10 transition">
          Pending Senior Requests
        </button>
        <button onClick={() => onNavigate("section-admins")} className="text-left px-3 py-2 rounded-md hover:bg-white/10 transition">
          Administrators
        </button>
        <button onClick={() => onNavigate("section-tenants")} className="text-left px-3 py-2 rounded-md hover:bg-white/10 transition">
          Tenants
        </button>
        <button onClick={() => onNavigate("section-api-keys")} className="text-left px-3 py-2 rounded-md hover:bg-white/10 transition">
          API Keys
        </button>
        <button onClick={() => onNavigate("section-audit-explorer")} className="text-left px-3 py-2 rounded-md hover:bg-white/10 transition">
          Audit Explorer
        </button>
        <button onClick={() => onNavigate("section-billing")} className="text-left px-3 py-2 rounded-md hover:bg-white/10 transition">
          Billing & Usage
        </button>
        <button onClick={() => onNavigate("section-integrations")} className="text-left px-3 py-2 rounded-md hover:bg-white/10 transition">
          Integrations
        </button>
        <button onClick={() => onNavigate("section-alerts")} className="text-left px-3 py-2 rounded-md hover:bg-white/10 transition">
          Alerts
        </button>

        <div className="flex-1" />
        {isAdminSession && (
          <button onClick={onLogout} className="mt-auto w-full text-left px-3 py-2 rounded-md bg-white/10 hover:bg-white/15 transition">
            Logout
          </button>
        )}
      </div>
    </aside>
  );
}
