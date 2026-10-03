import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays, Trophy, Clock, IndianRupee, ArrowRight,
  AlertTriangle, Check, Calendar, ChevronRight, Repeat, X,
  MapPin, Zap,
} from "lucide-react";
import { AvailabilityGrid } from "@/components/shared/AvailabilityGrid";
import { PaymentModal } from "@/features/booking/components/PaymentModal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Money, formatINR } from "@/components/shared/Money";
import { cn } from "@/lib/cn";
import { useDisclosure } from "@/hooks/useDisclosure";
import { useBookings, toDateStr } from "@/features/booking/useBookings";
import type { Sport, Booking, AlternativeSlot, MemberTier } from "@/features/booking/types";
import { SPORT_LABELS, SPORT_ICONS } from "@/features/booking/types";
import {
  COURTS,
  SESSION_MINUTES,
  MAX_BOOKINGS_PER_DAY,
  addMinutes,
} from "@/features/booking/sampleData";
import type { PageProps } from "@/types/common";

// ── Recurring booking config ──
interface RecurringConfig {
  frequency: "daily" | "weekly" | "biweekly";
  count: number;
}

const FREQUENCY_LABELS: Record<RecurringConfig["frequency"], string> = {
  daily: "Every day",
  weekly: "Every week",
  biweekly: "Every 2 weeks",
};

