import { useState, useEffect } from "react";
import { useGo } from "@/app/router/links";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { CourtLines } from "@/components/brand/CourtLines";
import { NoiseOverlay } from "@/components/brand/NoiseOverlay";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useWebsiteStore } from "../websiteStore";
import { Sport } from "@/features/booking/types";
import {
  Trophy,
  Calendar,
  Clock,
  User,
  CreditCard,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  CalendarPlus,
  RefreshCw,
} from "lucide-react";

const TRIAL_SPORTS: { id: Sport; label: string; desc: string }[] = [
  { id: "tennis", label: "Tennis", desc: "Clay or Indoor Hard Court with Wilson balls" },
  { id: "padel", label: "Padel", desc: "Panoramic glass arena with Head Padel pro balls" },
  { id: "badminton", label: "Badminton", desc: "BWF Maple hardwood court with Yonex shuttles" },
  { id: "cricket-net", label: "Cricket Net", desc: "Astro turf cage with programmable bowling machine" },
];

export function TrialBookingPage() {
  const go = useGo();
  const { addTrialLead } = useWebsiteStore();

  // URL Query prefill
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Form State
  const [selectedSport, setSelectedSport] = useState<Sport>("tennis");
  const [selectedDate, setSelectedDate] = useState<string>("2026-10-06");
  const [selectedSlot, setSelectedSlot] = useState<string>("18:00");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [skillLevel, setSkillLevel] = useState<"BEGINNER" | "INTERMEDIATE" | "ADVANCED">("INTERMEDIATE");
  const [guardianConsent, setGuardianConsent] = useState(true);
  const [paymentOption, setPaymentOption] = useState<"ONLINE" | "AT_CLUB">("ONLINE");

  // Slot Hold Timer: 5:00 minutes (300 seconds)
  const [holdSecondsLeft, setHoldSecondsLeft] = useState(300);
  const [isSlotExpired, setIsSlotExpired] = useState(false);

  // Confirmation payload
  const [bookingRef, setBookingRef] = useState<string>("");

  // Start hold timer on Step 4
  useEffect(() => {
    if (currentStep !== 4) return;

    setHoldSecondsLeft(300);
    setIsSlotExpired(false);

    const timer = setInterval(() => {
      setHoldSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsSlotExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentStep]);

  const holdMinutes = Math.floor(holdSecondsLeft / 60);
  const holdSeconds = holdSecondsLeft % 60;
  const holdTimeFormatted = `${holdMinutes}:${holdSeconds.toString().padStart(2, "0")}`;

  // Step 4: Finalize Payment & Create CRM Lead
  const handleCompleteBooking = () => {
    if (isSlotExpired) {
      alert("Your 5-minute slot reservation has expired. Please select a refreshed slot.");
      setCurrentStep(2);
      return;
    }

    const res = addTrialLead({
      sport: selectedSport,
      date: selectedDate,
      timeSlot: selectedSlot,
      fullName: fullName.trim() || "Guest Player",
      phone: phone.trim() || "+91 98200 00000",
      email: email.trim() || "guest@example.com",
      skillLevel,
      paymentMethod: paymentOption,
    });

    setBookingRef(res.bookingRef);
    setCurrentStep(5);
  };

  const handleDownloadCalendar = () => {
    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:Champions Club Trial - ${selectedSport.toUpperCase()}\nDESCRIPTION:Evaluation session and 60-min court play at Champions Club Mumbai. Reference: ${bookingRef}\nDTSTART:${selectedDate.replace(/-/g, "")}T180000\nDTEND:${selectedDate.replace(/-/g, "")}T190000\nLOCATION:Plot 42, Worli Sea Face Promenade, Mumbai\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `trial-${bookingRef}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-backdrop text-chalk font-sans">
      <PublicNavbar />

      {/* Hero Header */}
      <div className="relative overflow-hidden border-b border-chalk/14 bg-court-700/60 py-10 px-4 sm:px-6">
        <NoiseOverlay opacity={0.03} />
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-volt-400/20 text-volt-300 border border-volt-400/30">
            First-Time Visitor Experience
          </span>
          <h1 className="text-3xl sm:text-4xl font-heading font-black text-chalk">
            Book Your 60-Minute Trial Session
          </h1>
          <p className="text-xs sm:text-sm text-chalk/70">
            Experience our world-class surfaces, demo premier racquets, and receive a professional
            skill assessment from our head coaches for just ₹499.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Stepper Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-chalk/14 -translate-y-1/2 z-0" />
            {[
              { num: 1, label: "Sport" },
              { num: 2, label: "Slot" },
              { num: 3, label: "Details" },
              { num: 4, label: "Payment" },
              { num: 5, label: "Done" },
            ].map((st) => {
              const isPast = currentStep > st.num;
              const isCurrent = currentStep === st.num;

              return (
                <div key={st.num} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isPast
                        ? "bg-emerald-500 text-white shadow-md"
                        : isCurrent
                        ? "bg-volt-400 text-ink-900 shadow-volt scale-110 font-black"
                        : "bg-court-600 text-chalk/50 border border-chalk/20"
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : st.num}
                  </div>
                  <span
                    className={`text-[11px] font-semibold mt-1.5 ${
                      isCurrent ? "text-volt-300 font-bold" : "text-chalk/60"
                    }`}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2-Columns: Sticky Summary on Left (4 cols), Stepper Card on Right (8 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ─── LEFT: Sticky Package Summary ─── */}
          <div className="lg:col-span-4 rounded-3xl bg-court-600/80 border border-chalk/14 p-6 space-y-4 lg:sticky lg:top-24 shadow-card">
            <div>
              <span className="text-[10px] uppercase font-bold text-volt-300 tracking-wider">
                Trial Package Details
              </span>
              <h3 className="text-xl font-heading font-black text-white mt-1">
                60-Min Club Pass
              </h3>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-heading font-black text-volt-300 font-mono">
                  ₹499
                </span>
                <span className="text-xs text-chalk/60 line-through">₹1,200</span>
                <span className="text-xs text-emerald-400 ml-2 font-bold">Save 58%</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-chalk/80 pt-2 border-t border-chalk/10">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-volt-400 shrink-0" />
                <span>60 minutes court booking in chosen sport</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-volt-400 shrink-0" />
                <span>Head coach 15-min skill & level evaluation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-volt-400 shrink-0" />
                <span>Complimentary Yonex / Babolat demo racquet</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-volt-400 shrink-0" />
                <span>Full access to clubhouse showers & lounge</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-volt-400 shrink-0" />
                <span>₹499 credited back if joining a membership</span>
              </div>
            </div>

            {/* Selected Booking Snapshot */}
            <div className="p-3 bg-court-700/80 rounded-2xl border border-chalk/10 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-chalk/60">Sport:</span>
                <strong className="text-white capitalize">{selectedSport}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-chalk/60">Date:</span>
                <strong className="text-white">{selectedDate}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-chalk/60">Time Slot:</span>
                <strong className="text-volt-300 font-mono">{selectedSlot} IST</strong>
              </div>
            </div>
          </div>

          {/* ─── RIGHT: Stepper Wizard Panels (8 cols) ─── */}
          <div className="lg:col-span-8 rounded-3xl bg-court-600/70 border border-chalk/14 p-6 sm:p-8 shadow-2xl">
            {/* STEP 1: SPORT SELECTION */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-heading font-black text-white">
                    Step 1: Choose Your Sport
                  </h3>
                  <p className="text-xs sm:text-sm text-chalk/70 mt-1">
                    Select the arena you would like to experience during your trial session.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {TRIAL_SPORTS.map((sport) => {
                    const isSelected = selectedSport === sport.id;
                    return (
                      <div
                        key={sport.id}
                        onClick={() => setSelectedSport(sport.id)}
                        className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? "bg-volt-400/15 border-2 border-volt-400 shadow-volt"
                            : "bg-court-700/60 border-chalk/14 hover:border-chalk/30"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-lg font-heading font-bold text-white">
                              {sport.label}
                            </span>
                            {isSelected && (
                              <span className="w-5 h-5 rounded-full bg-volt-400 text-ink-900 flex items-center justify-center font-bold">
                                ✓
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-chalk/70">{sport.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    size="lg"
                    onClick={() => setCurrentStep(2)}
                    className="bg-volt-400 hover:bg-volt-500 text-ink-900 font-bold text-xs h-11"
                  >
                    Select Slot & Date <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: DATE & COMPACT SLOT SELECTION */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-heading font-black text-white">
                    Step 2: Pick an Available Trial Slot
                  </h3>
                  <p className="text-xs sm:text-sm text-chalk/70 mt-1">
                    Showing verified open trial windows for {selectedSport.toUpperCase()}.
                  </p>
                </div>

                {/* Next 7 Days Selector */}
                <div>
                  <label className="text-xs font-semibold text-chalk/80 mb-2 block">
                    Select Date
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11"].map((dStr) => {
                      const isSelected = selectedDate === dStr;
                      const dateObj = new Date(dStr);
                      const dayName = dateObj.toLocaleDateString("en-IN", { weekday: "short" });
                      const dayNum = dateObj.getDate();

                      return (
                        <button
                          key={dStr}
                          type="button"
                          onClick={() => setSelectedDate(dStr)}
                          className={`p-2.5 rounded-2xl border text-center transition-all ${
                            isSelected
                              ? "bg-volt-400 text-ink-900 border-volt-400 font-bold shadow-md"
                              : "bg-court-700/60 border-chalk/14 text-white hover:bg-court-700"
                          }`}
                        >
                          <span className="text-[10px] uppercase font-bold block">{dayName}</span>
                          <span className="text-sm font-black block">{dayNum}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Available Hours */}
                <div>
                  <label className="text-xs font-semibold text-chalk/80 mb-2 block">
                    Select Start Time
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                    {["07:00", "08:30", "10:00", "16:00", "17:30", "18:00", "19:30", "20:00"].map((slot) => {
                      const isSelected = selectedSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-3 rounded-xl border text-center font-mono text-xs transition-all ${
                            isSelected
                              ? "bg-volt-400 text-ink-900 border-volt-400 font-bold shadow-md"
                              : "bg-court-700/60 border-chalk/14 text-white hover:bg-court-700"
                          }`}
                        >
                          {slot} IST
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-chalk/10 flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)}>
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => setCurrentStep(3)}
                    className="bg-volt-400 hover:bg-volt-500 text-ink-900 font-bold text-xs h-11"
                  >
                    Enter Player Details <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: PLAYER DETAILS */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-heading font-black text-white">
                    Step 3: Player Information
                  </h3>
                  <p className="text-xs sm:text-sm text-chalk/70 mt-1">
                    Help our coach prepare the right court and gear for your visit.
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="font-semibold text-chalk/80 mb-1.5 block">Full Name</label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Aman Gupta"
                      className="h-11"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold text-chalk/80 mb-1.5 block">Mobile Number (WhatsApp updates)</label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98200 44112"
                        className="h-11 font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-chalk/80 mb-1.5 block">Email Address (Confirmation voucher)</label>
                      <Input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="aman.gupta@example.com"
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-chalk/80 mb-1.5 block">
                      Playing Experience Level
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "BEGINNER", label: "Beginner", sub: "New / learning rules" },
                        { id: "INTERMEDIATE", label: "Intermediate", sub: "Rally & serve regular" },
                        { id: "ADVANCED", label: "Advanced", sub: "Tournament / club player" },
                      ].map((lvl) => (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => setSkillLevel(lvl.id as any)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            skillLevel === lvl.id
                              ? "bg-volt-400 text-ink-900 border-volt-400 font-bold shadow-md"
                              : "bg-court-700/60 border-chalk/14 text-white"
                          }`}
                        >
                          <span className="font-bold text-xs block">{lvl.label}</span>
                          <span className={`text-[10px] block ${skillLevel === lvl.id ? "text-ink-900/70" : "text-chalk/50"}`}>
                            {lvl.sub}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-chalk/80">
                      <input
                        type="checkbox"
                        checked={guardianConsent}
                        onChange={(e) => setGuardianConsent(e.target.checked)}
                        className="rounded accent-volt-400"
                      />
                      <span>I agree to club code of conduct and safety guidelines.</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-chalk/10 flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(2)}>
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => {
                      if (!fullName.trim() || !phone.trim()) {
                        alert("Please provide your name and contact phone number.");
                        return;
                      }
                      setCurrentStep(4);
                    }}
                    className="bg-volt-400 hover:bg-volt-500 text-ink-900 font-bold text-xs h-11"
                  >
                    Proceed to Payment <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 4: PAYMENT WITH 5:00 HOLD COUNTDOWN */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-heading font-black text-white">
                    Step 4: Confirm & Hold Slot
                  </h3>
                  <p className="text-xs sm:text-sm text-chalk/70 mt-1">
                    Your court slot is held temporarily while you finalize the session.
                  </p>
                </div>

                {/* 5-minute Slot Hold Timer Ring */}
                <div
                  className={`p-4 rounded-2xl border flex items-center justify-between ${
                    isSlotExpired
                      ? "bg-red-500/15 border-red-500/40 text-red-300"
                      : "bg-volt-400/15 border-volt-400/40 text-volt-300 shadow-md"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        isSlotExpired ? "bg-red-500 text-white" : "bg-volt-400 text-ink-900"
                      }`}
                    >
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="text-white block text-sm">
                        {isSlotExpired ? "Slot Hold Expired" : "Court Slot Reserved"}
                      </strong>
                      <span className="text-xs">
                        {isSlotExpired
                          ? "SLOT_TAKEN: Another player took this slot. Please select a new time."
                          : "Held for 5:00 minutes while you complete this step."}
                      </span>
                    </div>
                  </div>

                  <div className="font-mono text-2xl font-black tracking-wider text-white">
                    {holdTimeFormatted}
                  </div>
                </div>

                {/* Payment Option Selector */}
                <div className="space-y-3">
                  <div
                    onClick={() => setPaymentOption("ONLINE")}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      paymentOption === "ONLINE"
                        ? "bg-volt-400/15 border-2 border-volt-400 shadow-md"
                        : "bg-court-700/60 border-chalk/14"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="w-5 h-5 text-volt-300" />
                        <div>
                          <strong className="text-white text-sm block">
                            Pay ₹499 Online (Instant Confirmation)
                          </strong>
                          <span className="text-xs text-chalk/60">
                            Razorpay · UPI (GPay / PhonePe) · Debit/Credit Cards
                          </span>
                        </div>
                      </div>
                      {paymentOption === "ONLINE" && (
                        <span className="w-5 h-5 rounded-full bg-volt-400 text-ink-900 font-bold flex items-center justify-center text-xs">
                          ✓
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    onClick={() => setPaymentOption("AT_CLUB")}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      paymentOption === "AT_CLUB"
                        ? "bg-volt-400/15 border-2 border-volt-400 shadow-md"
                        : "bg-court-700/60 border-chalk/14"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Trophy className="w-5 h-5 text-volt-300" />
                        <div>
                          <strong className="text-white text-sm block">
                            Pay ₹499 at Clubhouse Front Desk
                          </strong>
                          <span className="text-xs text-chalk/60">
                            Pay via Cash/Card when arriving 15 minutes before your slot
                          </span>
                        </div>
                      </div>
                      {paymentOption === "AT_CLUB" && (
                        <span className="w-5 h-5 rounded-full bg-volt-400 text-ink-900 font-bold flex items-center justify-center text-xs">
                          ✓
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-chalk/10 flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(3)}>
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleCompleteBooking}
                    className="bg-volt-400 hover:bg-volt-500 text-ink-900 font-bold text-xs h-12 shadow-volt"
                  >
                    Confirm & Complete Booking <Sparkles className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 5: CONFIRMATION & CALENDAR SYNC */}
            {currentStep === 5 && (
              <div className="text-center space-y-6 py-4">
                <div className="w-16 h-16 rounded-full bg-volt-400 text-ink-900 mx-auto flex items-center justify-center shadow-2xl shadow-volt-400/30">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-volt-300 uppercase tracking-wider">
                    Booking Confirmed
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-heading font-black text-white">
                    See You on Court, {fullName || "Champion"}!
                  </h3>
                  <p className="text-xs sm:text-sm text-chalk/70 max-w-md mx-auto">
                    Your trial pass has been registered under reference{" "}
                    <strong className="text-volt-300 font-mono">{bookingRef}</strong>. We've sent a
                    confirmation voucher to {email || "your email"}.
                  </p>
                </div>

                {/* Summary voucher ticket */}
                <div className="max-w-md mx-auto p-4 bg-court-700/80 rounded-2xl border border-chalk/14 text-left text-xs space-y-2">
                  <div className="flex justify-between border-b border-chalk/10 pb-2">
                    <span className="text-chalk/60">Sport Arena:</span>
                    <strong className="text-white uppercase">{selectedSport}</strong>
                  </div>
                  <div className="flex justify-between border-b border-chalk/10 pb-2">
                    <span className="text-chalk/60">Date & Slot:</span>
                    <strong className="text-white font-mono">{selectedDate} · {selectedSlot} IST</strong>
                  </div>
                  <div className="flex justify-between border-b border-chalk/10 pb-2">
                    <span className="text-chalk/60">Payment Status:</span>
                    <strong className="text-emerald-400">
                      {paymentOption === "ONLINE" ? "Paid ₹499 Online" : "Pay ₹499 at Desk"}
                    </strong>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-chalk/60">Coach Assigned:</span>
                    <strong className="text-volt-300">Coach Rohan (Lead Pro)</strong>
                  </div>
                </div>

                {/* Calendar & Next Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <Button
                    onClick={handleDownloadCalendar}
                    variant="outline"
                    className="border-chalk/20 text-white text-xs h-11"
                  >
                    <CalendarPlus className="w-4 h-4 mr-1.5" /> Add to Calendar (.ics)
                  </Button>
                  <Button
                    onClick={() => go("/facilities")}
                    className="bg-volt-400 hover:bg-volt-500 text-ink-900 font-bold text-xs h-11"
                  >
                    Explore Facilities & Directions →
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default TrialBookingPage;
