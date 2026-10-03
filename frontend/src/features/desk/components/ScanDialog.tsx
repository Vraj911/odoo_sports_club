import { useState, useEffect, useRef, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { QrCode, Scan, Keyboard, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { getMemberByIdOrToken } from "../sampleData";
import type { DeskMember } from "../types";

export interface ScanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (member: DeskMember) => void;
  title?: string;
  subtitle?: string;
}

export function ScanDialog({
  isOpen,
  onClose,
  onScanSuccess,
  title = "Scan Member QR / Barcode",
  subtitle = "Point physical barcode wedge scanner or enter QR token manually",
}: ScanDialogProps) {
  const [tokenInput, setTokenInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<DeskMember | null>(null);
  const [isWedgeActive, setIsWedgeActive] = useState(false);

  // Keyboard wedge state ref
  const wedgeBuffer = useRef<string>("");
  const lastKeyTime = useRef<number>(0);

  const handleResolveToken = useCallback((rawToken: string) => {
    const trimmed = rawToken.trim();
    if (!trimmed) {
      setError("Please enter or scan a valid token or Member ID");
      return;
    }

    const member = getMemberByIdOrToken(trimmed);
    if (!member) {
      setError(`No member found matching token or ID: "${trimmed}"`);
      return;
    }

    setError(null);
    setLastScanned(member);
    setIsWedgeActive(true);

    // Audio cue / vibration simulation
    setTimeout(() => {
      onScanSuccess(member);
      onClose();
      setIsWedgeActive(false);
      setLastScanned(null);
      setTokenInput("");
    }, 600);
  }, [onScanSuccess, onClose]);

  // Keyboard-wedge listener: rapid keystrokes (< 60ms between keys) ending in Enter
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is intentionally typing into an input with normal speed
      const target = e.target as HTMLElement;
      const isInputFocused = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");

      const now = Date.now();
      const delta = now - lastKeyTime.current;
      lastKeyTime.current = now;

      if (e.key === "Enter") {
        if (wedgeBuffer.current.length >= 3) {
          e.preventDefault();
          const scanned = wedgeBuffer.current;
          wedgeBuffer.current = "";
          handleResolveToken(scanned);
          return;
        }
      }

      if (e.key.length === 1) {
        // If rapid keystrokes or wedge is accumulating
        if (delta < 80 || wedgeBuffer.current.length === 0) {
          wedgeBuffer.current += e.key;
        } else if (!isInputFocused) {
          // Reset buffer if delay too long outside input
          wedgeBuffer.current = e.key;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      wedgeBuffer.current = "";
    };
  }, [isOpen, handleResolveToken]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleResolveToken(tokenInput);
  };

  const sampleTokens = [
    { label: "Pratham (Gold, Active, Dues)", token: "CC-000123" },
    { label: "Priya (Expiring Soon)", token: "CC-000102" },
    { label: "Rohan (Junior <18)", token: "CC-000105" },
    { label: "Suresh (Suspended)", token: "CC-000110" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} subtitle={subtitle}>
      <div className="flex flex-col gap-6">
        {/* Scanner Radar Simulation */}
        <div className="relative flex flex-col items-center justify-center p-8 rounded-2xl bg-navy-950/60 border border-white/10 overflow-hidden text-center">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div className="w-64 h-64 border border-dashed border-volt-400 rounded-full animate-ping duration-1000" />
            <div className="w-48 h-48 border border-volt-400/40 rounded-2xl" />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="size-16 rounded-2xl bg-volt-400/10 border border-volt-400/30 flex items-center justify-center text-volt-400 shadow-glow-volt">
              {isWedgeActive ? (
                <CheckCircle2 className="size-8 text-volt-400 animate-bounce" />
              ) : (
                <Scan className="size-8 animate-pulse text-volt-400" />
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-white">
                {isWedgeActive ? "Barcode Scanned!" : "Ready for Laser / Keyboard Wedge"}
              </p>
              <p className="text-xs text-white/50 mt-1">
                Hardware scanners automatically type token &amp; press Enter
              </p>
            </div>

            <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-volt-400/80 bg-volt-400/10 px-3 py-1 rounded-full border border-volt-400/20">
              <span className="size-1.5 rounded-full bg-volt-400 animate-pulse" />
              <span>Listening on USB / Bluetooth Wedge</span>
            </div>
          </div>
        </div>

        {/* Success Preview */}
        {lastScanned && (
          <div className="p-4 rounded-xl bg-volt-400/15 border border-volt-400/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={lastScanned.avatar}
                alt={lastScanned.name}
                className="size-12 rounded-full border border-volt-400/40 object-cover"
              />
              <div>
                <p className="font-semibold text-white text-sm">{lastScanned.name}</p>
                <p className="text-xs text-white/70">
                  {lastScanned.id} · {lastScanned.tier} ({lastScanned.status})
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-volt-400 flex items-center gap-1">
              Verified <ArrowRight className="size-3.5" />
            </span>
          </div>
        )}

        {/* Manual Token or Paste Form */}
        <form onSubmit={handleManualSubmit} className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-white/70">
            <span className="flex items-center gap-1.5 font-medium">
              <Keyboard className="size-3.5" />
              Manual Token / Card ID / Phone
            </span>
            <span className="text-white/40">Paste or type</span>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="e.g. CC-000123 or QR_TOKEN_..."
                value={tokenInput}
                onChange={(e) => {
                  setTokenInput(e.target.value);
                  if (error) setError(null);
                }}
                leftIcon={<QrCode className="size-4 text-white/40" />}
              />
            </div>
            <Button type="submit" variant="primary">
              Verify
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-danger mt-1 bg-danger/10 p-2.5 rounded-lg border border-danger/20">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>

        {/* Quick Test Token Chips */}
        <div className="pt-2 border-t border-white/10">
          <p className="text-[11px] font-medium uppercase tracking-wider text-white/50 mb-2">
            Quick Demo Shortcuts
          </p>
          <div className="flex flex-wrap gap-2">
            {sampleTokens.map((st) => (
              <button
                key={st.token}
                type="button"
                onClick={() => {
                  setTokenInput(st.token);
                  handleResolveToken(st.token);
                }}
                className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-pill px-3 py-1.5 text-white/80 transition-colors flex items-center gap-1.5"
              >
                <span className="font-mono text-[10px] text-volt-400">{st.token}</span>
                <span>{st.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
