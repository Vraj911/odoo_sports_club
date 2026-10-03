import { useState, type ReactNode } from "react";
import { LogOut, PanelLeft, Bell, User, ChevronRight, Activity, ShieldCheck } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { AppLink, useGo } from "@/app/router/links";
import { hasParams, routeConfig } from "@/app/router/routeConfig";
import { Logo } from "@/components/brand/Logo";
import { SearchBox } from "@/components/ui/SearchBox";
import { StatusPill } from "@/components/ui/StatusPill";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { PageHeader } from "@/components/layout/PageHeader";
import { NAV_GROUPS, ROLE_NAV_GROUPS, canAccess } from "@/lib/permissions";
import { ROLE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/cn";
import type { RouteMeta } from "@/types/common";

export function ConsoleLayout({ route, children }: { route: RouteMeta; children: ReactNode }) {
  const { user, logout } = useAuth();
  const go = useGo();
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Check if page is POS mode (e.g. /shop-console or /bar or /kds) to expand full width for tablet touch use
  const isPOS = route.path === "/shop-console" || route.path === "/bar" || route.path === "/kds";
  const groups = user ? ROLE_NAV_GROUPS[user.role] : [];

  return (
    <div className="flex min-h-screen bg-backdrop text-chalk">
      <CommandPalette />

      {/* Sidebar 264px (or 76px when collapsed), hidden if POS mode */}
      {!isPOS && (
        <aside
          className={cn(
            "sticky top-0 z-30 flex h-screen flex-col border-r border-chalk/14 bg-court-600 transition-all duration-300 ease-in-out shrink-0",
            collapsed ? "w-[76px]" : "w-[264px]"
          )}
        >
          {/* Logo header */}
          <div className="flex h-[72px] items-center justify-between px-5 border-b border-chalk/14">
            <Logo variant={collapsed ? "icon" : "full"} size={28} />
          </div>

          {/* Role-Filtered Navigation Groups */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-4" aria-label="Console navigation">
            {NAV_GROUPS.filter((g) => groups.includes(g.key)).map((g) => {
              const items = routeConfig.filter(
                (r) => r.group === g.key && !hasParams(r.path) && canAccess(user?.role, r.roles)
              );
              if (!items.length) return null;

              return (
                <div key={g.key} className="space-y-1">
                  {!collapsed && (
                    <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-chalk/50">
                      {g.label}
                    </p>
                  )}
                  {items.map((r) => {
                    const Icon = r.icon;
                    const active = r.path === route.path;
                    return (
                      <AppLink
                        key={r.path}
                        to={r.path}
                        title={r.title}
                        className={cn(
                          "relative flex h-10 items-center gap-3 rounded-input px-3 text-sm font-medium text-chalk/80 transition-colors hover:bg-chalk/10 hover:text-chalk",
                          active &&
                            "bg-chalk/12 text-chalk font-semibold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-pill before:bg-volt-400"
                        )}
                      >
                        <Icon className="size-4 shrink-0" aria-hidden />
                        {!collapsed && <span className="truncate">{r.title}</span>}
                      </AppLink>
                    );
                  })}
                </div>
              );
            })}
          </nav>

          {/* User Card & Logout Bottom */}
          <div className="border-t border-chalk/14 p-3 bg-court-700/40">
            {!collapsed && user && (
              <div className="mb-3 px-2">
                <p className="text-xs font-semibold text-chalk truncate">{user.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <ShieldCheck className="size-3 text-volt-400 shrink-0" />
                  <span className="text-[11px] text-chalk/60 truncate">{ROLE_LABELS[user.role]}</span>
                </div>
              </div>
            )}
            <button
              onClick={() => {
                logout();
                go("/login");
              }}
              className="flex h-9 w-full items-center gap-2 rounded-input px-3 text-xs font-medium text-chalk/70 hover:bg-danger/16 hover:text-danger transition-colors"
              aria-label="Log out"
            >
              <LogOut className="size-4 shrink-0" />
              {!collapsed && <span>Log out</span>}
            </button>
          </div>
        </aside>
      )}

      {/* Main Console Content Body */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Topbar 72px */}
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-chalk/14 bg-navy-900/90 px-6 backdrop-blur-md gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {!isPOS && (
              <button
                aria-label="Toggle sidebar"
                onClick={() => setCollapsed((c) => !c)}
                className="rounded-pill p-2 text-chalk/70 hover:bg-chalk/10 hover:text-chalk transition-colors shrink-0"
              >
                <PanelLeft className="size-5" />
              </button>
            )}

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs sm:text-sm text-chalk/70 truncate">
              <span className="hidden sm:inline">Console</span>
              <ChevronRight className="size-3.5 hidden sm:inline" />
              <span className="font-semibold text-chalk truncate">{route.title}</span>
            </div>
          </div>

          {/* Middle: Global SearchBox */}
          <div className="hidden md:flex flex-1 justify-center max-w-md">
            <SearchBox className="h-10 text-xs" />
          </div>

          {/* Right Topbar Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <StatusPill variant="volt" showDot className="hidden sm:inline-flex">
              Live System
            </StatusPill>

            <button className="relative p-2 text-chalk/80 hover:text-chalk">
              <Bell className="size-5" />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-volt-400" />
            </button>

            {/* User Avatar Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((u) => !u)}
                className="flex items-center gap-2 rounded-pill border border-chalk/18 bg-chalk/8 p-1 pr-3 hover:bg-chalk/14 transition-colors"
              >
                <div className="flex size-8 items-center justify-center rounded-full bg-court-600 font-semibold text-volt-400 border border-volt-400/40 text-xs">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : "AD"}
                </div>
                <span className="text-xs font-medium hidden lg:inline">{user?.name || "Admin Staff"}</span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-[16px] border border-chalk/18 bg-court-600 p-2 shadow-2xl z-50 text-chalk">
                  <div className="px-3 py-2 border-b border-chalk/14">
                    <p className="text-xs font-semibold text-chalk">{user?.name || "Admin Staff"}</p>
                    <p className="text-[11px] text-chalk/60">{user ? ROLE_LABELS[user.role] : "Staff"}</p>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      go("/login");
                    }}
                    className="flex w-full items-center gap-2 rounded-input px-3 py-2 text-xs text-danger hover:bg-danger/10 mt-1"
                  >
                    <LogOut className="size-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area with 32px padding */}
        <main className="flex-1 p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {/* Automatic PageHeader with faint CourtLines behind */}
          <PageHeader
            title={route.title}
            subtitle={`Phase ${route.phase} · Champions Club Console`}
          />
          {children}
        </main>
      </div>
    </div>
  );
}
