import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Clock, CreditCard, Smartphone, Landmark, RefreshCw } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Money, formatINR } from "@/components/shared/Money";
import { cn } from "@/lib/cn";
import { HOLD_SECONDS } from "@/features/booking/sampleData";

export type PaymentStatus = "awaiting" | "processing" | "success" | "failed" | "expired";
export type PaymentMethod = "upi" | "card" | "netbanking";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  bookingId: string;
  courtName: string;
  date: string;
  startTime: string;
  endTime: string;
  holdExpiryMs: number;
  onSuccess: () => void;
  onExpired: () => void;
}

// ── Countdown ring SVG ──
function CountdownRing({ totalSeconds, remainingSeconds }: { totalSeconds: number; remainingSeconds: number }) {
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const progress = Math.max(0, remainingSeconds / totalSeconds);
  const offset = circumference * (1 - progress);
  const isLow = remainingSeconds <= 60;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="128" height="128" className="-rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke={isLow ? "#f87171" : "#d5f63a"}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className={cn("text-2xl font-semibold font-mono tabular-nums", isLow ? "text-danger" : "text-volt-400")}>
          {String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:
          {String(remainingSeconds % 60).padStart(2, "0")}
        </span>
        <span className="text-[10px] text-chalk/60 mt-0.5">remaining</span>
      </div>
    </div>
  );
}

export function PaymentModal({
  isOpen,
  onClose,
  amount,
  bookingId,
  courtName,
  date,
  startTime,
  endTime,
  holdExpiryMs,
  onSuccess,
  onExpired,
}: PaymentModalProps) {
  const [status, setStatus] = useState<PaymentStatus>("awaiting");
  const [method, setMethod] = useState<PaymentMethod>("upi");
  const [remaining, setRemaining] = useState(HOLD_SECONDS);

  // Countdown timer
  useEffect(() => {
    if (!isOpen) return;
    setStatus("awaiting");
    setRemaining(Math.max(0, Math.floor((holdExpiryMs - Date.now()) / 1000)));

    const iv = setInterval(() => {
      const r = Math.max(0, Math.floor((holdExpiryMs - Date.now()) / 1000));
      setRemaining(r);
      if (r <= 0) {
        setStatus("expired");
        onExpired();
        clearInterval(iv);
      }
    }, 1000);

    return () => clearInterval(iv);
  }, [isOpen, holdExpiryMs, onExpired]);

  const simulateSuccess = useCallback(() => {
    setStatus("processing");
    setTimeout(() => {
      setStatus("success");
      onSuccess();
    }, 1500);
  }, [onSuccess]);

  const simulateFailure = useCallback(() => {
    setStatus("processing");
    setTimeout(() => {
      setStatus("failed");
    }, 1500);
  }, []);

  const handleRetry = useCallback(() => {
    setStatus("awaiting");
  }, []);

  // Payment method items
  const methods: { id: PaymentMethod; label: string; icon: typeof CreditCard }[] = [
    { id: "upi", label: "UPI", icon: Smartphone },
    { id: "card", label: "Card", icon: CreditCard },
    { id: "netbanking", label: "Net Banking", icon: Landmark },
  ];

  return (
    <Modal isOpen={isOpen} onClose={status === "processing" ? () => {} : onClose} maxWidth="md">
      <div className="flex flex-col items-center gap-5 text-center">
        {/* Header Info */}
        <div className="flex flex-col items-center gap-1">
          <h3 className="text-lg font-semibold text-chalk">Complete Payment</h3>
          <p className="text-xs text-chalk/70">
            {courtName} · {date} · {startTime}–{endTime}
          </p>
          <p className="text-xs text-chalk/50 font-mono">Booking #{bookingId}</p>
        </div>

        {/* Amount */}
        <div className="text-3xl font-semibold text-volt-400 font-mono tabular-nums">
          {formatINR(amount)}
        </div>

        {/* States */}
        <AnimatePresence mode="wait">
          {status === "awaiting" && (
            <motion.div
              key="awaiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-5 w-full"
            >
              {/* Countdown */}
              <CountdownRing totalSeconds={HOLD_SECONDS} remainingSeconds={remaining} />

              {/* Payment method picker */}
              <div className="flex items-center gap-2 w-full max-w-xs">
                {methods.map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={cn(
                        "flex-1 flex flex-col items-center gap-1.5 rounded-[14px] border p-3 text-xs font-medium transition-all",
                        method === m.id
                          ? "border-volt-400 bg-volt-400/12 text-volt-400"
                          : "border-chalk/18 bg-chalk/6 text-chalk/70 hover:bg-chalk/10"
                      )}
                    >
                      <Icon className="size-5" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Simulated Gateway */}
              <div className="rounded-[16px] border border-chalk/14 bg-navy-800/80 p-5 w-full max-w-xs">
                <p className="text-xs text-chalk/60 mb-4 text-center">
                  Simulated {method.toUpperCase()} gateway<br />
                  <span className="text-[10px]">(No real payment is processed)</span>
                </p>
                <div className="flex flex-col gap-2.5">
                  <Button variant="primary" className="w-full" onClick={simulateSuccess}>
                    ✓ Simulate Success
                  </Button>
                  <Button variant="danger" className="w-full" onClick={simulateFailure}>
                    ✕ Simulate Failure
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {status === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-8"
            >
              <div className="size-16 rounded-full border-4 border-volt-400/30 border-t-volt-400 animate-spin" />
              <p className="text-sm text-chalk/80">Processing payment…</p>
            </motion.div>
          )}

          {status === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
              >
                <CheckCircle2 className="size-16 text-success" />
              </motion.div>
              <h3 className="text-lg font-semibold text-success">Payment Successful!</h3>
              <p className="text-xs text-chalk/70">
                Your booking <span className="font-mono text-chalk">{bookingId}</span> is confirmed.
              </p>
              <div className="flex items-center gap-3 mt-2">
                <Button variant="primary" size="sm" onClick={onClose}>
                  Done
                </Button>
                <Button variant="ghost" size="sm" onClick={() => {}}>
                  Add to Calendar
                </Button>
              </div>
            </motion.div>
          )}

          {status === "failed" && (
            <motion.div
              key="failed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-4"
            >
              <XCircle className="size-16 text-danger" />
              <h3 className="text-lg font-semibold text-danger">Payment Failed</h3>
              <p className="text-xs text-chalk/70">
                The transaction could not be completed. Your slot hold is still active.
              </p>
              <CountdownRing totalSeconds={HOLD_SECONDS} remainingSeconds={remaining} />
              <Button variant="primary" onClick={handleRetry} leftIcon={<RefreshCw className="size-4" />}>
                Retry Payment
              </Button>
            </motion.div>
          )}

          {status === "expired" && (
            <motion.div
              key="expired"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-4"
            >
              <Clock className="size-16 text-warning" />
              <h3 className="text-lg font-semibold text-warning">Hold Expired</h3>
              <p className="text-xs text-chalk/70">
                Your 5-minute payment window has expired and the slot has been released.
              </p>
              <Button variant="primary" onClick={onClose}>
                Pick Another Slot
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}
