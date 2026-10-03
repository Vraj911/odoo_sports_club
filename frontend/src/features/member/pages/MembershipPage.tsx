import { useState } from "react";
import {
  BadgeCheck,
  Check,
  ChevronRight,
  Clock,
  CreditCard,
  History,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { Money } from "@/components/shared/Money";
import { useMember } from "@/features/member/memberStore";
import {
  MEMBERSHIP_PLANS,
  computeRenewalEndDate,
  computePlanChangePreview,
} from "@/features/member/sampleData";
import { InvoicePreview } from "@/features/member/components/InvoicePreview";
import type { MembershipPlan, Invoice } from "@/features/member/types";
import { cn } from "@/lib/cn";

export default function MembershipPage() {
  const { profile, renewMembership, changePlan, invoices } = useMember();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<"renew" | "change">("renew");
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<MembershipPlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successInvoice, setSuccessInvoice] = useState<Invoice | null>(null);

  const isExpired = profile.status === "EXPIRED";
  const newEndDate = computeRenewalEndDate(profile.validTill, isExpired);
  const currentPlan = MEMBERSHIP_PLANS.find((p) => p.tier === profile.tier) ?? MEMBERSHIP_PLANS[0]!;

  // Handle Renewal Click
  const handleRenew = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const res = renewMembership(currentPlan.id);
      setIsProcessing(false);
      if (res.success) {
        toast.success(
          "Membership Renewed!",
          `Your ${currentPlan.name} is now active until ${res.newValidTill}. Receipt generated.`
        );
        const inv = invoices.find((i) => i.id === res.invoiceId);
        if (inv) setSuccessInvoice(inv);
      }
    }, 500);
  };

  // Handle Plan Upgrade Confirm
  const handleConfirmPlanChange = () => {
    if (!selectedPlanForUpgrade) return;
    setIsProcessing(true);

    setTimeout(() => {
      changePlan(selectedPlanForUpgrade.id);
      setIsProcessing(false);
      toast.success(
        "Tier Upgraded!",
        `You are now a ${selectedPlanForUpgrade.tier} Member. Benefits applied immediately.`
      );
      setSelectedPlanForUpgrade(null);
    }, 600);
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="border-b border-chalk/10 pb-6">
        <div className="flex items-center gap-2.5">
          <BadgeCheck className="size-6 text-volt-400" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-chalk">
            Membership & Subscription
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-chalk/70 mt-1">
          Review your current plan entitlements, compute renewal dates, or upgrade tiers with pro-rated billing.
        </p>
      </div>

      {/* Top Current-Plan Card */}
      <div className="rounded-[24px] border border-chalk/18 bg-court-500 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <StatusPill
                variant={profile.tier === "Gold" ? "volt" : "neutral"}
                className="text-xs uppercase tracking-wider font-semibold"
              >
                {profile.tier} Tier
              </StatusPill>
              <span className="text-xs font-mono text-chalk/60">
                · {profile.status.replace("_", " ")}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-chalk">
              {currentPlan.name}
            </h2>
            <p className="text-xs sm:text-sm text-chalk/70 font-mono">
              Valid through:{" "}
              <strong className="text-chalk">
                {new Date(profile.validTill).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </strong>{" "}
              ({profile.daysRemaining} days remaining)
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="text-left sm:text-right">
              <span className="text-[11px] uppercase tracking-wider text-chalk/50 block">Annual Subscription</span>
              <span className="text-2xl font-bold font-mono text-volt-400">
                <Money amount={currentPlan.annualFee} />
              </span>
              <span className="text-[11px] text-chalk/60 block font-mono">incl. 18% GST</span>
            </div>
          </div>
        </div>

        {/* Current Plan Entitlements Summary */}
        <div className="mt-6 border-t border-chalk/10 pt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-chalk/50">Court Booking</span>
            <p className="font-semibold text-chalk">{profile.entitlements.courtDescription}</p>
          </div>
          <div className="space-y-1">
            <span className="text-chalk/50">Pro Shop Gear</span>
            <p className="font-semibold text-chalk">{profile.entitlements.shopDiscount}% off all products</p>
          </div>
          <div className="space-y-1">
            <span className="text-chalk/50">Lounge & Bar Tab</span>
            <p className="font-semibold text-chalk">{profile.entitlements.barDiscount}% off kitchen & bar</p>
          </div>
          <div className="space-y-1">
            <span className="text-chalk/50">Advance Window</span>
            <p className="font-semibold text-chalk font-mono">{profile.entitlements.advanceBookingDays} Days ahead</p>
          </div>
        </div>
      </div>

      {/* Tabs: [Renew | Change plan] */}
      <div className="space-y-6">
        <Tabs
          tabs={[
            { id: "renew", label: "Renew Membership" },
            { id: "change", label: "Change Plan / Upgrade" },
          ]}
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as "renew" | "change")}
        />

        {/* ── TAB 1: RENEW ── */}
        {activeTab === "renew" && (
          <div className="rounded-[24px] border border-chalk/14 bg-court-500 p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-chalk">
                Renew Your {currentPlan.name}
              </h3>
              <p className="text-xs text-chalk/70 mt-1">
                {isExpired
                  ? "Since your membership has lapsed, renewal starts from today for a full 365 days."
                  : "Your new 1-year term seamlessly extends from your current expiration date."}
              </p>
            </div>

            {/* Computation breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-2xl bg-court-600/60 p-5 border border-chalk/10 text-xs">
              <div className="space-y-1">
                <span className="text-chalk/50 uppercase tracking-wider text-[10px]">Current End Date</span>
                <p className="text-sm font-mono font-semibold text-chalk">{profile.validTill}</p>
              </div>

              <div className="space-y-1">
                <span className="text-volt-400 uppercase tracking-wider text-[10px] font-semibold">
                  Computed New End Date
                </span>
                <p className="text-sm font-mono font-bold text-volt-400 flex items-center gap-1.5">
                  <Clock className="size-4" />
                  <span>{newEndDate}</span>
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-chalk/50 uppercase tracking-wider text-[10px]">Renewal Amount</span>
                <p className="text-sm font-mono font-bold text-chalk">
                  <Money amount={currentPlan.annualFee} />
                </p>
              </div>
            </div>

            {/* Invoice & Tax preview */}
            <div className="rounded-xl border border-chalk/10 bg-court-700/50 p-4 space-y-2 text-xs">
              <div className="flex justify-between text-chalk/70">
                <span>Base Subscription Fee:</span>
                <span className="font-mono text-chalk">
                  <Money amount={Math.round((currentPlan.annualFee / 1.18) * 100) / 100} />
                </span>
              </div>
              <div className="flex justify-between text-chalk/70">
                <span>Applicable GST (CGST 9% + SGST 9%):</span>
                <span className="font-mono text-chalk">
                  <Money amount={Math.round((currentPlan.annualFee - currentPlan.annualFee / 1.18) * 100) / 100} />
                </span>
              </div>
              <div className="border-t border-chalk/10 pt-2 flex justify-between font-bold text-sm">
                <span className="text-chalk">Total to Pay & Renew:</span>
                <span className="text-volt-400 font-mono text-base">
                  <Money amount={currentPlan.annualFee} />
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Button
                variant="primary"
                onClick={handleRenew}
                loading={isProcessing}
                className="w-full sm:w-auto"
              >
                Pay & Renew · <Money amount={currentPlan.annualFee} />
              </Button>
            </div>
          </div>
        )}

        {/* ── TAB 2: CHANGE PLAN / UPGRADE ── */}
        {activeTab === "change" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {MEMBERSHIP_PLANS.map((plan) => {
                const isCurrent = plan.tier === profile.tier;
                const preview = computePlanChangePreview(profile, plan);

                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "relative flex flex-col justify-between rounded-[24px] border p-6 transition-all duration-200",
                      isCurrent
                        ? "border-volt-400 bg-court-500 shadow-volt/10"
                        : "border-chalk/14 bg-court-500/80 hover:border-chalk/28 hover:-translate-y-1"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-bold text-chalk">{plan.name}</h4>
                        {isCurrent ? (
                          <Badge variant="volt">Current Plan</Badge>
                        ) : plan.popular ? (
                          <Badge variant="success">Most Popular</Badge>
                        ) : null}
                      </div>

                      <div className="mt-3">
                        <span className="text-2xl font-bold font-mono text-volt-400">
                          <Money amount={plan.annualFee} />
                        </span>
                        <span className="text-xs text-chalk/60 ml-1.5 font-mono">/ year</span>
                      </div>

                      <p className="mt-2 text-xs text-chalk/70 leading-relaxed">
                        {plan.description}
                      </p>

                      {/* Entitlement Difference Badges */}
                      <div className="mt-5 space-y-2 border-t border-chalk/10 pt-4 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-chalk/60">Courts:</span>
                          <span className="font-semibold text-chalk">{plan.courtRate}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-chalk/60">Pro Shop:</span>
                          <span className="font-semibold text-chalk flex items-center gap-1">
                            {plan.shopDiscount}
                            {plan.tier === "Gold" && profile.tier !== "Gold" && (
                              <span className="text-volt-400 font-bold">↑ +5%</span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-chalk/60">Bar Tab:</span>
                          <span className="font-semibold text-chalk flex items-center gap-1">
                            {plan.barDiscount}
                            {plan.tier === "Gold" && profile.tier !== "Gold" && (
                              <span className="text-volt-400 font-bold">↑ +5%</span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-chalk/60">Booking Window:</span>
                          <span className="font-mono font-semibold text-chalk">
                            {plan.advanceBookingDays} Days
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-chalk/10">
                      {isCurrent ? (
                        <Button variant="secondary" disabled className="w-full">
                          Your Active Plan
                        </Button>
                      ) : (
                        <Button
                          variant={preview.isUpgrade ? "primary" : "secondary"}
                          onClick={() => setSelectedPlanForUpgrade(plan)}
                          className="w-full"
                        >
                          Switch to {plan.tier}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Pro-rated Confirmation Modal for Plan Change */}
      {selectedPlanForUpgrade && (
        <Modal
          isOpen={Boolean(selectedPlanForUpgrade)}
          onClose={() => setSelectedPlanForUpgrade(null)}
          maxWidth="md"
          title={
            <div className="flex items-center gap-2 text-volt-400">
              <TrendingUp className="size-5" />
              <span>Confirm Plan Upgrade to {selectedPlanForUpgrade.name}</span>
            </div>
          }
          subtitle="Pro-rated charge computation and immediate entitlement activation"
        >
          {(() => {
            const preview = computePlanChangePreview(profile, selectedPlanForUpgrade);

            return (
              <div className="flex flex-col gap-4 text-xs">
                <div className="rounded-2xl border border-chalk/14 bg-court-700/60 p-4 space-y-2.5">
                  <div className="flex justify-between text-chalk/70">
                    <span>Target Plan Annual Fee:</span>
                    <span className="font-mono text-chalk font-semibold">
                      <Money amount={preview.newPlanFee} />
                    </span>
                  </div>

                  <div className="flex justify-between text-emerald-400">
                    <span>Credit for unused {preview.daysRemaining} days on current plan:</span>
                    <span className="font-mono font-semibold">
                      - <Money amount={preview.creditAmount} />
                    </span>
                  </div>

                  <div className="border-t border-chalk/10 pt-2 flex justify-between font-bold text-sm">
                    <span className="text-chalk">Net Amount Due Today:</span>
                    <span className="text-volt-400 font-mono text-base">
                      <Money amount={preview.netPayable} />
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-xl bg-court-600/50 p-3 text-chalk/80 border border-chalk/8">
                  <Sparkles className="size-4 text-volt-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Effective from today:</strong> Your new {selectedPlanForUpgrade.tier} perks, 14-day court window, and complimentary rates will activate immediately.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-chalk/10">
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedPlanForUpgrade(null)}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleConfirmPlanChange}
                    loading={isProcessing}
                  >
                    Confirm & Upgrade · <Money amount={preview.netPayable} />
                  </Button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* Success Invoice Modal */}
      {successInvoice && (
        <Modal
          isOpen={Boolean(successInvoice)}
          onClose={() => setSuccessInvoice(null)}
          maxWidth="xl"
        >
          <InvoicePreview
            invoice={successInvoice}
            member={profile}
          />
        </Modal>
      )}

      {/* Bottom: Membership History Timeline & Reminder Schedule Note */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-chalk/10">
        {/* History Timeline */}
        <div className="rounded-[20px] border border-chalk/14 bg-court-500 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <History className="size-4 text-volt-400" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-chalk">
              Membership Timeline & History
            </h3>
          </div>

          <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-chalk/14 text-xs">
            <div className="relative">
              <span className="absolute -left-5 top-1 size-2 rounded-full bg-volt-400" />
              <span className="font-semibold text-chalk block">Gold Subscription Active</span>
              <span className="text-[11px] text-chalk/50 font-mono">14 Nov 2025 · Ref #CCMS-2025-0101</span>
            </div>
            <div className="relative">
              <span className="absolute -left-5 top-1 size-2 rounded-full bg-chalk/40" />
              <span className="font-semibold text-chalk block">Upgraded from Silver to Gold</span>
              <span className="text-[11px] text-chalk/50 font-mono">14 Nov 2024 · Ref #UPG-8821</span>
            </div>
            <div className="relative">
              <span className="absolute -left-5 top-1 size-2 rounded-full bg-chalk/40" />
              <span className="font-semibold text-chalk block">Initial Club Registration</span>
              <span className="text-[11px] text-chalk/50 font-mono">14 Nov 2023 · Desk Walk-in</span>
            </div>
          </div>
        </div>

        {/* Reminder Schedule Note */}
        <div className="rounded-[20px] border border-chalk/14 bg-court-500 p-6 space-y-3 text-xs text-chalk/70">
          <div className="flex items-center gap-2 text-chalk font-semibold">
            <ShieldCheck className="size-4 text-volt-400" />
            <span className="uppercase tracking-wider text-sm">Automated Renewal Notifications</span>
          </div>
          <p className="leading-relaxed">
            Champions Club guarantees that no member is caught unawares when a plan ends. We automatically dispatch email, SMS, and in-app alerts at:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-chalk/80 font-mono">
            <li><strong>30 days prior:</strong> Early-bird renewal window opens.</li>
            <li><strong>7 days prior:</strong> Final courtesy warning & invoice dispatch.</li>
            <li><strong>1 day prior:</strong> Urgent same-day renewal reminder.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
