import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronUp, LogOut, UserCog, Check, ShieldCheck } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { useGo } from "@/app/router/links";
import { useDisclosure } from "@/hooks/useDisclosure";
import { DEMO_PRESETS, ROLE_LABELS, GROUP_LABELS, ALL_PERMISSION_GROUPS, getRoleHome } from "@/lib/constants";
import { cn } from "@/lib/cn";
import type { PermissionGroup, PrimaryRole } from "@/types/common";

/** Dev-only floating pill to preview each role, permission groups, and layouts instantly. */
export function DevRoleSwitcher() {
  const { user, loginAs, logout } = useAuth();
  const { isOpen, toggle, close } = useDisclosure();
  const go = useGo();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && close();
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [isOpen, close]);

  const activeRole: PrimaryRole = user?.role || "MEMBER";
  const activeGroups: PermissionGroup[] = user?.groups || [];

  const handleRoleSelect = (role: PrimaryRole) => {
    if (role === "MEMBER") {
      loginAs("MEMBER", []);
      go("/app");
    } else {
      // Keep existing groups if switching to staff, or default to FRONT_DESK
      const groups: PermissionGroup[] = activeGroups.length > 0 ? activeGroups : ["FRONT_DESK"];
      loginAs("STAFF", groups);
      go(getRoleHome({ name: user?.name || "Staff", role: "STAFF", groups }));
    }
  };

  const handleToggleGroup = (group: PermissionGroup) => {
    const exists = activeGroups.includes(group);
    const newGroups = exists
      ? activeGroups.filter((g) => g !== group)
      : [...activeGroups, group];
    loginAs("STAFF", newGroups);
  };

  // Build display label for the floating toggle pill
  const currentLabel = user
    ? user.role === "STAFF"
      ? user.groups.length > 0
        ? `Staff (${user.groups.join(", ")})`
        : "Staff (No Group)"
      : "Member"
    : "Signed out";

  return (
    <div ref={ref} className="fixed bottom-20 left-4 z-40 md:bottom-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-12 left-0 w-80 rounded-[20px] border border-line bg-navy-900 p-3 shadow-2xl backdrop-blur-xl text-chalk text-xs space-y-3"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-chalk/10 px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-chalk/60">
                Access Control & Roles
              </span>
              <span className="text-[10px] text-volt-400 font-mono">
                {user ? user.role : "GUEST"}
              </span>
            </div>

            {/* Segmented Control [ Member | Staff | Admin ] */}
            <div>
              <p className="text-[11px] font-medium text-chalk/70 mb-1.5 px-1">Primary Role</p>
              <div className="grid grid-cols-3 gap-1 rounded-pill bg-chalk/8 p-1 border border-chalk/10">
                {(["MEMBER", "STAFF", "ADMIN"] as const).map((r) => {
                  const isCurrent = user?.role === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRoleSelect(r)}
                      className={cn(
                        "rounded-pill py-1.5 text-center text-xs font-semibold transition-all",
                        isCurrent
                          ? "bg-volt-400 text-ink-900 shadow-md"
                          : "text-chalk/70 hover:text-chalk hover:bg-chalk/6"
                      )}
                    >
                      {ROLE_LABELS[r]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Staff Permission Groups (Checkboxes when Staff is selected) */}
            {user?.role === "STAFF" && (
              <div className="rounded-[16px] border border-volt-400/20 bg-court-700/60 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-volt-300">
                    Staff Permission Groups
                  </span>
                  <span className="text-[10px] text-chalk/50">
                    {activeGroups.length} selected
                  </span>
                </div>
                <div className="space-y-1">
                  {ALL_PERMISSION_GROUPS.map((group) => {
                    const isChecked = activeGroups.includes(group);
                    return (
                      <label
                        key={group}
                        onClick={(e) => {
                          e.preventDefault();
                          handleToggleGroup(group);
                        }}
                        className={cn(
                          "flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors border",
                          isChecked
                            ? "border-volt-400/40 bg-volt-400/10 text-chalk"
                            : "border-transparent text-chalk/60 hover:bg-chalk/6"
                        )}
                      >
                        <span className="text-xs font-medium">{GROUP_LABELS[group]}</span>
                        <div
                          className={cn(
                            "size-4 rounded flex items-center justify-center border transition-all",
                            isChecked
                              ? "bg-volt-400 border-volt-400 text-ink-900"
                              : "border-chalk/30 bg-chalk/10"
                          )}
                        >
                          {isChecked && <Check className="size-3 stroke-[3]" />}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Demo Presets */}
            <div className="pt-2 border-t border-chalk/10 space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-chalk/50 block px-1">
                Quick Demo Presets
              </span>
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                {DEMO_PRESETS.map((preset) => {
                  const isMatch =
                    user?.role === preset.role &&
                    user?.groups.length === preset.groups.length &&
                    preset.groups.every((g) => user?.groups.includes(g));

                  return (
                    <button
                      key={preset.label}
                      onClick={() => {
                        loginAs(preset.role, preset.groups);
                        close();
                        go(preset.home);
                      }}
                      className={cn(
                        "w-full rounded-pill px-3 py-1.5 text-left text-xs transition-colors flex items-center justify-between",
                        isMatch
                          ? "bg-volt-400 text-ink-900 font-semibold"
                          : "text-chalk/80 hover:bg-chalk/10 hover:text-chalk"
                      )}
                    >
                      <span className="truncate">{preset.label}</span>
                      {isMatch && <ShieldCheck className="size-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Member State Simulator for Phase 4 */}
            <div className="pt-2 border-t border-chalk/10">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-chalk/50 block px-1 mb-1">
                Demo Member State (Phase 4)
              </span>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                {[
                  { key: "active-gold", label: "Active Gold" },
                  { key: "expiring-soon", label: "Expiring Soon" },
                  { key: "expired", label: "Expired" },
                  { key: "junior", label: "Junior (Guardian)" },
                ].map((m) => (
                  <button
                    key={m.key}
                    onClick={() => {
                      import("@/features/member/memberStore").then(({ memberStore }) => {
                        memberStore.switchMember(m.key);
                      });
                      loginAs("MEMBER");
                      close();
                      go("/app");
                    }}
                    className="rounded-md px-2 py-1 text-left text-chalk/70 hover:bg-chalk/10 hover:text-volt-400 font-mono transition-colors truncate"
                  >
                    • {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sign Out Button */}
            <div className="pt-2 border-t border-chalk/10">
              <button
                onClick={() => {
                  logout();
                  close();
                  go("/login");
                }}
                className="flex w-full items-center justify-center gap-2 rounded-pill bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger/20 transition-colors"
              >
                <LogOut className="size-3.5" />
                <span>Log out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <button
        onClick={toggle}
        className="flex items-center gap-2 rounded-pill border border-volt-400/40 bg-court-600/90 px-3.5 py-2 text-xs font-semibold text-volt-400 shadow-2xl backdrop-blur-md transition-all hover:bg-court-500 hover:border-volt-400"
        aria-label="Toggle role switcher"
      >
        <UserCog className="size-4" />
        <span className="max-w-[160px] truncate">{currentLabel}</span>
        <ChevronUp
          className={cn("size-3.5 transition-transform duration-200", isOpen && "rotate-180")}
        />
      </button>
    </div>
  );
}
