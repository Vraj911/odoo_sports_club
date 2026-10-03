import { useState, type ReactNode } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { useGo } from "@/app/router/links";
import { CourtLines } from "@/components/brand/CourtLines";
import { PlayerSilhouette } from "@/components/brand/PlayerSilhouette";
import { Logo } from "@/components/brand/Logo";
import { Card } from "@/components/ui/Card";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { StaffLoginModal } from "@/components/shared/StaffLoginModal";
import type { RouteMeta } from "@/types/common";

export function AuthLayout({ children }: { route: RouteMeta; children: ReactNode }) {
  const { loginAs } = useAuth();
  const go = useGo();
  const [showStaffModal, setShowStaffModal] = useState(false);

  return (
    <div className="grid min-h-screen md:grid-cols-2 bg-navy-950 text-chalk">
      <CommandPalette />

      {/* Staff Member Selection Modal */}
      <StaffLoginModal
        isOpen={showStaffModal}
        onClose={() => setShowStaffModal(false)}
      />

      {/* Left 50% Visual Panel */}
      <section className="relative hidden items-center justify-center overflow-hidden bg-court-500 p-12 md:flex">
        <CourtLines opacity={0.35} className="absolute inset-8 size-[calc(100%-4rem)] object-contain" />

        {/* Silhouette Player sitting in corner */}
        <div className="absolute right-[10%] bottom-[15%] opacity-90 scale-110">
          <PlayerSilhouette variant="right" />
        </div>

        <div className="relative z-10 flex max-w-md flex-col gap-4 text-center">
          <Logo size={36} className="justify-center mb-2" />
          <h1 className="text-4xl font-semibold tracking-tight leading-tight text-chalk">
            Welcome back, <br />
            <span className="text-volt-400">champion.</span>
          </h1>
          <p className="text-sm text-chalk/80 leading-relaxed">
            Access your bookings, pro shop orders, bar tab, and club performance dashboard in one seamless portal.
          </p>
        </div>
      </section>

      {/* Right 50% Form Container */}
      <section className="relative flex flex-col items-center justify-center gap-6 bg-navy-900 p-6 sm:p-12 overflow-y-auto">
        <div className="md:hidden">
          <Logo size={32} />
        </div>

        {/* Mobile faint court lines texture */}
        <div className="absolute inset-0 md:hidden pointer-events-none opacity-10">
          <CourtLines variant="lines-faint" />
        </div>

        <div className="w-full max-w-md z-10">
          <Card className="w-full border-chalk/18 bg-court-600/90 backdrop-blur-md shadow-2xl p-6 sm:p-8">
            {children}

            {/* Quick Demo Login — 3 Roles Only */}
            <div className="mt-8 border-t border-chalk/14 pt-6">
              <p className="mb-3 text-center text-xs font-semibold text-chalk/60 uppercase tracking-wider">
                Quick Demo Login
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    loginAs("MEMBER", [], "Rahul Sharma");
                    go("/app");
                  }}
                  className="rounded-pill border border-chalk/18 bg-chalk/8 px-2 py-2 text-xs font-medium text-chalk/90 hover:bg-volt-400 hover:text-ink-900 hover:border-volt-400 transition-all text-center truncate"
                  title="Sign in as Member"
                >
                  Sign in as Member
                </button>

                <button
                  type="button"
                  onClick={() => setShowStaffModal(true)}
                  className="rounded-pill border border-volt-400/40 bg-volt-400/10 px-2 py-2 text-xs font-semibold text-volt-300 hover:bg-volt-400 hover:text-ink-900 hover:border-volt-400 transition-all text-center truncate"
                  title="Sign in as Staff"
                >
                  Sign in as Staff
                </button>

                <button
                  type="button"
                  onClick={() => {
                    loginAs("ADMIN", [], "Vikramaditya (Admin)");
                    go("/owner");
                  }}
                  className="rounded-pill border border-chalk/18 bg-chalk/8 px-2 py-2 text-xs font-medium text-chalk/90 hover:bg-volt-400 hover:text-ink-900 hover:border-volt-400 transition-all text-center truncate"
                  title="Sign in as Admin"
                >
                  Sign in as Admin
                </button>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
