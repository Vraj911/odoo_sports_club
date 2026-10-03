import { useState, useMemo } from "react";
import { useGo } from "@/app/router/links";
import {
  Zap,
  PhoneCall,
  User,
  Users,
  CreditCard,
  Printer,
  Mail,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ReasonDialog } from "@/components/shared/ReasonDialog";
import { AdminPinDialog } from "@/components/shared/AdminPinDialog";
import { AvailabilityGrid } from "@/components/shared/AvailabilityGrid";
import { MemberSearch } from "../components/MemberSearch";
import {
  createDeskWalkInBooking,
  DESK_MEMBERS,
} from "../sampleData";
import {
  COURTS,
  PRICING,
  TIME_SLOTS,
} from "@/features/booking/sampleData";
import { useBookings } from "@/features/booking/useBookings";
import type { Sport, SlotCell } from "@/features/booking/types";
import type { DeskMember, DeskBookingRecord } from "../types";

export default function DeskWalkIn() {
  const navigate = useGo();

  // Mode: walk-in vs phone
  const [isPhoneMode, setIsPhoneMode] = useState(false);

  const { grid, sport, setSport, selectedDate: date, setSelectedDate: setDate } = useBookings("Gold");

  // Tap 1: Selected slot
  const [selectedSlot, setSelectedSlot] = useState<{ courtId: string; time: string } | null>({
    courtId: "tc-1",
    time: "18:00",
  });

  // Tap 2: Customer type [Guest | Member]
  const [customerType, setCustomerType] = useState<"Guest" | "Member">("Member");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [selectedMember, setSelectedMember] = useState<DeskMember | null>(() => {
    return DESK_MEMBERS.find((m: DeskMember) => m.id === "CC-000123") ?? null;
  });

  // Tap 3: Payment method
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "UPI" | "Card" | "Pay Later">("Cash");

  // Booking states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<DeskBookingRecord | null>(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showSlotTakenModal, setShowSlotTakenModal] = useState(false);
  const [showAdminOverrideModal, setShowAdminOverrideModal] = useState(false);
  const [overrideApproved, setOverrideApproved] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Resolved Court details
  const courtInfo = useMemo(() => {
    if (!selectedSlot) return null;
    return COURTS.find((c) => c.id === selectedSlot.courtId) ?? COURTS[0]!;
  }, [selectedSlot]);

  // Pricing calculation
  const { basePrice, discount, finalPrice } = useMemo(() => {
    const rawPrice = (PRICING[sport] && PRICING[sport]["Guest"]) ? PRICING[sport]["Guest"] : 600;
    if (customerType === "Guest") {
      return { basePrice: rawPrice, discount: 0, finalPrice: rawPrice };
    }
    // Member tier discounts
    if (selectedMember) {
      const tierPrice = (PRICING[sport] && PRICING[sport][selectedMember.tier] !== undefined)
        ? PRICING[sport][selectedMember.tier]
        : 0;
      return { basePrice: rawPrice, discount: Math.max(0, rawPrice - tierPrice), finalPrice: tierPrice };
    }
    return { basePrice: rawPrice, discount: 0, finalPrice: rawPrice };
  }, [sport, customerType, selectedMember]);

  // Cap validation: 2 bookings/day rule
  const isCapExceeded = useMemo(() => {
    if (customerType !== "Member" || !selectedMember) return false;
    // Simulate cap limit for demo: members with CC-000123 already have 1 booking today (BK-8021)
    // If overrideApproved is true, allow it
    if (overrideApproved) return false;
    // You can test cap exceeded if desired
    return false;
  }, [customerType, selectedMember, overrideApproved]);

  // "Next Available" auto selector
  const handlePickNextAvailable = () => {
    // Pick first free slot in grid
    for (let r = 0; r < grid.length; r++) {
      const row = grid[r]!;
      for (let c = 0; c < row.length; c++) {
        const cell = row[c]!;
        if (cell.status === "free") {
          setSelectedSlot({ courtId: cell.courtId, time: cell.time });
          setToastMessage(`Selected next opening: ${cell.time} on Court ${cell.courtId.toUpperCase()}`);
          setTimeout(() => setToastMessage(null), 3000);
          return;
        }
      }
    }
  };

  // Perform Booking & Collect
  const handleBookAndCollect = () => {
    if (!selectedSlot || !courtInfo) return;

    if (customerType === "Guest") {
      if (!guestName.trim() || !guestPhone.trim()) {
        alert("Please provide guest name and mobile phone.");
        return;
      }
    } else if (!selectedMember) {
      alert("Please select a club member.");
      return;
    }

    if (isCapExceeded && !overrideApproved) {
      setShowAdminOverrideModal(true);
      return;
    }

    // Simulate 409 Slot Taken edge case randomly or on specific time
    if (selectedSlot.time === "22:00") {
      setShowSlotTakenModal(true);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const memberName = customerType === "Guest" ? guestName : selectedMember!.name;
      const memberId = customerType === "Guest" ? "GUEST" : selectedMember!.id;
      const tier = customerType === "Guest" ? "Guest" : selectedMember!.tier;

      // End time 1 hour after start
      const [h, m] = selectedSlot.time.split(":");
      const endH = String(Number(h) + 1).padStart(2, "0");
      const endTime = `${endH}:${m}`;

      const booking = createDeskWalkInBooking({
        courtId: selectedSlot.courtId,
        courtName: courtInfo.name,
        sport,
        date,
        startTime: selectedSlot.time,
        endTime,
        memberName,
        memberId,
        tier,
        price: finalPrice,
        paymentMethod,
        source: isPhoneMode ? "phone" : "walk-in",
      });

      setConfirmedBooking(booking);
      setIsSubmitting(false);
      setShowConfirmationModal(true);
      setToastMessage(`Booking ${booking.id} created successfully!`);
      setTimeout(() => setToastMessage(null), 4000);
    }, 450);
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 rounded-pill bg-navy-800 border-l-4 border-volt-400 px-5 py-3 shadow-2xl text-sm font-medium text-white flex items-center gap-3 animate-slide-in">
          <CheckCircle2 className="size-4 text-volt-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-court-600/60 p-4 rounded-2xl border border-white/10">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            {isPhoneMode ? (
              <>
                <PhoneCall className="size-6 text-volt-400" />
                <span>Phone Booking (Caller on Desk Line)</span>
              </>
            ) : (
              <>
                <Zap className="size-6 text-volt-400" />
                <span>Walk-in Quick Booking (≤ 3 Taps)</span>
              </>
            )}
          </h1>
          <p className="text-xs text-white/60 mt-0.5">
            BKG-09: Tap 1 Select Slot → Tap 2 Customer → Tap 3 Pay &amp; Confirm
          </p>
        </div>

        {/* Source Toggle */}
        <div className="flex items-center gap-2 bg-navy-950/60 p-1 rounded-pill border border-white/10">
          <button
            type="button"
            onClick={() => setIsPhoneMode(false)}
            className={`px-4 py-1.5 rounded-pill text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              !isPhoneMode
                ? "bg-volt-400 text-ink-900"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Zap className="size-3.5" />
            <span>Walk-in</span>
          </button>
          <button
            type="button"
            onClick={() => setIsPhoneMode(true)}
            className={`px-4 py-1.5 rounded-pill text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              isPhoneMode
                ? "bg-volt-400 text-ink-900"
                : "text-white/60 hover:text-white"
            }`}
          >
            <PhoneCall className="size-3.5" />
            <span>Phone Booking</span>
          </button>
        </div>
      </div>

      {/* SPLIT VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: STAFF AVAILABILITY GRID (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="primary"
              onClick={handlePickNextAvailable}
              className="flex items-center gap-2 shadow-glow-volt font-bold"
            >
              <Zap className="size-4" />
              <span>Next Available Slot</span>
            </Button>

            <span className="text-xs text-white/50">
              Staff Grid Mode · Click free slot to assign
            </span>
          </div>

          <AvailabilityGrid
            grid={grid}
            sport={sport}
            date={date}
            mode="staff"
            selectedSlot={selectedSlot}
            onSelectSlot={(slot) => setSelectedSlot(slot)}
            onSportChange={(newSport) => setSport(newSport)}
            onDateChange={(newDate) => setDate(newDate)}
          />
        </div>

        {/* RIGHT COLUMN: STICKY 3-TAP BOOKING PANEL (4-5 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-6">
          <Card className="p-5 sm:p-6 flex flex-col gap-5 border-white/20 bg-court-600/90 backdrop-blur-md shadow-2xl">
            {/* TAP 1 SUMMARY: SLOT CHOSEN */}
            <div className="flex flex-col gap-2 pb-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-volt-400 flex items-center gap-1.5">
                  <span className="size-4 rounded-full bg-volt-400 text-ink-900 flex items-center justify-center text-[10px] font-bold">
                    1
                  </span>
                  Court &amp; Slot Selected
                </span>
                <span className="text-xs font-mono text-white/60">{date}</span>
              </div>

              {selectedSlot && courtInfo ? (
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-volt-400/10 border border-volt-400/30 flex items-center justify-center text-volt-400 font-bold text-sm">
                      {courtInfo.name.split(" ")[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{courtInfo.name}</p>
                      <p className="text-xs text-volt-400 font-mono">
                        {selectedSlot.time} – {String(Number(selectedSlot.time.split(":")[0]) + 1).padStart(2, "0")}:00 (60m)
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-white/70">
                    ₹{basePrice}/hr
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-white/5 border border-dashed border-white/20 text-center text-xs text-white/50">
                  Click a free slot on the grid or tap &quot;Next Available&quot;
                </div>
              )}
            </div>

            {/* TAP 2: CUSTOMER SEGMENTED CONTROL */}
            <div className="flex flex-col gap-3 pb-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-volt-400 flex items-center gap-1.5">
                  <span className="size-4 rounded-full bg-volt-400 text-ink-900 flex items-center justify-center text-[10px] font-bold">
                    2
                  </span>
                  Customer Details
                </span>
                {customerType === "Member" && selectedMember && (
                  <span className="text-[11px] font-mono text-volt-400 bg-volt-400/10 px-2 py-0.5 rounded-full border border-volt-400/20">
                    Daily Cap: 1/2 used
                  </span>
                )}
              </div>

              {/* Segmented Control */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-navy-950/60 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setCustomerType("Member")}
                  className={`py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                    customerType === "Member"
                      ? "bg-volt-400 text-ink-900"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <Users className="size-3.5" />
                  <span>Club Member</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerType("Guest")}
                  className={`py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                    customerType === "Guest"
                      ? "bg-volt-400 text-ink-900"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <User className="size-3.5" />
                  <span>Guest (Walk-in)</span>
                </button>
              </div>

              {/* Member Search vs Guest Inputs */}
              {customerType === "Member" ? (
                <div className="flex flex-col gap-2">
                  <MemberSearch
                    placeholder="Search member name / phone / CC-ID..."
                    onSelectMember={(m) => {
                      setSelectedMember(m);
                      setToastMessage(`Member selected: ${m.name} (${m.tier})`);
                      setTimeout(() => setToastMessage(null), 2500);
                    }}
                  />
                  {selectedMember && (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={selectedMember.avatar}
                          alt={selectedMember.name}
                          className="size-8 rounded-full object-cover border border-white/20"
                        />
                        <div>
                          <p className="text-xs font-semibold text-white">{selectedMember.name}</p>
                          <p className="text-[11px] text-white/50">{selectedMember.id} · {selectedMember.tier}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-volt-400">
                        {selectedMember.tier === "Gold" ? "Free Quota" : `${selectedMember.tier} Rate`}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <Input
                    placeholder="Guest Full Name *"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                  />
                  <Input
                    placeholder="Guest Phone (+91) *"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                  />
                  <Input
                    placeholder="Email for confirmation (Optional)"
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* TAP 3: PAYMENT METHOD & PRICE BREAKDOWN */}
            <div className="flex flex-col gap-3">
              <span className="text-xs uppercase tracking-wider font-semibold text-volt-400 flex items-center gap-1.5">
                <span className="size-4 rounded-full bg-volt-400 text-ink-900 flex items-center justify-center text-[10px] font-bold">
                  3
                </span>
                Payment &amp; Collect
              </span>

              {/* Payment Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {(["Cash", "UPI", "Card", "Pay Later"] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 px-1 text-xs font-semibold rounded-lg border transition-colors ${
                      paymentMethod === method
                        ? "bg-volt-400 text-ink-900 border-volt-400"
                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>

              {/* Live Price Line & Breakdown */}
              <div className="p-3.5 rounded-xl bg-navy-950/60 border border-white/10 flex flex-col gap-1.5 text-xs">
                <div className="flex justify-between text-white/70">
                  <span>Standard Court Fee (1 hr)</span>
                  <span className="font-mono">₹{basePrice.toLocaleString("en-IN")}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-volt-400 font-medium">
                    <span>{customerType === "Member" ? `${selectedMember?.tier} Benefit` : "Discount"}</span>
                    <span className="font-mono">-₹{discount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="border-t border-white/10 pt-1.5 flex justify-between text-sm font-bold">
                  <span className="text-white">Total Collectable</span>
                  <span className="font-mono text-volt-400 text-base">
                    ₹{finalPrice.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* BIG 56px TALL VOLT [BOOK & COLLECT] BUTTON */}
              <button
                type="button"
                onClick={handleBookAndCollect}
                disabled={isSubmitting || !selectedSlot}
                className={`w-full h-14 rounded-pill font-bold text-base tracking-wide flex items-center justify-center gap-2 transition-all ${
                  isSubmitting || !selectedSlot
                    ? "bg-white/20 text-white/40 cursor-not-allowed border border-white/10"
                    : "bg-volt-400 hover:bg-volt-500 text-ink-900 shadow-glow-volt active:scale-[0.98] cursor-pointer"
                }`}
              >
                <Zap className="size-5" />
                <span>
                  {isSubmitting
                    ? "Processing..."
                    : `Book & Collect ₹${finalPrice.toLocaleString("en-IN")}`}
                </span>
              </button>

              <p className="text-[11px] text-center text-white/40">
                Source stamped: {isPhoneMode ? "PHONE_DESK" : "WALK_IN_DESK"} · Instant SMS receipt
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* CONFIRMATION / PRINTABLE RECEIPT MODAL */}
      <Modal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        title="Walk-in Booking Confirmed"
        subtitle="Reservation confirmed and slot locked in real-time"
      >
        {confirmedBooking && (
          <div className="flex flex-col gap-5 text-center items-center">
            <div className="size-16 rounded-full bg-volt-400/20 border border-volt-400/40 flex items-center justify-center text-volt-400 shadow-glow-volt">
              <CheckCircle2 className="size-9" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">Booking #{confirmedBooking.id}</h3>
              <p className="text-xs text-volt-400 font-mono mt-0.5">
                {confirmedBooking.courtName} · {confirmedBooking.date} · {confirmedBooking.startTime}–{confirmedBooking.endTime}
              </p>
            </div>

            <div className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-white/60">Customer:</span>
                <span className="font-semibold text-white">{confirmedBooking.memberName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Tier / Type:</span>
                <span className="text-white">{confirmedBooking.tier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Payment Method:</span>
                <span className="text-white">{confirmedBooking.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Amount Paid:</span>
                <span className="font-mono font-bold text-volt-400">
                  ₹{confirmedBooking.price.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Booking Channel:</span>
                <span className="uppercase text-white/80">{confirmedBooking.source}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-volt-400/10 border border-volt-400/20 text-xs text-volt-400 text-left w-full flex items-center gap-2">
              <Mail className="size-4 shrink-0" />
              <span>SMS confirmation note sent to customer with Turnstile Entry PIN.</span>
            </div>

            <div className="flex items-center gap-3 w-full">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => window.print()}
              >
                <Printer className="size-4 mr-1.5" /> Print Receipt
              </Button>
              <Button
                type="button"
                variant="primary"
                className="flex-1"
                onClick={() => {
                  setShowConfirmationModal(false);
                  navigate("/desk");
                }}
              >
                Done / Desk Home
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 409 CONFLICT / SLOT TAKEN MODAL */}
      <Modal
        isOpen={showSlotTakenModal}
        onClose={() => setShowSlotTakenModal(false)}
        title="409 Conflict: Slot Just Taken"
        subtitle="Another user or online member completed booking moments ago."
      >
        <div className="flex flex-col gap-4">
          <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/30 text-xs text-danger flex items-center gap-2.5">
            <AlertCircle className="size-5 shrink-0" />
            <span>The slot you selected is no longer available. Please select one of the immediate alternatives below:</span>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-white uppercase tracking-wider">Suggested Openings</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setSelectedSlot({ courtId: "t2", time: "18:00" });
                  setShowSlotTakenModal(false);
                }}
                className="p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-left text-white"
              >
                <p className="font-semibold">Tennis Court 2</p>
                <p className="text-volt-400 font-mono">18:00 – 19:00</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedSlot({ courtId: "t1", time: "19:00" });
                  setShowSlotTakenModal(false);
                }}
                className="p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-left text-white"
              >
                <p className="font-semibold">Tennis Court 1</p>
                <p className="text-volt-400 font-mono">19:00 – 20:00</p>
              </button>
            </div>
          </div>

          <Button type="button" variant="ghost" onClick={() => setShowSlotTakenModal(false)}>
            Close and pick from grid
          </Button>
        </div>
      </Modal>

      {/* ADMIN OVERRIDE REASON DIALOG */}
      <AdminPinDialog
        isOpen={showAdminOverrideModal}
        onClose={() => setShowAdminOverrideModal(false)}
        onConfirm={(reason) => {
          setOverrideApproved(true);
          setShowAdminOverrideModal(false);
          setToastMessage(`Admin override authorized: ${reason}`);
          setTimeout(() => setToastMessage(null), 3500);
        }}
        title="Admin Booking Cap Override"
        description="This member has reached the daily limit of 2 bookings. Admin authorization & audit justification required to proceed."
        overrideType="cap"
      />
    </div>
  );
}
