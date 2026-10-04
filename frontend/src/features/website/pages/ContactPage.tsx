import { useState, useEffect } from "react";
import { useGo } from "@/app/router/links";
import { CourtLines } from "@/components/brand/CourtLines";
import { NoiseOverlay } from "@/components/brand/NoiseOverlay";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useWebsiteStore } from "../websiteStore";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Compass,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export function ContactPage() {
  const go = useGo();
  const { addContactEnquiry, contactDraft, saveContactDraft, clearContactDraft } = useWebsiteStore();

  // Form State initialized from persistent local draft
  const [fullName, setFullName] = useState(contactDraft.fullName || "");
  const [phone, setPhone] = useState(contactDraft.phone || "");
  const [email, setEmail] = useState(contactDraft.email || "");
  const [interest, setInterest] = useState<
    "MEMBERSHIP" | "TRIAL" | "CORPORATE" | "COACHING" | "PRO_SHOP" | "OTHER"
  >(contactDraft.interest || "MEMBERSHIP");
  const [message, setMessage] = useState(contactDraft.message || "");

  // Anti-bot honeypot field
  const [honeypot, setHoneypot] = useState("");

  // Simple CAPTCHA human check
  const [isHumanVerified, setIsHumanVerified] = useState(false);

  // Rate Limiting (30s after submit)
  const [rateLimitCooldown, setRateLimitCooldown] = useState(0);

  // Success State
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<{ name: string; email: string } | null>(null);

  // Auto-save draft on changes
  useEffect(() => {
    if (!isSubmitted) {
      saveContactDraft({ fullName, phone, email, interest, message });
    }
  }, [fullName, phone, email, interest, message, isSubmitted, saveContactDraft]);

  // Rate limit countdown timer
  useEffect(() => {
    if (rateLimitCooldown <= 0) return;
    const timer = setInterval(() => {
      setRateLimitCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitCooldown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check honeypot: if filled, reject silently (anti-spam bot)
    if (honeypot.trim()) {
      alert("Submission error. Please try again.");
      return;
    }

    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      alert("Please fill in your name, phone number, and email.");
      return;
    }

    if (!isHumanVerified) {
      alert("Please check the human verification box before submitting.");
      return;
    }

    if (rateLimitCooldown > 0) {
      alert(`Please wait ${rateLimitCooldown} seconds before sending another enquiry.`);
      return;
    }

    // Submit enquiry & create CRM lead
    const res = addContactEnquiry({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      interest,
      message: message.trim(),
    });

    if (res.success) {
      setSubmittedData({ name: fullName.trim(), email: email.trim() });
      setIsSubmitted(true);
      setRateLimitCooldown(30); // 30s rate limit
      clearContactDraft();
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setFullName("");
    setPhone("");
    setEmail("");
    setMessage("");
    setIsHumanVerified(false);
  };

  return (
    <div className="w-full text-chalk font-sans">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-chalk/14 bg-court-700/60 py-12 px-4 sm:px-6">
        <NoiseOverlay opacity={0.03} />
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-15">
          <CourtLines variant="full" className="h-full w-full object-contain" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-3">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-volt-400/20 text-volt-300 border border-volt-400/30">
            Get in Touch
          </span>
          <h1 className="text-3xl sm:text-5xl font-heading font-black tracking-tight text-chalk">
            We’d Love to Hear From You
          </h1>
          <p className="max-w-xl mx-auto text-xs sm:text-sm text-chalk/80 leading-relaxed">
            Have questions about memberships, private coaching clinics, tournament court hire,
            or corporate sports days? Reach out and our concierge desk will assist you promptly.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ─── LEFT: Form Card (7 cols) ─── */}
          <div className="lg:col-span-7 rounded-3xl bg-court-600/70 border border-chalk/14 p-6 sm:p-8 shadow-2xl">
            {isSubmitted && submittedData ? (
              <div className="py-12 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-volt-400 text-ink-900 mx-auto flex items-center justify-center shadow-xl shadow-volt-400/30">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-volt-300 uppercase tracking-wider">
                    Enquiry Acknowledged
                  </span>
                  <h3 className="text-2xl font-heading font-black text-white">
                    Thanks {submittedData.name}!
                  </h3>
                  <p className="text-xs sm:text-sm text-chalk/70 max-w-md mx-auto leading-relaxed">
                    We've received your request and sent a confirmation to{" "}
                    <strong className="text-white">{submittedData.email}</strong>. Our membership
                    team will reach out to you within 24 business hours.
                  </p>
                </div>

                <div className="pt-4 flex items-center justify-center gap-3">
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="border-chalk/20 text-xs text-white h-10"
                  >
                    Send Another Message
                  </Button>
                  <Button
                    onClick={() => go("/facilities")}
                    className="bg-volt-400 hover:bg-volt-500 text-ink-900 font-bold text-xs h-10"
                  >
                    Explore Facilities →
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h3 className="text-xl font-heading font-black text-white">Send Us an Enquiry</h3>
                  <p className="text-xs text-chalk/60 mt-1">
                    Your form inputs are automatically drafted in local state so nothing is lost.
                  </p>
                </div>

                {/* Honeypot hidden input (Anti-bot) */}
                <input
                  type="text"
                  name="company_website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  className="opacity-0 absolute -z-10 w-0 h-0"
                  aria-hidden="true"
                />

                {/* Interest Chips */}
                <div>
                  <label className="text-xs font-semibold text-chalk/80 mb-2 block">
                    What are you interested in?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "MEMBERSHIP", label: "Club Membership" },
                      { id: "TRIAL", label: "Trial Session" },
                      { id: "CORPORATE", label: "Corporate Day" },
                      { id: "COACHING", label: "Academy Coaching" },
                      { id: "PRO_SHOP", label: "Pro Shop / Restring" },
                      { id: "OTHER", label: "General Query" },
                    ].map((chip) => {
                      const isSelected = interest === chip.id;
                      return (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => setInterest(chip.id as any)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                            isSelected
                              ? "bg-volt-400 text-ink-900 border-volt-400 font-bold shadow-sm"
                              : "bg-court-700/60 text-chalk/70 border-chalk/14 hover:bg-court-700"
                          }`}
                        >
                          {chip.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Name, Phone, Email */}
                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="font-semibold text-chalk/80 mb-1.5 block">Your Full Name</label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Neelam Kothari"
                      className="h-11"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="font-semibold text-chalk/80 mb-1.5 block">Phone Number</label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98110 55432"
                        className="h-11 font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-chalk/80 mb-1.5 block">Email Address</label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="neelam@example.com"
                        className="h-11"
                        required
                      />
                    </div>
                  </div>

                  {/* Message with 500 char counter */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="font-semibold text-chalk/80">Message / Request</label>
                      <span className="text-[11px] text-chalk/50 font-mono">
                        {message.length} / 500
                      </span>
                    </div>
                    <textarea
                      value={message}
                      onChange={(e) => {
                        if (e.target.value.length <= 500) {
                          setMessage(e.target.value);
                        }
                      }}
                      rows={4}
                      placeholder="Tell us about your team size, sports preferences, or membership queries..."
                      className="w-full bg-court-700/80 border border-chalk/14 rounded-2xl p-3 text-xs text-white placeholder-chalk/40 focus:border-volt-400 focus:outline-none focus:ring-2 focus:ring-volt-400/20"
                    />
                  </div>

                  {/* CAPTCHA-style human verification checkbox */}
                  <div className="p-3 bg-court-700/60 rounded-2xl border border-chalk/10 flex items-center justify-between">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs text-chalk/90 font-medium">
                      <input
                        type="checkbox"
                        checked={isHumanVerified}
                        onChange={(e) => setIsHumanVerified(e.target.checked)}
                        className="w-4 h-4 rounded accent-volt-400 cursor-pointer"
                      />
                      <span>I am a human sports enthusiast</span>
                    </label>
                    <ShieldCheck className={`w-4 h-4 ${isHumanVerified ? "text-volt-400" : "text-chalk/30"}`} />
                  </div>
                </div>

                {/* Submit button with rate limit handling */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={rateLimitCooldown > 0}
                    className={`w-full font-bold text-xs h-12 flex items-center justify-center gap-2 ${
                      rateLimitCooldown > 0
                        ? "bg-court-700 text-chalk/40 cursor-not-allowed"
                        : "bg-volt-400 hover:bg-volt-500 text-ink-900 shadow-volt"
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    {rateLimitCooldown > 0
                      ? `Please wait ${rateLimitCooldown}s...`
                      : "Send Message & Request Callback"}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* ─── RIGHT: Contact Info & Map Card (5 cols) ─── */}
          <div className="lg:col-span-5 space-y-6">
            {/* Quick Contacts Card */}
            <div className="rounded-3xl bg-court-600/70 border border-chalk/14 p-6 space-y-4">
              <h3 className="text-lg font-heading font-bold text-white">Clubhouse Concierge</h3>

              <div className="space-y-3 text-xs text-chalk/80">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-volt-300 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block">Champions Club Mumbai</strong>
                    <span>Plot 42, Worli Sea Face Promenade, Worli, Mumbai 400018</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-volt-300 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block">Direct Telephone</strong>
                    <span>+91 22 6900 1234 (Concierge Desk)</span>
                    <span className="block text-chalk/60">+91 98201 12345 (WhatsApp Member Line)</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-volt-300 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block">Email Inquiries</strong>
                    <span>concierge@championsclub.in</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Operating Hours Card */}
            <div className="rounded-3xl bg-court-600/70 border border-chalk/14 p-6 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-volt-300 font-bold uppercase tracking-wider text-[11px]">
                <Clock className="w-4 h-4" />
                <span>Operating Timings</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-chalk/10">
                  <span className="text-chalk/70">Court Sessions:</span>
                  <span className="font-mono font-bold text-white">06:00 – 22:00</span>
                </div>
                <div className="flex justify-between py-1 border-b border-chalk/10">
                  <span className="text-chalk/70">Pro Shop & Racket Bay:</span>
                  <span className="font-mono font-bold text-white">08:00 – 20:00</span>
                </div>
                <div className="flex justify-between py-1 border-b border-chalk/10">
                  <span className="text-chalk/70">Clubhouse Sports Bar & Dining:</span>
                  <span className="font-mono font-bold text-white">11:00 – 23:00</span>
                </div>
              </div>
            </div>

            {/* Map Preview Card */}
            <div className="rounded-3xl bg-court-600/70 border border-chalk/14 p-6 space-y-3">
              <div className="h-44 rounded-2xl overflow-hidden border border-chalk/10 bg-navy-950 relative flex items-center justify-center">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#D5F63A_1px,transparent_1px)] [background-size:14px_14px]" />
                <div className="relative text-center z-10 space-y-1.5">
                  <div className="w-10 h-10 rounded-full bg-volt-400 text-ink-900 mx-auto flex items-center justify-center font-bold shadow-lg animate-bounce">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-white block">Worli Sea Face Promenade</span>
                  <a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-volt-300 font-bold hover:underline"
                  >
                    Open Directions <Compass className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ContactPage;
