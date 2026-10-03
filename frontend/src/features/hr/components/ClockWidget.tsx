import { useState, useEffect } from "react";
import {
  Clock,
  Play,
  Square,
  KeyRound,
  QrCode,
  CheckCircle2,
  Coffee,
  AlertCircle,
  Timer,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { StatusPill } from "@/components/ui/StatusPill";
import { useHrStore } from "../hrStore";
import { cn } from "@/lib/cn";

export interface ClockWidgetProps {
  employeeId?: string;
  employeeName?: string;
  className?: string;
  onClockStatusChange?: (clockedIn: boolean) => void;
}

export function ClockWidget({
  employeeId = "EMP-001",
  employeeName = "Aarav Sharma",
  className,
  onClockStatusChange,
}: ClockWidgetProps) {
  const { activeClockSessions, clockIn, clockOut, attendance } = useHrStore();

  const isClockedIn = Boolean(activeClockSessions[employeeId]);
  const activeSession = activeClockSessions[employeeId];

  const [method, setMethod] = useState<"BUTTON" | "PIN" | "QR">("BUTTON");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isOnBreak, setIsOnBreak] = useState(false);

  // Live digital clock ticker
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-IN", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = () => {
    if (isClockedIn) {
      clockOut(employeeId);
      onClockStatusChange?.(false);
    } else {
      if (method === "PIN") {
        if (!pin.trim() || (pin !== "1234" && pin !== "2345" && pin !== "3456" && pin !== "9999")) {
          setPinError("Invalid Staff PIN. Please try again.");
          return;
        }
      }
      setPinError("");
      setPin("");
      clockIn(employeeId, method);
      onClockStatusChange?.(true);
    }
  };

  // Today's attendance record
  const today = new Date().toISOString().split("T")[0] || "";
  const todayRecord = attendance.find((a) => a.employeeId === employeeId && a.date === today);

  return (
    <Card className={cn("relative overflow-hidden border-chalk/14 bg-gradient-to-br from-court-500 to-court-600/90 p-6", className)}>
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left: Clock status & live digital timer */}
        <div className="space-y-3 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2.5">
            <StatusPill variant={isClockedIn ? "success" : "warning"}>
              {isClockedIn ? "ON SHIFT · ACTIVE" : "OFF DUTY"}
            </StatusPill>
            {isOnBreak && (
              <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-semibold px-2.5 py-0.5 flex items-center gap-1">
                <Coffee className="size-3" /> On Tea Break
              </span>
            )}
            <span className="text-xs text-chalk/60 font-mono">Asia/Kolkata</span>
          </div>

          <div className="space-y-1">
            <div className="text-4xl md:text-5xl font-black font-mono tracking-tight text-chalk flex items-center justify-center md:justify-start gap-2">
              <Clock className="size-7 text-volt-400 shrink-0" />
              <span>{currentTime || "00:00:00"}</span>
            </div>
            <p className="text-xs text-chalk/70">
              Assigned to: <strong className="text-chalk">{employeeName}</strong> ({employeeId})
            </p>
          </div>

          {isClockedIn && activeSession && (
            <div className="flex items-center justify-center md:justify-start gap-4 text-xs font-mono text-chalk/80 pt-1">
              <div>
                <span className="text-chalk/50">Clocked In: </span>
                <span className="font-bold text-volt-400">{activeSession.clockInTime}</span>
              </div>
              <div>
                <span className="text-chalk/50">Method: </span>
                <span className="text-chalk font-semibold">{activeSession.method}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Method selector & Big Action Button */}
        <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto">
          {!isClockedIn && (
            <div className="flex items-center gap-1 rounded-full bg-court-700/80 p-1 border border-chalk/10 text-xs">
              <button
                type="button"
                onClick={() => setMethod("BUTTON")}
                className={cn(
                  "rounded-full px-3 py-1 font-medium transition-colors",
                  method === "BUTTON" ? "bg-volt-400 text-ink-900 font-bold" : "text-chalk/70 hover:text-chalk"
                )}
              >
                Quick Touch
              </button>
              <button
                type="button"
                onClick={() => setMethod("PIN")}
                className={cn(
                  "rounded-full px-3 py-1 font-medium transition-colors flex items-center gap-1",
                  method === "PIN" ? "bg-volt-400 text-ink-900 font-bold" : "text-chalk/70 hover:text-chalk"
                )}
              >
                <KeyRound className="size-3" /> PIN
              </button>
              <button
                type="button"
                onClick={() => setMethod("QR")}
                className={cn(
                  "rounded-full px-3 py-1 font-medium transition-colors flex items-center gap-1",
                  method === "QR" ? "bg-volt-400 text-ink-900 font-bold" : "text-chalk/70 hover:text-chalk"
                )}
              >
                <QrCode className="size-3" /> Badge QR
              </button>
            </div>
          )}

          {method === "PIN" && !isClockedIn && (
            <div className="w-48 space-y-1">
              <Input
                type="password"
                maxLength={4}
                placeholder="Enter 4-digit PIN (1234)"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setPinError("");
                }}
                className="text-center font-mono tracking-widest text-sm"
              />
              {pinError && <p className="text-[11px] text-danger text-center">{pinError}</p>}
            </div>
          )}

          {method === "QR" && !isClockedIn && (
            <div className="rounded-xl border border-chalk/14 bg-court-700/50 p-2.5 text-center text-[11px] text-chalk/70 flex items-center gap-2">
              <QrCode className="size-5 text-volt-400 shrink-0" />
              <span>Scan employee QR badge on terminal scanner</span>
            </div>
          )}

          {/* Big Action Button */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            {isClockedIn && (
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setIsOnBreak(!isOnBreak)}
                className="gap-2 text-xs"
              >
                <Coffee className="size-4" />
                {isOnBreak ? "Resume Duty" : "Take Break"}
              </Button>
            )}

            <Button
              variant={isClockedIn ? "danger" : "primary"}
              size="lg"
              onClick={handleToggle}
              className={cn(
                "w-full md:w-52 h-14 text-base font-bold shadow-lg gap-2.5",
                isClockedIn
                  ? "bg-rose-500 hover:bg-rose-600 text-white border border-rose-400/30"
                  : "bg-volt-400 hover:bg-volt-500 text-ink-900 shadow-volt-400/20"
              )}
            >
              {isClockedIn ? (
                <>
                  <Square className="size-5 fill-current" /> Clock Out Shift
                </>
              ) : (
                <>
                  <Play className="size-5 fill-current" /> Clock In Shift
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
