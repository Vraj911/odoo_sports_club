import { WifiOff, AlertCircle } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-amber-500 text-ink-900 px-4 py-2 text-xs font-semibold shadow-lg backdrop-blur-md"
    >
      <WifiOff className="size-4 shrink-0" />
      <span>You are currently offline. Actions and bookings will sync once internet connectivity is restored.</span>
      <div className="flex items-center gap-1 ml-2 text-[11px] opacity-80">
        <AlertCircle className="size-3.5" />
        <span>Offline Mode</span>
      </div>
    </div>
  );
}
