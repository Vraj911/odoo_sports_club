import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Lock, ShieldAlert, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { toast } from "@/components/ui/Toast";

export function SessionExpiredModal() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Listen to simulated or dispatched session expiration events
  useEffect(() => {
    const handleExpired = () => setIsOpen(true);
    window.addEventListener("ccms:session-expired", handleExpired);
    return () => window.removeEventListener("ccms:session-expired", handleExpired);
  }, []);

  const handleReLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Please enter your account password to renew your session.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsOpen(false);
      setPassword("");
      setError("");
      toast.success("Session renewed! You may continue without losing any unsaved work.");
    }, 700);
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // Non-dismissible by clicking outside
      title={
        <div className="flex items-center gap-2 text-warning">
          <ShieldAlert className="size-5" />
          <span>Session Inactivity Lock</span>
        </div>
      }
      subtitle="Your authenticated session expired due to inactivity. Enter password to resume seamlessly without losing open forms."
    >
      <form onSubmit={handleReLogin} className="space-y-4">
        <div className="rounded-xl bg-chalk/6 border border-chalk/10 p-3 text-xs text-chalk/80">
          <p className="text-[11px] text-chalk/50 mb-0.5">Active Account</p>
          <p className="font-semibold text-white">{user?.name || "Staff User"}</p>
          <p className="text-volt-400 font-mono text-[11px]">{user?.role} Access</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-white/80 mb-1.5">
            Account Password *
          </label>
          <Input
            type="password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError("");
            }}
            error={error}
            autoFocus
          />
        </div>

        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-chalk/60 flex items-center gap-2">
          <CheckCircle2 className="size-4 text-volt-400 shrink-0" />
          <span>In-place re-authentication: preserves current page inputs, tables, and open drawers.</span>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              window.location.href = "/login";
            }}
          >
            Sign in as different user
          </Button>
          <Button type="submit" variant="primary" loading={loading} className="gap-2">
            <Lock className="size-4" />
            <span>Unlock Session</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