// ── Slot-Taken Collision Modal ──
function SlotTakenModal({
  isOpen,
  onClose,
  alternatives,
  onPickAlternative,
}: {
  isOpen: boolean;
  onClose: () => void;
  alternatives: AlternativeSlot[];
  onPickAlternative: (alt: AlternativeSlot) => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="flex flex-col items-center gap-5 text-center">
        <AlertTriangle className="size-12 text-warning" />
        <h3 className="text-lg font-semibold text-chalk">Slot Taken!</h3>
        <p className="text-sm text-chalk/70">
          Someone just grabbed that slot. Here are available alternatives:
        </p>
        <div className="w-full flex flex-col gap-2">
          {alternatives.length === 0 ? (
            <p className="text-xs text-chalk/60">No alternative slots available at this time.</p>
          ) : (
            alternatives.map((alt) => (
              <button
                key={`${alt.courtId}-${alt.time}`}
                onClick={() => onPickAlternative(alt)}
                className="flex items-center justify-between rounded-[14px] border border-chalk/14 bg-chalk/6 px-4 py-3 text-sm text-chalk hover:bg-volt-400/10 hover:border-volt-400/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="size-4 text-chalk/50 group-hover:text-volt-400" />
                  <span className="font-medium">{alt.courtName}</span>
                  <span className="text-chalk/60">·</span>
                  <span className="text-chalk/70">{alt.time} – {addMinutes(alt.time, SESSION_MINUTES)}</span>
                </div>
                <ChevronRight className="size-4 text-chalk/40 group-hover:text-volt-400" />
              </button>
            ))
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}

// ── Recurring Booking Stepper ──
function RecurringStepper({
  isOpen,
  onClose,
  config,
  setConfig,
  onConfirm,
  courtName,
  date,
  time,
  sport,
}: {
  isOpen: boolean;
  onClose: () => void;
  config: RecurringConfig;
  setConfig: (c: RecurringConfig) => void;
  onConfirm: () => void;
  courtName: string;
  date: string;
  time: string;
  sport: Sport;
}) {
  const [step, setStep] = useState(0);

  const generatePreviewDates = (): string[] => {
    const dates: string[] = [];
    const base = new Date(date);
    const daysToAdd = config.frequency === "daily" ? 1 : config.frequency === "weekly" ? 7 : 14;

    for (let i = 0; i < config.count; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + daysToAdd * i);
      dates.push(toDateStr(d));
    }
    return dates;
  };

  const previewDates = generatePreviewDates();

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      <div className="flex flex-col gap-5">
        {/* Step indicator */}
        <div className="flex items-center gap-4 mb-2">
          {["Frequency", "Preview", "Confirm"].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={cn(
                  "size-7 rounded-full flex items-center justify-center text-xs font-semibold",
                  step >= i ? "bg-volt-400 text-ink-900" : "bg-chalk/14 text-chalk/50"
                )}
              >
                {step > i ? <Check className="size-3.5" /> : i + 1}
              </div>
              <span className={cn("text-xs font-medium", step >= i ? "text-chalk" : "text-chalk/50")}>
                {label}
              </span>
              {i < 2 && <ChevronRight className="size-3 text-chalk/30 ml-1" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 0: Frequency */}
          {step === 0 && (
            <motion.div key="freq" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h3 className="text-base font-semibold text-chalk mb-4">Set recurring frequency</h3>
              <div className="flex flex-col gap-2">
                {(["daily", "weekly", "biweekly"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setConfig({ ...config, frequency: f })}
                    className={cn(
                      "flex items-center gap-3 rounded-[14px] border px-4 py-3 text-sm transition-all",
                      config.frequency === f
                        ? "border-volt-400 bg-volt-400/12 text-volt-400"
                        : "border-chalk/14 bg-chalk/6 text-chalk/80 hover:bg-chalk/10"
                    )}
                  >
                    <Repeat className="size-4" />
                    {FREQUENCY_LABELS[f]}
                  </button>
                ))}
              </div>
              <div className="mt-4">
                <label className="text-xs text-chalk/70 mb-1 block">Number of bookings</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={2}
                    max={12}
                    value={config.count}
                    onChange={(e) => setConfig({ ...config, count: Number(e.target.value) })}
                    className="flex-1 accent-volt-400"
                  />
                  <span className="text-sm font-semibold text-volt-400 min-w-[24px] text-center">{config.count}</span>
                </div>
              </div>
              <div className="flex justify-end mt-5">
                <Button onClick={() => setStep(1)} rightIcon={<ArrowRight className="size-4" />}>
                  Preview
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 1: Preview */}
          {step === 1 && (
            <motion.div key="preview" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h3 className="text-base font-semibold text-chalk mb-4">Preview bookings</h3>
              <div className="rounded-[14px] border border-chalk/14 overflow-hidden">
                <div className="bg-court-700 px-4 py-2 flex items-center gap-2 text-xs font-medium text-chalk/70">
                  <span>{courtName}</span>
                  <span>·</span>
                  <span>{SPORT_ICONS[sport]} {SPORT_LABELS[sport]}</span>
                  <span>·</span>
                  <span>{time} – {addMinutes(time, SESSION_MINUTES)}</span>
                </div>
                <div className="max-h-[240px] overflow-y-auto">
                  {previewDates.map((d, i) => (
                    <div
                      key={d}
                      className={cn(
                        "flex items-center justify-between px-4 py-2.5 text-xs",
                        i % 2 === 0 ? "bg-court-500" : "bg-court-600/40"
                      )}
                    >
                      <span className="flex items-center gap-2 text-chalk/80">
                        <Calendar className="size-3.5 text-chalk/50" />
                        {d}
                      </span>
                      <Badge variant="success">Available</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between mt-5">
                <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
                <Button onClick={() => setStep(2)} rightIcon={<ArrowRight className="size-4" />}>
                  Confirm
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Confirm */}
          {step === 2 && (
            <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex flex-col items-center gap-4 text-center py-4">
                <Repeat className="size-12 text-volt-400" />
                <h3 className="text-base font-semibold text-chalk">Confirm Recurring Booking</h3>
                <p className="text-sm text-chalk/70">
                  {config.count} bookings, {FREQUENCY_LABELS[config.frequency].toLowerCase()}, at {time} on {courtName}
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                  <Button onClick={onConfirm} leftIcon={<Check className="size-4" />}>
                    Book All
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}

// ── Main Page ──
export default function BookCourtPage(_props: PageProps) {
  const currentTier: MemberTier = "Gold";
  const bookingState = useBookings(currentTier);
  const {
    sport,
    setSport,
    selectedDate,
    setSelectedDate,
    grid,
    loading,
    error,
    todayBookingCount,
    canBook,
    quote,
    createBooking,
    confirmBooking,
    expireBooking,
    getAlternatives,
    simulateLoad,
  } = bookingState;

  const [selectedSlot, setSelectedSlot] = useState<{ courtId: string; time: string } | null>(null);
  const [pendingBooking, setPendingBooking] = useState<Booking | null>(null);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [alternatives, setAlternatives] = useState<AlternativeSlot[]>([]);
  const [recurringConfig, setRecurringConfig] = useState<RecurringConfig>({ frequency: "weekly", count: 4 });

  const paymentModal = useDisclosure();
  const recurringModal = useDisclosure();
  const slotTakenModal = useDisclosure();

  // Derive the selected court + price
  const selectedCourt = useMemo(
    () => COURTS.find((c) => c.id === selectedSlot?.courtId),
    [selectedSlot]
  );
  const currentQuote = useMemo(() => quote(sport), [sport, quote]);

  // ── Handle slot selection ──
  const handleSelectSlot = useCallback(
    (slot: { courtId: string; time: string }) => {
      if (!canBook) return;
      setSelectedSlot((prev) =>
        prev?.courtId === slot.courtId && prev?.time === slot.time ? null : slot
      );
    },
    [canBook]
  );

  // ── Book now ──
  const handleBook = useCallback(() => {
    if (!selectedSlot) return;
    const result = createBooking(selectedSlot.courtId, selectedDate, selectedSlot.time);

    if (!result.success) {
      if (result.error === "SLOT_TAKEN" || result.error === "INVALID_COURT") {
        const alts = getAlternatives(selectedSlot.courtId, selectedSlot.time);
        setAlternatives(alts);
        slotTakenModal.open();
      }
      return;
    }

    setPendingBooking(result.booking!);

    // Gold members: instant confirmation (₹0)
    if (result.booking!.price === 0) {
      confirmBooking(result.booking!.id);
      setSelectedSlot(null);
      // Could show a toast here
      return;
    }

    // Open payment modal
    paymentModal.open();
  }, [selectedSlot, selectedDate, createBooking, getAlternatives, confirmBooking, paymentModal, slotTakenModal, canBook]);

  // ── Payment handlers ──
  const handlePaymentSuccess = useCallback(() => {
    if (pendingBooking) {
      confirmBooking(pendingBooking.id);
    }
    setSelectedSlot(null);
    setPendingBooking(null);
  }, [pendingBooking, confirmBooking]);

  const handlePaymentExpired = useCallback(() => {
    if (pendingBooking) {
      expireBooking(pendingBooking.id);
    }
    setPendingBooking(null);
    setSelectedSlot(null);
  }, [pendingBooking, expireBooking]);

  // ── Slot-taken alternative pick ──
  const handlePickAlternative = useCallback(
    (alt: AlternativeSlot) => {
      slotTakenModal.close();
      setSelectedSlot({ courtId: alt.courtId, time: alt.time });
    },
    [slotTakenModal]
  );

  // ── Recurring confirm ──
  const handleRecurringConfirm = useCallback(() => {
    // In a real app, this would create multiple bookings. For now, just close.
    recurringModal.close();
    if (selectedSlot) {
      handleBook();
    }
  }, [recurringModal, selectedSlot, handleBook]);

  return (
    <div className="min-h-full flex flex-col gap-6 pb-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <Trophy className="size-5 text-volt-400" />
            <h1 className="text-xl font-semibold text-chalk">Book a Court</h1>
          </div>
          <p className="text-sm text-chalk/60">Select a sport, date, and slot to reserve your court.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Booking cap indicator */}
          <div
            className={cn(
              "flex items-center gap-2 rounded-pill px-3 py-1.5 text-xs font-medium border",
              canBook
                ? "border-chalk/18 text-chalk/70"
                : "border-danger/40 bg-danger/10 text-danger"
            )}
          >
            <CalendarDays className="size-3.5" />
            <span>
              {todayBookingCount}/{MAX_BOOKINGS_PER_DAY} today
            </span>
          </div>

          {/* Member tier badge */}
          <Badge variant="volt" className="text-[11px]">
            {currentTier} Member
          </Badge>
        </div>
      </div>

      {/* ── Availability Grid ── */}
      <AvailabilityGrid
        grid={grid}
        sport={sport}
        date={selectedDate}
        mode="member"
        loading={loading}
        error={error}
        selectedSlot={selectedSlot}
        onSelectSlot={handleSelectSlot}
        onSportChange={setSport}
        onDateChange={setSelectedDate}
        onRetry={simulateLoad}
      />

      {/* ── Selected Slot Panel ── */}
      <AnimatePresence>
        {selectedSlot && selectedCourt && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="sticky bottom-4 z-30 mx-auto w-full max-w-2xl"
          >
            <div className="rounded-[20px] border border-volt-400/30 bg-court-700/95 backdrop-blur-xl shadow-2xl p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                {/* Details */}
                <div className="flex-1 flex flex-col gap-2 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{SPORT_ICONS[sport]}</span>
                    <h3 className="text-base font-semibold text-chalk">{selectedCourt.name}</h3>
                    <Badge variant={selectedCourt.indoor ? "info" : "default"} className="text-[10px]">
                      {selectedCourt.indoor ? "Indoor" : "Outdoor"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-chalk/70">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3.5" />
                      {selectedDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {selectedSlot.time} – {addMinutes(selectedSlot.time, SESSION_MINUTES)}
                    </span>
                  </div>

                  {/* Pricing */}
                  <div className="flex items-center gap-3 mt-1">
                    {currentQuote.youPay === 0 ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="success" className="text-[10px]">
                          <Zap className="size-3 mr-0.5" />
                          Instant
                        </Badge>
                        <span className="text-sm font-semibold text-success">₹0</span>
                        <span className="text-xs text-chalk/50 line-through">
                          {formatINR(currentQuote.guestRate)}
                        </span>
                        <span className="text-[10px] text-chalk/50">({currentQuote.planName} benefit)</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <IndianRupee className="size-3.5 text-volt-400" />
                        <span className="text-base font-semibold text-volt-400">
                          {formatINR(currentQuote.youPay)}
                        </span>
                        {currentQuote.planDiscount > 0 && (
                          <>
                            <span className="text-xs text-chalk/50 line-through">
                              {formatINR(currentQuote.guestRate)}
                            </span>
                            <Badge variant="volt" className="text-[10px]">
                              Save {formatINR(currentQuote.planDiscount)}
                            </Badge>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={recurringModal.open}
                    leftIcon={<Repeat className="size-3.5" />}
                  >
                    Recurring
                  </Button>
                  <Button
                    size="md"
                    onClick={handleBook}
                    disabled={!canBook}
                    rightIcon={<ArrowRight className="size-4" />}
                    className="min-w-[140px]"
                  >
                    {currentQuote.youPay === 0 ? "Confirm" : "Book & Pay"}
                  </Button>
                </div>
              </div>

              {!canBook && (
                <p className="text-xs text-danger mt-3 flex items-center gap-1.5">
                  <AlertTriangle className="size-3.5" />
                  You've reached your daily booking limit ({MAX_BOOKINGS_PER_DAY} bookings).
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modals ── */}
      {pendingBooking && pendingBooking.holdExpiry && (
        <PaymentModal
          isOpen={paymentModal.isOpen}
          onClose={() => {
            paymentModal.close();
            // Don't expire on close, the hold is still active
          }}
          amount={pendingBooking.price}
          bookingId={pendingBooking.id}
          courtName={pendingBooking.courtName}
          date={pendingBooking.date}
          startTime={pendingBooking.startTime}
          endTime={pendingBooking.endTime}
          holdExpiryMs={pendingBooking.holdExpiry}
          onSuccess={handlePaymentSuccess}
          onExpired={handlePaymentExpired}
        />
      )}

      <SlotTakenModal
        isOpen={slotTakenModal.isOpen}
        onClose={slotTakenModal.close}
        alternatives={alternatives}
        onPickAlternative={handlePickAlternative}
      />

      {selectedSlot && selectedCourt && (
        <RecurringStepper
          isOpen={recurringModal.isOpen}
          onClose={recurringModal.close}
          config={recurringConfig}
          setConfig={setRecurringConfig}
          onConfirm={handleRecurringConfirm}
          courtName={selectedCourt.name}
          date={selectedDate}
          time={selectedSlot.time}
          sport={sport}
        />
      )}
    </div>
  );
}
