import { useState, useMemo } from "react";
import { useGo } from "@/app/router/links";
import {
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  Printer,
  Send,
  Zap,
  RotateCcw,
  Sparkles,
  Info,
  DollarSign,
  CreditCard,
  QrCode,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Stepper } from "@/components/ui/Stepper";
import { DESK_MEMBERS, registerNewDeskMember } from "../sampleData";
import type { DeskMember } from "../types";
import type { MemberTier } from "@/features/booking/types";

interface PlanOption {
  tier: MemberTier;
  name: string;
  price: number;
  entitlements: string[];
  isJuniorOnly?: boolean;
}

const PLAN_OPTIONS: PlanOption[] = [
  {
    tier: "Gold",
    name: "Gold All-Access",
    price: 35000,
    entitlements: [
      "Unlimited bookings across all 10 courts",
      "Prime time peak slot priority booking (7 days in advance)",
      "15% discount on Pro Shop and Courtside Bar",
      "Complimentary locker & guest pass (2/mo)",
    ],
  },
  {
    tier: "Silver",
    name: "Silver Regular",
    price: 22000,
    entitlements: [
      "Access to all courts during standard & off-peak hours",
      "Booking window: 4 days in advance",
      "10% discount on Pro Shop merchandise",
      "Locker access at nominal hourly charge",
    ],
  },
  {
    tier: "Junior",
    name: "Junior Academy (<18)",
    price: 14000,
    isJuniorOnly: true,
    entitlements: [
      "After-school coaching sessions (3:30 PM - 6:30 PM)",
      "Weekend junior tournament eligibility",
      "Strict safety supervision & guardian consent verification",
      "Equipment hire included for training clinics",
    ],
  },
];

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  dob?: string;
  address?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianConsent?: string;
}

