import type { ReactNode } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { useGo } from "@/app/router/links";
import { CourtLines } from "@/components/brand/CourtLines";
import { Logo } from "@/components/brand/Logo";
import { Card } from "@/components/ui/Card";
import { ROLE_HOME, ROLE_LABELS, ROLES } from "@/lib/constants";
import type { RouteMeta } from "@/types/common";

export function AuthLayout({ children }: { route: RouteMeta; children: ReactNode }) {
  const { loginAs } = useAuth();
  const go = useGo();
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <section className="relative hidden items-center justify-center overflow-hidden bg-court-500 p-10 md:flex">
        <CourtLines opacity={0.5} className="absolute inset-6" />
        <h1 className="relative text-4xl font-semibold">Welcome back, <span className="text-volt-400">champion.</span></h1>
      </section>
      <section className="flex flex-col items-center justify-center gap-6 bg-navy-900 p-6">
        <Logo />
        <Card className="w-full max-w-md">
          {children}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {ROLES.filter((r) => r !== "VISITOR").map((r) => (
              <button key={r} onClick={() => { loginAs(r); go(ROLE_HOME[r]); }}
                className="rounded-pill border border-line px-3 py-1.5 text-xs hover:bg-chalk/10">
                Sign in as {ROLE_LABELS[r]}
              </button>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
