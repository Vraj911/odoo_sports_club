import { useState } from "react";
import { RefreshCw, ServerCrash, Home, Bug } from "lucide-react";
import { CourtLines } from "@/components/brand/CourtLines";
import { Button } from "@/components/ui/Button";
import { AppLink } from "@/app/router/links";

export default function ServerError() {
  const [retrying, setRetrying] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const handleRetry = () => {
    setRetrying(true);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  return (
    <section className="relative mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center">
      <div className="relative w-full overflow-hidden">
        <CourtLines opacity={0.25} className="w-full h-44 object-contain" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-danger/20 border border-danger/40 text-danger shadow-2xl">
            <ServerCrash className="size-8" />
          </div>
        </div>
      </div>

      <p className="mt-8 text-sm font-semibold uppercase tracking-widest text-danger">
        500 · Technical Fault
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-chalk">
        The court net collapsed.
      </h1>
      <p className="mt-3 text-sm text-chalk/80 max-w-md mx-auto leading-relaxed">
        An unexpected error occurred while processing this request on the server cluster.
        Our systems team has been automatically alerted.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="primary"
          onClick={handleRetry}
          loading={retrying}
          className="gap-2"
        >
          <RefreshCw className="size-4" />
          <span>Retry Connection</span>
        </Button>

        <AppLink
          to="/"
          className="inline-flex h-11 items-center gap-2 rounded-pill border border-chalk/20 bg-chalk/8 px-5 text-sm font-medium text-chalk hover:bg-chalk/14 transition-colors"
        >
          <Home className="size-4" />
          <span>Return Home</span>
        </AppLink>
      </div>

      <div className="mt-8">
        <button
          onClick={() => setShowDiagnostics((s) => !s)}
          className="inline-flex items-center gap-1.5 text-xs text-chalk/50 hover:text-chalk/80 transition-colors"
        >
          <Bug className="size-3.5" />
          <span>{showDiagnostics ? "Hide diagnostic trace" : "View diagnostic trace"}</span>
        </button>

        {showDiagnostics && (
          <div className="mt-3 text-left font-mono text-xs bg-navy-950/80 border border-white/10 rounded-xl p-4 text-chalk/70 max-w-lg mx-auto overflow-x-auto space-y-1">
            <p className="text-danger font-semibold">Error: Internal Application State Boundary Fault</p>
            <p className="text-[11px] text-chalk/50">Timestamp: {new Date().toISOString()}</p>
            <p className="text-[11px] text-chalk/50">Location: /routes/console.cluster-apac-south</p>
            <p className="text-[11px] text-volt-400">Node: CCMS-PROD-SSR-MUM01</p>
          </div>
        )}
      </div>
    </section>
  );
}
