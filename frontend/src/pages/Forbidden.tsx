import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { AppLink } from "@/app/router/links";
import { getRoleHome } from "@/lib/constants";

export default function Forbidden() {
  const { user } = useAuth();
  const search = typeof window !== "undefined" ? window.location.search : "";
  const params = new URLSearchParams(search);
  const required = params.get("required");

  const homeUrl = getRoleHome(user);

  return (
    <section className="mx-auto max-w-xl px-4 py-24">
      <div className="rounded-[24px] border border-danger/30 bg-court-600/90 p-8 shadow-2xl backdrop-blur-md text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-danger/20 border border-danger/40 text-danger mb-4">
          <ShieldAlert className="size-7" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-chalk">
          403 · Access Restricted
        </h1>

        <p className="mt-2 text-sm text-chalk/80 leading-relaxed">
          You don't have the required authorization or capability group to view this console screen.
        </p>

        {required && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-pill border border-danger/40 bg-danger/10 px-4 py-1.5 text-xs text-danger font-medium">
            <span>Required:</span>
            <span className="font-semibold text-chalk font-mono">{required}</span>
          </div>
        )}

        {user && (
          <div className="mt-4 text-xs text-chalk/60">
            Currently authenticated as{" "}
            <span className="font-semibold text-volt-400">{user.role}</span>
            {user.role === "STAFF" && (
              <>
                {" "}with groups:{" "}
                <span className="font-semibold text-chalk">
                  {user.groups.length > 0 ? user.groups.join(", ") : "None"}
                </span>
              </>
            )}
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <AppLink
            to={homeUrl}
            className="inline-flex h-10 items-center justify-center rounded-pill bg-volt-400 px-6 text-sm font-semibold text-ink-900 hover:bg-volt-500 transition-colors shadow-lg shadow-volt-400/20"
          >
            Go to Your Dashboard
          </AppLink>

          <AppLink
            to="/"
            className="inline-flex h-10 items-center justify-center rounded-pill border border-chalk/20 bg-chalk/8 px-5 text-sm font-medium text-chalk hover:bg-chalk/14 transition-colors"
          >
            Club Home
          </AppLink>
        </div>
      </div>
    </section>
  );
}
