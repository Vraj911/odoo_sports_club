import { useState } from "react";
import { useGo } from "@/app/router/links";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { CourtLines } from "@/components/brand/CourtLines";
import { NoiseOverlay } from "@/components/brand/NoiseOverlay";
import { Button } from "@/components/ui/Button";
import { PUBLIC_PLANS, PUBLIC_SPORT_RATES, FAQ_ITEMS } from "../sampleData";
import {
  Check,
  X,
  Star,
  Zap,
  HelpCircle,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export function PlansPage() {
  const go = useGo();
  const [billingCycle, setBillingCycle] = useState<"ANNUAL" | "MONTHLY">("ANNUAL");
  const [rateMode, setRateMode] = useState<"STANDARD" | "PEAK">("STANDARD");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-backdrop text-chalk font-sans">
      <PublicNavbar />

      {/* Header */}
      <div className="relative overflow-hidden border-b border-chalk/14 bg-court-700/60 py-16 px-4 sm:px-6">
        <NoiseOverlay opacity={0.03} />
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-15">
          <CourtLines variant="full" className="h-full w-full object-contain" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-4">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-volt-400/20 text-volt-300 border border-volt-400/30">
            Transparent Club Pricing
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-black tracking-tight text-chalk">
            Membership Plans & Rates
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-chalk/80 leading-relaxed">
            One membership unlocks all four racquet sports, priority online booking, pro shop privileges,
            and exclusive clubhouse dining accounts.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="pt-4 flex items-center justify-center">
            <div className="flex items-center gap-2 p-1.5 rounded-full bg-court-600/80 border border-chalk/14">
              <button
                type="button"
                onClick={() => setBillingCycle("MONTHLY")}
                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                  billingCycle === "MONTHLY"
                    ? "bg-volt-400 text-ink-900 shadow-md font-bold"
                    : "text-chalk/70 hover:text-chalk"
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("ANNUAL")}
                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  billingCycle === "ANNUAL"
                    ? "bg-volt-400 text-ink-900 shadow-md font-bold"
                    : "text-chalk/70 hover:text-chalk"
                }`}
              >
                <span>Annual Billing</span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-16">
        {/* ─── 3 PLAN CARDS ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PUBLIC_PLANS.map((plan) => {
            const isPopular = plan.popular;
            const price = billingCycle === "ANNUAL" ? plan.annualFee : plan.monthlyFee;
            const periodLabel = billingCycle === "ANNUAL" ? "/ year" : "/ month";

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-3xl p-7 transition-all duration-200 ${
                  isPopular
                    ? "bg-court-600/90 border-2 border-volt-400 shadow-2xl shadow-volt-400/20 md:-translate-y-2"
                    : "bg-court-600/60 border border-chalk/14 hover:border-chalk/30 shadow-card"
                }`}
              >
                {/* Popular Pill */}
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-volt-400 text-ink-900 text-xs font-black tracking-wider uppercase flex items-center gap-1.5 shadow-md">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>Most Popular Choice</span>
                  </div>
                )}

                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-2xl font-heading font-black text-chalk">{plan.name}</h3>
                      <p className="text-xs text-chalk/70 mt-1 min-h-[32px]">{plan.tagline}</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-white">
                      {plan.tier}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="my-6 p-4 rounded-2xl bg-court-700/60 border border-chalk/10">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-heading font-black text-volt-300 font-mono">
                        ₹{price.toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs text-chalk/60 font-medium">{periodLabel}</span>
                    </div>
                    {billingCycle === "ANNUAL" && (
                      <span className="text-[11px] text-emerald-400 font-medium block mt-1">
                        + Includes {plan.guestPasses} Complimentary Guest Passes
                      </span>
                    )}
                  </div>

                  {/* Feature bullets */}
                  <div className="space-y-3 text-xs sm:text-sm text-chalk/80 pb-6">
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-volt-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Join CTA Button */}
                <div className="pt-4 border-t border-chalk/10">
                  <Button
                    size="lg"
                    onClick={() => go(`/register?plan=${plan.id}`)}
                    className={`w-full font-bold h-12 text-sm ${
                      isPopular
                        ? "bg-volt-400 hover:bg-volt-500 text-ink-900 shadow-volt"
                        : "bg-white/10 hover:bg-white/20 text-white"
                    }`}
                  >
                    Join as {plan.tier} <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── COURT RATES COMPARISON TABLE ─── */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-chalk/14">
            <div>
              <h2 className="text-2xl font-heading font-black text-chalk">
                Hourly Court Rates by Sport & Tier
              </h2>
              <p className="text-xs text-chalk/60">
                Gold members enjoy complimentary court play across all four sports.
              </p>
            </div>

            {/* Peak vs Standard rate toggle */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-court-600/80 border border-chalk/14">
              <button
                type="button"
                onClick={() => setRateMode("STANDARD")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  rateMode === "STANDARD"
                    ? "bg-volt-400 text-ink-900 font-bold"
                    : "text-chalk/60 hover:text-white"
                }`}
              >
                Standard Off-Peak
              </button>
              <button
                type="button"
                onClick={() => setRateMode("PEAK")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  rateMode === "PEAK"
                    ? "bg-volt-400 text-ink-900 font-bold"
                    : "text-chalk/60 hover:text-white"
                }`}
              >
                Peak Hours (18:00–21:00)
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-chalk/14 bg-court-600/60">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-court-700/80 text-chalk/70 uppercase tracking-wider text-[11px] border-b border-chalk/14">
                <tr>
                  <th className="py-3 px-4">Sport & Arena</th>
                  <th className="py-3 px-4 text-center">Gold Member</th>
                  <th className="py-3 px-4 text-center">Silver Member</th>
                  <th className="py-3 px-4 text-center">Junior Member</th>
                  <th className="py-3 px-4 text-center">Non-Member Guest</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chalk/10">
                {PUBLIC_SPORT_RATES.map((item) => {
                  const surcharge = rateMode === "PEAK" ? item.peakSurcharge : 0;
                  const silver = item.silverRate + surcharge;
                  const junior = item.juniorRate + surcharge;
                  const guest = item.guestRate + surcharge;

                  return (
                    <tr key={item.sport} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {item.sportLabel}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-volt-400 text-ink-900 shadow-sm">
                          FREE (₹0)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-volt-300">
                        ₹{silver}/hr
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-chalk/90">
                        ₹{junior}/hr
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-chalk/60">
                        ₹{guest}/hr
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── ENTITLEMENTS COMPARISON MATRIX ─── */}
        <div className="space-y-4">
          <div className="pb-2 border-b border-chalk/14">
            <h2 className="text-2xl font-heading font-black text-chalk">
              Membership Privileges & Entitlements Matrix
            </h2>
            <p className="text-xs text-chalk/60">
              Detailed breakdown of booking windows, discounts, and guest policies per plan.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-chalk/14 bg-court-600/60">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-court-700/80 text-chalk/70 uppercase tracking-wider text-[11px] border-b border-chalk/14">
                <tr>
                  <th className="py-3 px-4">Club Benefit</th>
                  <th className="py-3 px-4 text-center">Junior Academy</th>
                  <th className="py-3 px-4 text-center">Silver Regular</th>
                  <th className="py-3 px-4 text-center text-volt-300 font-bold">Gold All-Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chalk/10">
                <tr className="hover:bg-white/5">
                  <td className="py-3 px-4 font-medium text-white">Court Hourly Tariff</td>
                  <td className="py-3 px-4 text-center text-chalk/80">₹100–₹200 / hr</td>
                  <td className="py-3 px-4 text-center text-chalk/80">₹200–₹400 / hr</td>
                  <td className="py-3 px-4 text-center font-bold text-volt-300">₹0 (Unlimited Free)</td>
                </tr>
                <tr className="hover:bg-white/5">
                  <td className="py-3 px-4 font-medium text-white">Advance Booking Priority Window</td>
                  <td className="py-3 px-4 text-center font-mono">7 Days</td>
                  <td className="py-3 px-4 text-center font-mono">10 Days</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-volt-300">14 Days</td>
                </tr>
                <tr className="hover:bg-white/5">
                  <td className="py-3 px-4 font-medium text-white">Pro Shop Gear & Apparel Discount</td>
                  <td className="py-3 px-4 text-center font-mono">10%</td>
                  <td className="py-3 px-4 text-center font-mono">10%</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-volt-300">15%</td>
                </tr>
                <tr className="hover:bg-white/5">
                  <td className="py-3 px-4 font-medium text-white">Sports Bar & Café Dining Discount</td>
                  <td className="py-3 px-4 text-center font-mono">5%</td>
                  <td className="py-3 px-4 text-center font-mono">10%</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-volt-300">15%</td>
                </tr>
                <tr className="hover:bg-white/5">
                  <td className="py-3 px-4 font-medium text-white">Annual Complimentary Guest Passes</td>
                  <td className="py-3 px-4 text-center text-chalk/40">—</td>
                  <td className="py-3 px-4 text-center font-mono">1 Pass</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-volt-300">2 Passes</td>
                </tr>
                <tr className="hover:bg-white/5">
                  <td className="py-3 px-4 font-medium text-white">Friday Social Play & Ladder Access</td>
                  <td className="py-3 px-4 text-center"><Check className="w-4 h-4 mx-auto text-volt-400" /></td>
                  <td className="py-3 px-4 text-center"><Check className="w-4 h-4 mx-auto text-volt-400" /></td>
                  <td className="py-3 px-4 text-center"><Check className="w-4 h-4 mx-auto text-volt-400" /></td>
                </tr>
                <tr className="hover:bg-white/5">
                  <td className="py-3 px-4 font-medium text-white">Dedicated Clubhouse Locker & Towels</td>
                  <td className="py-3 px-4 text-center"><X className="w-4 h-4 mx-auto text-chalk/30" /></td>
                  <td className="py-3 px-4 text-center"><X className="w-4 h-4 mx-auto text-chalk/30" /></td>
                  <td className="py-3 px-4 text-center"><Check className="w-4 h-4 mx-auto text-volt-400" /></td>
                </tr>
                <tr className="hover:bg-white/5">
                  <td className="py-3 px-4 font-medium text-white">Priority 24h Racket Stringing Labor</td>
                  <td className="py-3 px-4 text-center"><X className="w-4 h-4 mx-auto text-chalk/30" /></td>
                  <td className="py-3 px-4 text-center"><Check className="w-4 h-4 mx-auto text-volt-400" /></td>
                  <td className="py-3 px-4 text-center"><Check className="w-4 h-4 mx-auto text-volt-400" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── FAQ ACCORDION ─── */}
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="text-center space-y-1 mb-6">
            <h2 className="text-2xl sm:text-3xl font-heading font-black text-chalk">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-chalk/60">
              Everything you need to know about joining and playing at Champions Club.
            </p>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-chalk/14 bg-court-600/60 overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4"
                  >
                    <span className="font-heading font-bold text-sm sm:text-base text-white">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-volt-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-chalk/80 leading-relaxed border-t border-chalk/10">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
export default PlansPage;
