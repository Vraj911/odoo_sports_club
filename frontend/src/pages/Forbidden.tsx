import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { AppLink } from "@/app/router/links";
import { getRoleHome } from "@/lib/constants";
import { CourtLines } from "@/components/brand/CourtLines";

export default function Forbidden() {
  const { user } = useAuth();
  const search = typeof window !== "undefined" ? window.location.search : "";
  const params = new URLSearchParams(search);
  const required = params.get("required");

  const homeUrl = getRoleHome(user);

  return (
    <section className="relative mx-auto max-w-xl px-4 py-20">
      <div className="relative overflow-hidden rounded-[24px] border border-danger/30 bg-court-600/90 p-8 shadow-2xl backdrop-blur-md text-center">
        {/* Subtle decorative court markings */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
          <CourtLines className="w-full h-full object-contain" />
        </div>

        <div className="relative z-10">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-danger/20 border border-danger/40 text-danger mb-4 shadow-lg shadow-danger/10">
            <ShieldAlert className="size-7" />
          </div>

          <p className="text-xs font-semibold uppercase tracking-wider text-danger">
            403 · Security Policy
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-chalk">
            Not on your court.
          </h1>

          <p className="mt-3 text-sm text-chalk/80 leading-relaxed max-w-md mx-auto">
            You don't have the required authorization or capability group to view this console screen.
            Club access policies restrict administrative and operations tools to designated staff roles.
          </p>

          {required && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-pill border border-danger/40 bg-danger/10 px-4 py-1.5 text-xs text-danger font-medium">
              <span>Required Capability:</span>
              <span className="font-semibold text-chalk font-mono">{required}</span>
            </div>
          )}

          {user && (
            <div className="mt-4 rounded-xl bg-chalk/6 border border-chalk/10 p-3 max-w-md mx-auto text-xs text-chalk/70">
              <span className="text-chalk/50 block text-[11px] mb-0.5">Your Current Session</span>
              <div>
                Logged in as <strong className="text-volt-400 font-semibold">{user.name}</strong> ({user.role})
              </div>
              {user.role === "STAFF" && (
                <div className="mt-1 text-[11px] text-chalk/60">
                  Assigned groups:{" "}
                  <span className="font-semibold text-chalk">
                    {user.groups.length > 0 ? user.groups.join(", ") : "None assigned"}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <AppLink
              to={homeUrl}
              className="inline-flex h-11 items-center justify-center rounded-pill bg-volt-400 px-6 text-sm font-semibold text-ink-900 hover:bg-volt-500 transition-all shadow-lg shadow-volt-400/20"
            >
              <ArrowLeft className="size-4 mr-2" />
              Go to Your Dashboard
            </AppLink>

            <AppLink
              to="/"
              className="inline-flex h-11 items-center justify-center rounded-pill border border-chalk/20 bg-chalk/8 px-5 text-sm font-medium text-chalk hover:bg-chalk/14 transition-colors"
            >
              <Home className="size-4 mr-2" />
              Club Home
            </AppLink>
          </div>
        </div>
      </div>
    </section>
  );
}
