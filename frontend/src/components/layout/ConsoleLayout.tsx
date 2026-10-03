import { useState, type ReactNode } from "react";
import { LogOut, PanelLeft } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { AppLink, useGo } from "@/app/router/links";
import { hasParams, routeConfig } from "@/app/router/routeConfig";
import { Logo } from "@/components/brand/Logo";
import { Badge } from "@/components/ui/Badge";
import { NAV_GROUPS, ROLE_NAV_GROUPS, canAccess } from "@/lib/permissions";
import { ROLE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/cn";
import type { RouteMeta } from "@/types/common";

export function ConsoleLayout({ route, children }: { route: RouteMeta; children: ReactNode }) {
  const { user, logout } = useAuth();
  const go = useGo();
  const [collapsed, setCollapsed] = useState(false);
  const groups = user ? ROLE_NAV_GROUPS[user.role] : [];
  return (
    <div className="flex min-h-screen">
      <aside className={cn("sticky top-0 flex h-screen flex-col bg-court-600 transition-all", collapsed ? "w-[76px]" : "w-[264px]")}>
        <div className="p-4"><Logo variant={collapsed ? "icon" : "full"} size={28} /></div>
        <nav className="flex-1 overflow-y-auto px-2" aria-label="Console">
          {NAV_GROUPS.filter((g) => groups.includes(g.key)).map((g) => {
            const items = routeConfig.filter((r) => r.group === g.key && !hasParams(r.path) && canAccess(user?.role, r.roles));
            if (!items.length) return null;
            return (
              <div key={g.key} className="mb-3">
                {!collapsed && <p className="px-3 py-1 text-[11px] uppercase tracking-wider text-chalk/50">{g.label}</p>}
                {items.map((r) => {
                  const Icon = r.icon;
                  const active = r.path === route.path;
                  return (
                    <AppLink key={r.path} to={r.path} title={r.title}
                      className={cn("relative flex items-center gap-3 rounded-input px-3 py-2 text-sm text-chalk/80 hover:bg-chalk/10",
                        active && "bg-chalk/10 text-chalk before:absolute before:left-0 before:h-5 before:w-1 before:rounded-pill before:bg-volt-400")}>
                      <Icon className="size-4 shrink-0" aria-hidden />{!collapsed && r.title}
                    </AppLink>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div className="border-t border-line p-3 text-sm">
          {!collapsed && user && <p className="mb-2 truncate">{user.name}<br /><span className="text-xs text-chalk/60">{ROLE_LABELS[user.role]}</span></p>}
          <button onClick={() => { logout(); go("/login"); }} className="flex items-center gap-2 text-chalk/80 hover:text-chalk" aria-label="Log out">
            <LogOut className="size-4" />{!collapsed && "Log out"}
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[72px] items-center gap-3 border-b border-line px-4">
          <button aria-label="Toggle sidebar" onClick={() => setCollapsed((c) => !c)}><PanelLeft className="size-5" /></button>
          <span className="text-sm text-chalk/60">Console / <span className="text-chalk">{route.title}</span></span>
        </header>
        <div className="flex items-center gap-3 px-6 pt-6">
          <h1 className="text-2xl font-semibold">{route.title}</h1><Badge>Phase {route.phase}</Badge>
        </div>
        <main>{children}</main>
      </div>
    </div>
  );
}