export default function RegisterMember() {
  const navigate = useGo();
  const [activeStep, setActiveStep] = useState(0);

  // Form Fields - Step 1: Details (pre-fillable from CRM Lead conversion)
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const [name, setName] = useState(() => searchParams?.get("name") || "");
  const [phone, setPhone] = useState(() => searchParams?.get("phone") || "");
  const [email, setEmail] = useState(() => searchParams?.get("email") || "");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<"M" | "F" | "Other" | "">("M");
  const [address, setAddress] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string>(
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
  );

  // Guardian block fields (required if age < 18)
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [guardianConsent, setGuardianConsent] = useState(false);

  // Step 2: Plan
  const [selectedTier, setSelectedTier] = useState<MemberTier>("Gold");

  // Step 3: Payment
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "UPI" | "Card" | "Pay later">("UPI");
  const [cashTendered, setCashTendered] = useState<string>("");
  const [txnRef, setTxnRef] = useState<string>("");

  // Step 4: Done result
  const [createdMember, setCreatedMember] = useState<DeskMember | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Step errors
  const [errors, setErrors] = useState<FormErrors>({});

  // Auto calculate age from DOB
  const calculatedAge = useMemo(() => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return null;
    const diffMs = Date.now() - birthDate.getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  }, [dob]);

  const isMinor = calculatedAge !== null && calculatedAge < 18;

  // Live duplicate detection
  const duplicateMember = useMemo(() => {
    const cleanPhone = phone.replace(/[\s-]/g, "");
    if (cleanPhone.length >= 10) {
      const match = DESK_MEMBERS.find(
        (m: DeskMember) => m.phone.replace(/[\s-]/g, "").includes(cleanPhone)
      );
      if (match) return match;
    }
    if (email.trim().length > 5) {
      const match = DESK_MEMBERS.find(
        (m: DeskMember) => m.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (match) return match;
    }
    return null;
  }, [phone, email]);

  // Adjust plan selection when DOB changes
  const handleDobChange = (newDob: string) => {
    setDob(newDob);
    const bDate = new Date(newDob);
    if (!isNaN(bDate.getTime())) {
      const diffMs = Date.now() - bDate.getTime();
      const age = Math.abs(new Date(diffMs).getUTCFullYear() - 1970);
      if (age < 18) {
        setSelectedTier("Junior");
      } else if (selectedTier === "Junior") {
        setSelectedTier("Gold");
      }
    }
  };

  // Validate Step 1
  const validateStep1 = () => {
    const errs: FormErrors = {};
    if (!name.trim()) errs.name = "Full name is required";
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) {
      errs.phone = "Valid 10-digit phone number is required";
    }
    if (!email.trim() || !email.includes("@")) {
      errs.email = "Valid email address is required";
    }
    if (!dob) errs.dob = "Date of Birth is required";
    if (!address.trim()) errs.address = "Address is required";
    if (!emergencyName.trim()) errs.emergencyName = "Emergency contact name is required";
    if (!emergencyPhone.trim() || emergencyPhone.replace(/\D/g, "").length < 10) {
      errs.emergencyPhone = "Emergency contact phone is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Validate Step 2
  const validateStep2 = () => {
    const errs: FormErrors = {};
    if (isMinor) {
      if (!guardianName.trim()) errs.guardianName = "Guardian name is required for minors (<18)";
      if (!guardianPhone.trim() || guardianPhone.replace(/\D/g, "").length < 10) {
        errs.guardianPhone = "Guardian phone number is required";
      }
      if (!guardianConsent) {
        errs.guardianConsent = "Guardian consent acknowledgment is mandatory (BR-15)";
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Pricing calculation
  const planObj = PLAN_OPTIONS.find((p) => p.tier === selectedTier) ?? PLAN_OPTIONS[0]!;
  const baseFee = planObj.price;
  const gstAmount = Math.round(baseFee * 0.18);
  const totalAmount = baseFee + gstAmount;

  // Change calculation
  const tenderedNum = Number(cashTendered) || 0;
  const changeDue = Math.max(0, tenderedNum - totalAmount);

  const handleCompleteRegistration = () => {
    const newMember = registerNewDeskMember({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      dob,
      gender: gender ? (gender as "M" | "F" | "Other") : undefined,
      address: address.trim(),
      emergencyName: emergencyName.trim(),
      emergencyPhone: emergencyPhone.trim(),
      tier: selectedTier,
      guardianName: isMinor ? guardianName.trim() : undefined,
      guardianPhone: isMinor ? guardianPhone.trim() : undefined,
      guardianConsent: isMinor ? guardianConsent : undefined,
      paymentMethod,
    });

    setCreatedMember(newMember);
    setActiveStep(3); // Go to Step 4: Done

    // Persist to backend
    import("@/services/api/memberApi").then(({ memberApi }) => {
      memberApi
        .registerMember({
          fullName: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          dateOfBirth: dob,
          emergencyContact: emergencyName.trim(),
          emergencyPhone: emergencyPhone.trim(),
          notes: `Tier: ${selectedTier}, Address: ${address.trim()}`,
        })
        .catch(() => {});
    });
  };

  const steps = [
    { id: "details", title: "Member Details", description: "Personal & emergency info" },
    { id: "plan", title: "Select Plan", description: "Tier & guardian validation" },
    { id: "payment", title: "Payment & Invoice", description: "Tender & settlement" },
    { id: "done", title: "Registration Done", description: "Digital card & access" },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-4xl mx-auto w-full">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 rounded-pill bg-navy-800 border-l-4 border-volt-400 px-5 py-3 shadow-2xl text-sm font-medium text-white flex items-center gap-3 animate-slide-in">
          <CheckCircle2 className="size-4 text-volt-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Register New Member</h1>
          <p className="text-xs text-white/60 mt-1">
            MEM-01..05: Onboard member, enforce minor guardian validation, create invoice &amp; generate digital card
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate("/desk")}
          className="text-xs text-white/70"
        >
          Cancel &amp; Return
        </Button>
      </div>

      {/* Stepper Progress */}
      <Card className="p-4 bg-court-600/60 border-white/10">
        <Stepper steps={steps} activeStep={activeStep} />
      </Card>

      {/* STEP 1: MEMBER DETAILS */}
      {activeStep === 0 && (
        <Card className="p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-lg font-semibold text-white">Step 1: Personal &amp; Emergency Details</h2>
            <span className="text-xs text-white/50">* Indicates mandatory fields</span>
          </div>

          {/* Duplicate Detection Warning Banner */}
          {duplicateMember && (
            <div className="p-4 rounded-xl bg-warning/15 border border-warning/40 flex items-start justify-between gap-3 text-sm text-warning">
              <div className="flex items-start gap-3">
                <AlertCircle className="size-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Potential Duplicate Profile Detected</p>
                  <p className="text-xs text-warning/90 mt-0.5">
                    <strong>{duplicateMember.name}</strong> ({duplicateMember.id}) is already registered with matching phone/email.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="text-xs shrink-0 !h-8 !px-3 text-warning border-warning/40 hover:bg-warning/10"
                onClick={() => navigate(`/desk/members/${duplicateMember.id}`)}
              >
                Open Existing Profile
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Legal Name *"
              placeholder="e.g. Aarav Sharma"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
              }}
              error={errors.name}
              leftIcon={<User className="size-4" />}
            />

            <Input
              label="Phone Number (Mobile) *"
              placeholder="+91 98201 12345"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
              }}
              error={errors.phone}
              leftIcon={<Phone className="size-4" />}
            />

            <Input
              label="Email Address *"
              type="email"
              placeholder="aarav.sharma@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
              }}
              error={errors.email}
              leftIcon={<Mail className="size-4" />}
            />

            <div>
              <Input
                label="Date of Birth *"
                type="date"
                value={dob}
                onChange={(e) => {
                  handleDobChange(e.target.value);
                  if (errors.dob) setErrors((prev) => ({ ...prev, dob: "" }));
                }}
                error={errors.dob}
                leftIcon={<Calendar className="size-4" />}
              />
              {calculatedAge !== null && (
                <p className="text-xs text-volt-400 mt-1 font-medium flex items-center gap-1.5">
                  <Sparkles className="size-3.5" />
                  <span>
                    Age: {calculatedAge} years old {isMinor ? "(Minor · Guardian required)" : "(Adult)"}
                  </span>
                </p>
              )}
            </div>

            <div>
              <label className="text-[13px] font-medium text-white/80 block mb-1.5">Gender</label>
              <div className="flex gap-2">
                {(["M", "F", "Other"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`flex-1 py-3 text-xs font-medium rounded-xl border transition-colors ${
                      gender === g
                        ? "bg-volt-400 text-ink-900 border-volt-400 font-semibold"
                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {g === "M" ? "Male" : g === "F" ? "Female" : "Other"}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <Input
                label="Residential Address *"
                placeholder="Flat / House No., Street, City, Pincode"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  if (errors.address) setErrors((prev) => ({ ...prev, address: "" }));
                }}
                error={errors.address}
                leftIcon={<MapPin className="size-4" />}
              />
            </div>
          </div>

          {/* Emergency Contact Block */}
          <div className="border-t border-white/10 pt-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <ShieldAlert className="size-4 text-volt-400" />
              <span>Emergency Contact Information *</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Emergency Contact Name *"
                placeholder="e.g. Meera Sharma (Parent / Spouse)"
                value={emergencyName}
                onChange={(e) => {
                  setEmergencyName(e.target.value);
                  if (errors.emergencyName) setErrors((prev) => ({ ...prev, emergencyName: "" }));
                }}
                error={errors.emergencyName}
              />
              <Input
                label="Emergency Contact Phone *"
                placeholder="+91 98201 99887"
                value={emergencyPhone}
                onChange={(e) => {
                  setEmergencyPhone(e.target.value);
                  if (errors.emergencyPhone) setErrors((prev) => ({ ...prev, emergencyPhone: "" }));
                }}
                error={errors.emergencyPhone}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                if (validateStep1()) setActiveStep(1);
              }}
            >
              Continue to Select Plan
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 2: SELECT PLAN & GUARDIAN VALIDATION */}
      {activeStep === 1 && (
        <Card className="p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Step 2: Choose Membership Plan</h2>
              <p className="text-xs text-white/60 mt-0.5">
                {isMinor
                  ? "Member is under 18: Junior tier selected & guardian consent is required."
                  : "Select an adult annual membership tier."}
              </p>
            </div>
            <span className="text-xs font-mono text-volt-400 bg-volt-400/10 px-2.5 py-1 rounded-full border border-volt-400/20">
              Age: {calculatedAge ?? "Unknown"} yrs
            </span>
          </div>

          {/* 3 Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLAN_OPTIONS.map((plan) => {
              const isSelected = selectedTier === plan.tier;
              const isJuniorCard = plan.tier === "Junior";
              const isDisabled = !isMinor && isJuniorCard;

              return (
                <div
                  key={plan.tier}
                  onClick={() => !isDisabled && setSelectedTier(plan.tier)}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                    isSelected
                      ? "bg-volt-400/15 border-volt-400 ring-2 ring-volt-400/20 shadow-glow-volt"
                      : isDisabled
                      ? "bg-white/[0.02] border-white/5 opacity-40 cursor-not-allowed"
                      : "bg-white/5 border-white/10 hover:border-white/20 cursor-pointer"
                  }`}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-bold text-white">{plan.name}</span>
                      {isSelected && <CheckCircle2 className="size-4 text-volt-400 shrink-0" />}
                    </div>

                    <div>
                      <span className="text-2xl font-bold font-mono text-volt-400">
                        ₹{plan.price.toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs text-white/50 block">/ year (+ 18% GST)</span>
                    </div>

                    <ul className="space-y-2 text-xs text-white/70 border-t border-white/10 pt-3">
                      {plan.entitlements.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-volt-400 font-bold shrink-0">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {isDisabled && (
                    <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-danger flex items-center gap-1.5">
                      <Info className="size-3.5 shrink-0" />
                      <span>BR-15: Disabled for age ≥ 18</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* REQUIRED Guardian Section for Minor (<18) */}
          {isMinor && (
            <div className="p-5 rounded-2xl bg-volt-400/10 border border-volt-400/30 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-5 text-volt-400" />
                <h3 className="text-sm font-semibold text-white">
                  Mandatory Guardian Block (BR-15: Required for Minors under 18)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Parent / Legal Guardian Full Name *"
                  placeholder="e.g. Ramesh Patel"
                  value={guardianName}
                  onChange={(e) => {
                    setGuardianName(e.target.value);
                    if (errors.guardianName) setErrors((prev) => ({ ...prev, guardianName: "" }));
                  }}
                  error={errors.guardianName}
                />

                <Input
                  label="Guardian Mobile Phone *"
                  placeholder="+91 98201 11223"
                  value={guardianPhone}
                  onChange={(e) => {
                    setGuardianPhone(e.target.value);
                    if (errors.guardianPhone) setErrors((prev) => ({ ...prev, guardianPhone: "" }));
                  }}
                  error={errors.guardianPhone}
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer select-none mt-1">
                <input
                  type="checkbox"
                  checked={guardianConsent}
                  onChange={(e) => {
                    setGuardianConsent(e.target.checked);
                    if (errors.guardianConsent) setErrors((prev) => ({ ...prev, guardianConsent: "" }));
                  }}
                  className="mt-1 size-4 rounded accent-volt-400"
                />
                <span className="text-xs text-white/90">
                  I confirm that I am the parent / legal guardian of this applicant. I consent to their membership registration, facility usage, and agree to the Club safety bylaws and sports rules. *
                </span>
              </label>

              {errors.guardianConsent && (
                <p className="text-xs text-danger flex items-center gap-1">
                  <AlertCircle className="size-3.5" />
                  <span>{errors.guardianConsent}</span>
                </p>
              )}
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={() => setActiveStep(0)}>
              Back to Details
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                if (validateStep2()) setActiveStep(2);
              }}
            >
              Proceed to Payment
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 3: PAYMENT & INVOICE */}
      {activeStep === 2 && (
        <Card className="p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Step 3: Membership Fee Settlement</h2>
              <p className="text-xs text-white/60 mt-0.5">
                Generate sequential GST invoice &amp; activate member account
              </p>
            </div>
            <span className="text-xs font-mono text-white/70">
              Invoice #{`CCMS/26-27/${Math.floor(1000 + Math.random() * 9000)}`}
            </span>
          </div>

          {/* Invoice Summary */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-white/70">{planObj.name} Annual Subscription</span>
              <span className="font-mono text-white">₹{baseFee.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/70">GST @ 18% (CGST 9% + SGST 9%)</span>
              <span className="font-mono text-white">₹{gstAmount.toLocaleString("en-IN")}</span>
            </div>
            <div className="border-t border-white/10 pt-2 flex justify-between text-base font-bold">
              <span className="text-white">Total Amount Payable</span>
              <span className="font-mono text-volt-400">₹{totalAmount.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-[13px] font-medium text-white/80 block mb-2">
              Select Settlement Method
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(["Cash", "UPI", "Card", "Pay later"] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-3 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    paymentMethod === method
                      ? "bg-volt-400 text-ink-900 border-volt-400"
                      : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                  }`}
                >
                  {method === "Cash" && <DollarSign className="size-3.5" />}
                  {method === "UPI" && <QrCode className="size-3.5" />}
                  {method === "Card" && <CreditCard className="size-3.5" />}
                  {method === "Pay later" && <RotateCcw className="size-3.5" />}
                  <span>{method}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Method Specific Inputs */}
          {paymentMethod === "Cash" && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Cash Amount Tendered (INR) *"
                type="number"
                placeholder={String(totalAmount)}
                value={cashTendered}
                onChange={(e) => setCashTendered(e.target.value)}
              />
              <div className="flex flex-col justify-end">
                <span className="text-xs text-white/60 mb-1">Change to Return to Member</span>
                <div className="h-12 px-4 rounded-xl bg-navy-950/60 border border-white/10 flex items-center text-lg font-mono font-bold text-volt-400">
                  ₹{changeDue.toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          )}

          {(paymentMethod === "UPI" || paymentMethod === "Card") && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-3">
              <Input
                label={`${paymentMethod} Transaction Reference / UTR Number`}
                placeholder="e.g. UPI-261003-88912 or POS-AUTH-991"
                value={txnRef}
                onChange={(e) => setTxnRef(e.target.value)}
              />
              <p className="text-[11px] text-white/50">
                Staff can accept directly via UPI QR on desk terminal or card EDC machine.
              </p>
            </div>
          )}

          {paymentMethod === "Pay later" && (
            <div className="p-4 rounded-xl bg-warning/10 border border-warning/30 text-xs text-warning flex items-start gap-2">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Pending Payment Status</p>
                <p>
                  Account will be created as <strong>PENDING_PAYMENT</strong> with ₹{totalAmount.toLocaleString("en-IN")} recorded as outstanding dues. Facility booking will remain restricted until cleared.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={() => setActiveStep(1)}>
              Back to Plan
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleCompleteRegistration}
            >
              Confirm Payment &amp; Register Member
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 4: DONE & DIGITAL CARD PREVIEW */}
      {activeStep === 3 && createdMember && (
        <Card className="p-6 flex flex-col items-center text-center gap-6">
          <div className="size-16 rounded-full bg-volt-400/20 border border-volt-400/40 flex items-center justify-center text-volt-400 shadow-glow-volt">
            <CheckCircle2 className="size-9" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white">Registration Complete!</h2>
            <p className="text-xs text-white/60 mt-1">
              Member successfully created with ID <strong>{createdMember.id}</strong> ({createdMember.status})
            </p>
          </div>

          {/* Member Card Preview */}
          <div className="w-full max-w-sm rounded-2xl bg-gradient-to-br from-court-700 via-court-600 to-navy-900 border border-volt-400/40 p-5 shadow-2xl flex flex-col justify-between text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-volt-400/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-3">
                <img
                  src={createdMember.avatar}
                  alt={createdMember.name}
                  className="size-12 rounded-full object-cover border border-volt-400/50"
                />
                <div>
                  <h3 className="font-bold text-white text-base leading-tight">
                    {createdMember.name}
                  </h3>
                  <span className="text-xs font-mono text-volt-400">{createdMember.id}</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-pill bg-volt-400 text-ink-900 font-bold text-[11px] uppercase tracking-wider">
                {createdMember.tier}
              </span>
            </div>

            <div className="my-4 flex items-center justify-between border-t border-b border-white/10 py-3 relative z-10">
              <div>
                <span className="text-[10px] text-white/50 block uppercase">Valid Until</span>
                <span className="text-xs font-medium text-white">{createdMember.validTill}</span>
              </div>
              <div>
                <span className="text-[10px] text-white/50 block uppercase">Status</span>
                <span className="text-xs font-semibold text-success">{createdMember.status}</span>
              </div>
              <div className="p-1 bg-white rounded-lg">
                <QRCodeSVG value={createdMember.qrToken} size={44} />
              </div>
            </div>

            <div className="text-[10px] text-white/40 flex justify-between relative z-10">
              <span>Champions Club Management</span>
              <span>Authorized Desk Copy</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-md">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => {
                window.print();
              }}
            >
              <Printer className="size-4 mr-1.5" />
              Print Card
            </Button>

            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setToastMsg(`Digital Card sent to ${createdMember.email}`);
                setTimeout(() => setToastMsg(null), 3500);
              }}
            >
              <Send className="size-4 mr-1.5" />
              Email Card
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-md pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="primary"
              className="w-full sm:w-auto flex-1"
              onClick={() => navigate("/desk/walk-in")}
            >
              <Zap className="size-4 mr-1.5" />
              Book a Court Now
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full sm:w-auto"
              onClick={() => {
                // Reset form
                setActiveStep(0);
                setName("");
                setPhone("");
                setEmail("");
                setDob("");
                setAddress("");
                setEmergencyName("");
                setEmergencyPhone("");
                setGuardianName("");
                setGuardianPhone("");
                setGuardianConsent(false);
                setSelectedTier("Gold");
                setCreatedMember(null);
              }}
            >
              Register Another
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
