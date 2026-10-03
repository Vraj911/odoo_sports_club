import { useState, type ReactNode } from "react";
import { LogOut, PanelLeft, Bell, ChevronRight, ShieldCheck, User as UserIcon } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { AppLink, useGo } from "@/app/router/links";
import { hasParams, routeConfig } from "@/app/router/routeConfig";
import { Logo } from "@/components/brand/Logo";
import { SearchBox } from "@/components/ui/SearchBox";
import { StatusPill } from "@/components/ui/StatusPill";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { PageHeader } from "@/components/layout/PageHeader";
import { NAV_GROUPS, getVisibleNavGroups, canAccessRoute } from "@/lib/permissions";
import { ROLE_LABELS, GROUP_LABELS, getRoleHome } from "@/lib/constants";
import { cn } from "@/lib/cn";
import type { RouteMeta } from "@/types/common";

export function ConsoleLayout({ route, children }: { route: RouteMeta; children: ReactNode }) {
  const { user, logout } = useAuth();
  const go = useGo();
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Check if page is POS mode (e.g. /shop-console or /shop-console/quick or /bar or /kds) to expand full width for tablet touch use
  const isPOS =
    route.path === "/shop-console" ||
    route.path === "/shop-console/quick" ||
    route.path === "/bar" ||
    route.path === "/kds";
  const visibleGroupKeys = getVisibleNavGroups(user);

  // Build a display string for the user's permission groups
  const groupDisplay = user?.role === "ADMIN"
    ? "Full Access"
    : user?.groups.map((g) => GROUP_LABELS[g]).join(", ") || "No Group Assigned";

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

          {/* Permission-Filtered Navigation Groups */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-4" aria-label="Console navigation">
            {NAV_GROUPS.filter((g) => visibleGroupKeys.includes(g.key)).map((g) => {
              const items = routeConfig.filter(
                (r) => r.group === g.key && !hasParams(r.path) && canAccessRoute(user, r.access)
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
                  <span className="text-[11px] text-chalk/60 truncate">
                    {ROLE_LABELS[user.role]} · {groupDisplay}
                  </span>
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
        {/* Topbar 72px (hidden in full-screen POS mode) */}
        {!isPOS && (
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

          {/* Right Topbar Actions & User Role/Group Chips */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Topbar User Role & Group Chips */}
            {user && (
              <div className="hidden sm:flex items-center gap-1.5">
                {user.role === "ADMIN" ? (
                  <span className="rounded-pill bg-volt-400 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-ink-900 uppercase shadow-sm">
                    ADMIN
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-pill border border-chalk/20 bg-chalk/10 px-2 py-0.5 text-[10px] font-semibold text-chalk/90 uppercase tracking-wider">
                      STAFF
                    </span>
                    {user.groups.length > 0 ? (
                      user.groups.map((g) => (
                        <span
                          key={g}
                          className="rounded-pill border border-volt-400/30 bg-volt-400/10 px-2 py-0.5 text-[10px] font-semibold text-volt-300"
                        >
                          {g}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-pill border border-chalk/14 bg-chalk/6 px-2 py-0.5 text-[10px] text-chalk/50">
                        NO GROUP
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            <button className="relative p-2 text-chalk/80 hover:text-chalk" aria-label="Notifications">
              <Bell className="size-5" />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-volt-400" />
            </button>

            {/* User Avatar Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((u) => !u)}
                className="flex items-center gap-2 rounded-pill border border-chalk/18 bg-chalk/8 p-1 pr-3 hover:bg-chalk/14 transition-colors"
                aria-label="User menu"
              >
                <div className="flex size-8 items-center justify-center rounded-full bg-court-600 font-semibold text-volt-400 border border-volt-400/40 text-xs">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : "AD"}
                </div>
                <span className="text-xs font-medium hidden lg:inline">{user?.name || "Staff"}</span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 rounded-[16px] border border-chalk/18 bg-court-600 p-2 shadow-2xl z-50 text-chalk">
                  <div className="px-3 py-2 border-b border-chalk/14">
                    <p className="text-xs font-semibold text-chalk">{user?.name || "Staff"}</p>
                    <p className="text-[11px] text-chalk/60 mt-0.5">
                      {user ? `${ROLE_LABELS[user.role]} · ${groupDisplay}` : "Staff"}
                    </p>
                  </div>
                  {user?.role === "STAFF" && (
                    <AppLink
                      to="/staff"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex w-full items-center gap-2 rounded-input px-3 py-2 text-xs text-chalk/90 hover:bg-chalk/10 mt-1"
                    >
                      <UserIcon className="size-3.5 text-volt-400" />
                      <span>Staff Hub</span>
                    </AppLink>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      go("/login");
                    }}
                    className="flex w-full items-center gap-2 rounded-input px-3 py-2 text-xs text-danger hover:bg-danger/10 mt-1"
                  >
                    <LogOut className="size-3.5" />
                    <span>Log out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
      )}

        {/* Page Header (if not on POS page) */}
        {!isPOS && <PageHeader title={route.title} />}

        {/* Console Workspace Main Viewport */}
        <main className={cn("flex-1 p-6 md:p-8", isPOS && "p-0 overflow-hidden")}>
          {children}
        </main>
      </div>
    </div>
  );
}
