import { useState, useEffect, useRef } from "react";
import { useGo } from "@/app/router/links";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Scan,
  Search,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Wallet,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MemberSearch } from "../components/MemberSearch";
import { ScanDialog } from "../components/ScanDialog";
import {
  getCheckinEligibility,
  performDeskCheckin,
  DESK_MEMBERS,
} from "../sampleData";
import type { DeskMember, DeskCheckinEligibility } from "../types";

export default function DeskCheckin() {
  const navigate = useGo();
  const [selectedMember, setSelectedMember] = useState<DeskMember | null>(() => {
    // Default to Pratham Patel for instant demo
    return DESK_MEMBERS.find((m: DeskMember) => m.id === "CC-000123") ?? null;
  });

  const [eligibility, setEligibility] = useState<DeskCheckinEligibility | null>(() => {
    const defaultM = DESK_MEMBERS.find((m: DeskMember) => m.id === "CC-000123");
    return defaultM ? getCheckinEligibility(defaultM.id) : null;
  });

  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isCheckedInSuccess, setIsCheckedInSuccess] = useState(false);
  const [countdown, setCountdown] = useState<number>(3);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // When member changes, update eligibility
  const handleSelectMember = (member: DeskMember) => {
    setSelectedMember(member);
    const elig = getCheckinEligibility(member.id);
    setEligibility(elig);
    setIsCheckedInSuccess(false);
  };

  const handlePerformCheckIn = () => {
    if (!selectedMember) return;
    const res = performDeskCheckin(selectedMember.id);
    if (res.success) {
      setIsCheckedInSuccess(true);
      setCountdown(3);

      // Auto reset in 3s for the next person
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(countdownTimerRef.current!);
            handleResetForNext();
            return 3;
          }
          return c - 1;
        });
      }, 1000);
    }
  };

  const handleResetForNext = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setIsCheckedInSuccess(false);
    setSelectedMember(null);
    setEligibility(null);
    setCountdown(3);
  };

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] p-4 sm:p-6 max-w-3xl mx-auto w-full">
      {/* Top Header */}
      <div className="w-full text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Front Desk Member Check-in
        </h1>
        <p className="text-xs sm:text-sm text-white/60 mt-1">
          MEM-15: Scan membership QR or search to verify membership, court booking &amp; tab dues
        </p>
      </div>

      {/* Centered Search & Scan Bar */}
      <div className="w-full flex flex-col sm:flex-row items-stretch gap-3 mb-6">
        <div className="flex-1">
          <MemberSearch
            placeholder="Type name, phone or Member ID to check in..."
            onSelectMember={handleSelectMember}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setIsScanOpen(true)}
          className="flex items-center justify-center gap-2 h-12 px-5"
        >
          <Scan className="size-4 text-volt-400" />
          <span>Scan Card / QR</span>
        </Button>
      </div>

      {/* Quick Demo Shortcuts */}
      <div className="flex items-center gap-2 mb-6 text-xs text-white/60 flex-wrap justify-center">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-white/40">
          Demo quick select:
        </span>
        <button
          type="button"
          onClick={() => handleSelectMember(DESK_MEMBERS[0]!)}
          className="px-2.5 py-1 rounded-pill bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 transition-colors"
        >
          Pratham (Active + Booking + Tab ₹640)
        </button>
        <button
          type="button"
          onClick={() => handleSelectMember(DESK_MEMBERS[1]!)}
          className="px-2.5 py-1 rounded-pill bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 transition-colors"
        >
          Priya (Expiring in 8d)
        </button>
        <button
          type="button"
          onClick={() => handleSelectMember(DESK_MEMBERS[4]!)}
          className="px-2.5 py-1 rounded-pill bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 transition-colors"
        >
          Vikram (No booking today)
        </button>
      </div>

      {/* ELIGIBILITY CARD */}
      {selectedMember && eligibility ? (
        <Card className="w-full p-6 sm:p-8 flex flex-col gap-6 relative overflow-hidden border-white/20 shadow-2xl">
          {isCheckedInSuccess ? (
            /* SUCCESS CELEBRATION VIEW */
            <div className="py-8 flex flex-col items-center text-center gap-4 animate-scale-up">
              <div className="size-20 rounded-full bg-success/20 border-2 border-success flex items-center justify-center text-success shadow-glow-volt">
                <CheckCircle2 className="size-12 animate-bounce" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white">
                  {selectedMember.name} Checked In!
                </h2>
                <p className="text-sm text-volt-400 font-mono mt-1">
                  {eligibility.todayBooking?.courtName} · {eligibility.todayBooking?.time}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-white/70 max-w-sm">
                Turnstile access granted. Turnstile will open for entry at Court Gate A.
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-white/50 bg-white/5 px-4 py-1.5 rounded-pill border border-white/10">
                <RotateCcw className="size-3.5 animate-spin" />
                <span>Auto-resetting for next member in {countdown}s...</span>
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={handleResetForNext}
                className="mt-2 text-xs text-white/70 hover:text-white"
              >
                Reset Now for Next Person
              </Button>
            </div>
          ) : (
            /* ELIGIBILITY ROWS VIEW */
            <>
              {/* Member Strip Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedMember.avatar}
                    alt={selectedMember.name}
                    className="size-16 rounded-full object-cover border-2 border-volt-400/50 shadow-md"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-white tracking-tight">
                        {selectedMember.name}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-pill bg-volt-400 text-ink-900 font-bold text-xs uppercase">
                        {selectedMember.tier}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-white/60 mt-0.5">
                      {selectedMember.id} · {selectedMember.phone}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  className="text-xs text-volt-400 hover:text-volt-300 self-start sm:self-center"
                  onClick={() => navigate(`/desk/members/${selectedMember.id}`)}
                >
                  View Profile <ExternalLink className="size-3.5 ml-1" />
                </Button>
              </div>

              {/* The Three Eligibility Rows */}
              <div className="flex flex-col gap-3">
                {/* ROW 1: Membership Validity */}
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${
                    eligibility.membershipValid
                      ? "bg-success/10 border-success/30 text-white"
                      : "bg-danger/10 border-danger/30 text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {eligibility.membershipValid ? (
                      <CheckCircle2 className="size-6 text-success shrink-0" />
                    ) : (
                      <XCircle className="size-6 text-danger shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-semibold">
                        Membership {selectedMember.status} ({selectedMember.daysRemaining} days left)
                      </p>
                      <p className="text-xs text-white/60">
                        {selectedMember.tier} Plan · Valid till {selectedMember.validTill}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-pill ${
                      eligibility.membershipValid
                        ? "bg-success/20 text-success"
                        : "bg-danger/20 text-danger"
                    }`}
                  >
                    {eligibility.membershipValid ? "VALID" : "INVALID"}
                  </span>
                </div>

                {/* ROW 2: Booking Today */}
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${
                    eligibility.todayBooking
                      ? "bg-success/10 border-success/30 text-white"
                      : "bg-danger/10 border-danger/30 text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {eligibility.todayBooking ? (
                      <CheckCircle2 className="size-6 text-success shrink-0" />
                    ) : (
                      <XCircle className="size-6 text-danger shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-semibold">
                        {eligibility.todayBooking
                          ? `Booking Today: ${eligibility.todayBooking.courtName} · ${eligibility.todayBooking.time}`
                          : "No Court Booked for Today"}
                      </p>
                      <p className="text-xs text-white/60">
                        {eligibility.todayBooking
                          ? `${eligibility.todayBooking.sport.toUpperCase()} · Status: ${eligibility.todayBooking.status}`
                          : "Member needs an active court reservation to check in"}
                      </p>
                    </div>
                  </div>

                  {eligibility.todayBooking ? (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-pill bg-success/20 text-success">
                      RESERVED
                    </span>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      className="!h-8 !px-3 text-xs"
                      onClick={() => navigate("/desk/walk-in")}
                    >
                      Book Now
                    </Button>
                  )}
                </div>

                {/* ROW 3: Tab Dues / Outstanding */}
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${
                    eligibility.duesAmount > 0
                      ? "bg-warning/10 border-warning/30 text-white"
                      : "bg-success/10 border-success/30 text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {eligibility.duesAmount > 0 ? (
                      <AlertTriangle className="size-6 text-warning shrink-0" />
                    ) : (
                      <CheckCircle2 className="size-6 text-success shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-semibold">
                        {eligibility.duesAmount > 0
                          ? `Outstanding Tab / Dues: ₹${eligibility.duesAmount.toLocaleString("en-IN")}`
                          : "Outstanding Dues: None (Account Clear)"}
                      </p>
                      <p className="text-xs text-white/60">
                        {eligibility.duesAmount > 0
                          ? "Courtside Bar & Cafe tab unsettled from previous visit"
                          : "All invoices and tabs settled in full"}
                      </p>
                    </div>
                  </div>

                  {eligibility.duesAmount > 0 && (
                    <Button
                      type="button"
                      variant="secondary"
                      className="!h-8 !px-3 text-xs text-warning border-warning/40 hover:bg-warning/10"
                      onClick={() => navigate("/desk/payments")}
                    >
                      <Wallet className="size-3 mr-1" /> View / Settle
                    </Button>
                  )}
                </div>
              </div>

              {/* BIG 64px TALL VOLT [CHECK IN] BUTTON */}
              <button
                type="button"
                onClick={handlePerformCheckIn}
                disabled={!eligibility.canCheckIn}
                className={`w-full h-16 rounded-pill text-ink-900 font-bold text-lg tracking-wide uppercase flex items-center justify-center gap-3 transition-all duration-200 ${
                  eligibility.canCheckIn
                    ? "bg-volt-400 hover:bg-volt-500 hover:scale-[1.01] active:scale-[0.98] shadow-glow-volt cursor-pointer"
                    : "bg-white/20 text-white/40 cursor-not-allowed border border-white/10"
                }`}
              >
                <CheckCircle2 className="size-6 stroke-[2.5]" />
                <span>CHECK IN NOW</span>
              </button>

              {!eligibility.canCheckIn && (
                <p className="text-center text-xs text-danger -mt-2 flex items-center justify-center gap-1.5">
                  <XCircle className="size-3.5" />
                  <span>Cannot check in: Active booking today and valid membership required.</span>
                </p>
              )}
            </>
          )}
        </Card>
      ) : (
        /* Empty State */
        <Card className="w-full p-12 text-center flex flex-col items-center gap-4 bg-court-600/40 border-dashed border-white/20">
          <div className="size-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
            <Search className="size-8" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">No Member Selected</h3>
            <p className="text-xs text-white/50 mt-1 max-w-sm">
              Use the search bar above or scan the member QR card to pull up real-time eligibility rows.
            </p>
          </div>
        </Card>
      )}

      {/* QR / Wedge Scanner Dialog */}
      <ScanDialog
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        onScanSuccess={handleSelectMember}
        title="Check-in Member Scanner"
        subtitle="Hardware wedge scanner or manual QR token"
      />
    </div>
  );
}
