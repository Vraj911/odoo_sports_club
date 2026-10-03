import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { StatusPill } from "@/components/ui/StatusPill";
import { useAdminConfigStore } from "../adminConfigStore";
import type { AdminPlan } from "../types";
import {
  BadgeCheck,
  Edit2,
  Calendar,
  Percent,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Sparkles,
  Info,
} from "lucide-react";
import { toast } from "@/components/ui/Toast";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AdminPlansPage() {
  const { plans, sports, updatePlan } = useAdminConfigStore();

  const [activePlan, setActivePlan] = useState<AdminPlan | null>(null);
  const [formData, setFormData] = useState<AdminPlan | null>(null);

  const handleOpenEdit = (plan: AdminPlan) => {
    setActivePlan(plan);
    setFormData({ ...plan });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    updatePlan(formData.id, formData);
    setActivePlan(null);
    setFormData(null);
  };

  const updateCourtRate = (sportId: string, rate: number) => {
    if (!formData) return;
    setFormData({
      ...formData,
      courtRates: {
        ...formData.courtRates,
        [sportId]: rate,
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Membership Plans & Entitlements"
        subtitle="Configure subscription tariffs, commercial pro shop and bar discounts, advance reservation windows, and per-sport court rate matrices."
      />

      {/* Impact Notice Banner */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3">
        <AlertCircle className="size-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-white/80 space-y-1">
          <p className="font-semibold text-white">Tariff Modification Notice</p>
          <p>
            Changes to subscription fees and court rate matrices apply immediately from the plan&apos;s
            effective date. <strong>Future unpaid bookings and trial upgrades will be re-priced</strong>{" "}
            in accordance with the updated schedules.
          </p>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`p-6 bg-court-500 border-white/14 flex flex-col justify-between transition-all hover:border-volt-400/40 ${
              !plan.active ? "opacity-60" : ""
            }`}
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-base font-bold text-white">{plan.name}</h3>
                  <span className="text-[11px] font-mono text-volt-400">{plan.tier} Tier</span>
                </div>
                <StatusPill variant={plan.active ? "volt" : "neutral"}>
                  {plan.active ? "Active" : "Archived"}
                </StatusPill>
              </div>

              <div className="mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white">
                    {formatCurrency(plan.monthlyFee)}
                  </span>
                  <span className="text-xs text-white/60">/ month</span>
                </div>
                <span className="text-[11px] text-white/50 block">
                  {formatCurrency(plan.annualFee)} / year ({plan.validityDays} days validity)
                </span>
                <p className="mt-2 text-xs text-white/70 italic line-clamp-2">{plan.tagline}</p>
              </div>

              {/* Commercial Discounts & Windows */}
              <div className="mt-4 pt-3 border-t border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between text-white/80">
                  <span>Pro Shop Discount:</span>
                  <span className="font-semibold text-volt-400">{plan.shopDiscountPercent}%</span>
                </div>

                <div className="flex items-center justify-between text-white/80">
                  <span>Bar & Dining Discount:</span>
                  <span className="font-semibold text-volt-400">{plan.barDiscountPercent}%</span>
                </div>

                <div className="flex items-center justify-between text-white/80">
                  <span>Advance Window:</span>
                  <span className="font-semibold text-white">{plan.advanceBookingDays} Days</span>
                </div>

                <div className="flex items-center justify-between text-white/80">
                  <span>Annual Guest Passes:</span>
                  <span className="font-semibold text-white">{plan.guestPassesCount} Passes</span>
                </div>

                <div className="flex items-center justify-between text-white/80">
                  <span>Social Play Included:</span>
                  <span className="font-semibold text-white">
                    {plan.socialAccess ? "Yes (Free)" : "Pay-per-session"}
                  </span>
                </div>
              </div>

              {/* Court Rates Matrix Preview */}
              <div className="mt-4 pt-3 border-t border-white/10 space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 block">
                  Hourly Court Rates
                </span>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  {Object.entries(plan.courtRates).map(([sport, rate]) => (
                    <div key={sport} className="flex items-center justify-between py-0.5">
                      <span className="capitalize text-white/60">{sport}:</span>
                      <span className={`font-mono ${rate === 0 ? "text-volt-400 font-bold" : "text-white"}`}>
                        {rate === 0 ? "₹0 Free" : `₹${rate}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleOpenEdit(plan)}
                className="w-full gap-2 text-xs"
              >
                <Edit2 className="size-3.5" />
                <span>Edit Entitlements</span>
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Plan Modal */}
      {formData && (
        <Modal
          isOpen={!!activePlan}
          onClose={() => {
            setActivePlan(null);
            setFormData(null);
          }}
          title={`Edit ${formData.name} Entitlements`}
          subtitle="Update pricing, validity, commercial perks, and per-sport court rate matrix."
        >
          <form onSubmit={handleSave} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Monthly Subscription (₹) *"
                type="number"
                value={formData.monthlyFee}
                onChange={(e) =>
                  setFormData({ ...formData, monthlyFee: Number(e.target.value) })
                }
                required
              />

              <Input
                label="Annual Subscription (₹) *"
                type="number"
                value={formData.annualFee}
                onChange={(e) =>
                  setFormData({ ...formData, annualFee: Number(e.target.value) })
                }
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Pro Shop Discount (%)"
                type="number"
                value={formData.shopDiscountPercent}
                onChange={(e) =>
                  setFormData({ ...formData, shopDiscountPercent: Number(e.target.value) })
                }
                required
              />

              <Input
                label="Bar Discount (%)"
                type="number"
                value={formData.barDiscountPercent}
                onChange={(e) =>
                  setFormData({ ...formData, barDiscountPercent: Number(e.target.value) })
                }
                required
              />

              <Input
                label="Advance Booking (Days)"
                type="number"
                value={formData.advanceBookingDays}
                onChange={(e) =>
                  setFormData({ ...formData, advanceBookingDays: Number(e.target.value) })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Annual Guest Passes"
                type="number"
                value={formData.guestPassesCount}
                onChange={(e) =>
                  setFormData({ ...formData, guestPassesCount: Number(e.target.value) })
                }
                required
              />

              <div>
                <label className="block text-xs font-medium text-white/80 mb-1.5">
                  Effective From Date *
                </label>
                <input
                  type="date"
                  value={formData.effectiveDate}
                  onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl bg-white/8 border border-white/18 text-xs text-white focus:outline-none focus:border-volt-400"
                  required
                />
              </div>
            </div>

            {/* Per-sport Court Rate Matrix (₹0 allowed) */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-volt-400">
                  Per-Sport Court Rate Matrix (₹ / hr)
                </span>
                <span className="text-[10px] text-white/60">₹0 allowed for complimentary play</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {sports.map((sport) => {
                  const currentRate = formData.courtRates[sport.id] ?? 0;
                  return (
                    <div key={sport.id}>
                      <label className="block text-xs font-medium text-white/80 mb-1 capitalize">
                        {sport.name} Hourly Rate (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={currentRate}
                        onChange={(e) => updateCourtRate(sport.id, Number(e.target.value))}
                        className="w-full h-10 px-3 rounded-xl bg-navy-800 border border-white/18 text-xs text-white focus:outline-none focus:border-volt-400"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
              <div>
                <span className="text-xs font-medium text-white block">Free Social Play Access</span>
                <span className="text-[11px] text-white/60">
                  Enables complimentary entry to Friday Social and Sunday Mixers.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, socialAccess: !formData.socialAccess })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  formData.socialAccess ? "bg-volt-400" : "bg-white/20"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-5 transform rounded-full bg-ink-900 shadow ring-0 transition duration-200 ease-in-out ${
                    formData.socialAccess ? "translate-x-5" : "translate-x-0 bg-white"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setActivePlan(null);
                  setFormData(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save & Apply Entitlements
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
