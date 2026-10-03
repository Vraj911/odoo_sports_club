import { useState, type ReactNode } from "react";
import { Bell, CalendarPlus, Home, ListChecks, ShoppingBag, User, LogOut, IdCard, Beer, Receipt, BadgeCheck, ChevronRight } from "lucide-react";
import { AppLink, useGo } from "@/app/router/links";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/app/providers/AuthProvider";
import { useMember } from "@/features/member/memberStore";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { StatusPill } from "@/components/ui/StatusPill";
import { cn } from "@/lib/cn";
import type { RouteMeta } from "@/types/common";

const NAV = [
  { to: "/app", label: "Home", icon: Home },
  { to: "/app/book", label: "Book Court", icon: CalendarPlus },
  { to: "/app/social", label: "Social Play", icon: BadgeCheck },
  { to: "/app/bookings", label: "Bookings", icon: ListChecks },
  { to: "/app/shop", label: "Pro Shop", icon: ShoppingBag },
  { to: "/app/tab", label: "Bar Tab", icon: Beer },
  { to: "/app/invoices", label: "Invoices", icon: Receipt },
  { to: "/app/card", label: "Digital Card", icon: IdCard },
  { to: "/app/profile", label: "Profile", icon: User },
] as const;

export function MemberLayout({ route, children }: { route: RouteMeta; children: ReactNode }) {
  const { user, logout } = useAuth();
  const { profile, unreadCount } = useMember();
  const go = useGo();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-backdrop text-chalk pb-20 md:pb-0">
      <CommandPalette />

      {/* Desktop Left Rail: Collapsed 88px, expanding to 240px on hover */}
      <aside className="group sticky top-0 hidden h-screen w-[88px] flex-col border-r border-chalk/14 bg-court-600/90 backdrop-blur-md transition-all duration-300 ease-out hover:w-[240px] z-30 md:flex">
        <div className="flex h-[72px] items-center px-6 overflow-hidden">
          <Logo variant="full" size={28} />
        </div>

        <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto" aria-label="Member desktop sidebar">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = route.path === item.to;
            return (
              <AppLink
                key={item.to}
                to={item.to}
                className={cn(
                  "relative flex h-11 items-center rounded-input px-3.5 text-sm font-medium transition-colors overflow-hidden whitespace-nowrap",
                  active
                    ? "bg-volt-400 text-ink-900 font-semibold shadow-volt"
                    : "text-chalk/80 hover:bg-chalk/10 hover:text-chalk"
                )}
              >
                <Icon className="size-5 shrink-0" />
                <span className="ml-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  {item.label}
                </span>
              </AppLink>
            );
          })}
        </nav>

        {/* Member Profile Footer in Rail */}
        <div className="border-t border-chalk/14 p-3 overflow-hidden whitespace-nowrap">
          <button
            onClick={() => {
              logout();
              go("/login");
            }}
            className="flex h-10 w-full items-center rounded-input px-3 text-sm text-chalk/70 hover:bg-chalk/10 hover:text-chalk transition-colors"
            title="Log out"
          >
            <LogOut className="size-5 shrink-0" />
            <span className="ml-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              Log out
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-chalk/14 bg-navy-900/80 px-6 backdrop-blur-md">
          <div className="flex items-center gap-3 md:hidden">
            <AppLink to="/app" aria-label="Member home">
              <Logo size={28} />
            </AppLink>
          </div>

          <div className="hidden md:flex items-center gap-2 text-sm text-chalk/70">
            <span>Member Portal</span>
            <ChevronRight className="size-3.5" />
            <span className="font-semibold text-chalk">{route.title}</span>
          </div>

          <div className="flex items-center gap-4">
            <StatusPill
              variant={profile.tier === "Gold" ? "volt" : profile.tier === "Silver" ? "neutral" : "info"}
              showDot
            >
              {profile.tier} Member
            </StatusPill>

            <AppLink
              to="/app/notifications"
              className="relative p-2 text-chalk/80 hover:text-chalk"
              aria-label="View notifications"
            >
              <Bell className="size-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-volt-400" />
              )}
            </AppLink>

            {/* User Avatar Menu */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen((p) => !p)}
                className="flex items-center gap-2 rounded-pill border border-chalk/18 bg-chalk/8 p-1 pr-3 hover:bg-chalk/14 transition-colors"
              >
                <div className="flex size-8 items-center justify-center rounded-full bg-volt-400 font-semibold text-ink-900 text-xs">
                  {profile.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-xs font-medium hidden sm:inline">{profile.name}</span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-[16px] border border-chalk/18 bg-court-600 p-2 shadow-2xl z-50">
                  <div className="px-3 py-2 border-b border-chalk/14">
                    <p className="text-xs font-semibold text-chalk">{profile.name}</p>
                    <p className="text-[11px] text-chalk/60 font-mono">{profile.email}</p>
                  </div>
                  <AppLink
                    to="/app/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 rounded-input px-3 py-2 text-xs text-chalk/90 hover:bg-chalk/10"
                  >
                    <User className="size-4" /> My Profile
                  </AppLink>
                  <AppLink
                    to="/app/card"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 rounded-input px-3 py-2 text-xs text-chalk/90 hover:bg-chalk/10"
                  >
                    <IdCard className="size-4" /> Digital Member Card
                  </AppLink>
                  <button
                    onClick={() => {
                      logout();
                      go("/login");
                    }}
                    className="flex w-full items-center gap-2 rounded-input px-3 py-2 text-xs text-danger hover:bg-danger/10"
                  >
                    <LogOut className="size-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>

        {/* Mobile Bottom Navigation Bar */}
        <nav
          className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-chalk/14 bg-navy-950/95 backdrop-blur-lg px-2 md:hidden"
          aria-label="Mobile bottom bar"
        >
          {NAV.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = route.path === item.to;
            return (
              <AppLink
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors py-1 px-2.5 rounded-xl",
                  active ? "text-volt-400 font-semibold" : "text-chalk/60 hover:text-chalk"
                )}
              >
                <Icon className="size-5" />
                <span>{item.label}</span>
              </AppLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
