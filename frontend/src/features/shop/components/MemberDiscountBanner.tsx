import { ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import { AppLink } from "@/app/router/links";
import { useAuth } from "@/app/providers/AuthProvider";
import { useMember } from "@/features/member/memberStore";
import { TIER_DISCOUNTS } from "../types";
import type { MemberTier } from "../types";

export function MemberDiscountBanner() {
  const { user } = useAuth();
  const { profile } = useMember();

  const isMember = user?.primaryRole === "MEMBER";
  const tier: MemberTier = isMember ? (profile.tier as MemberTier) || "Gold" : "Guest";
  const tierDiscount = TIER_DISCOUNTS[tier];

  if (isMember) {
    return (
      <div className="rounded-2xl border border-volt-400/30 bg-gradient-to-r from-court-600 via-court-500 to-volt-400/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-volt-400/20 text-volt-400 border border-volt-400/30 flex items-center justify-center shrink-0">
            <Sparkles className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-chalk text-sm sm:text-base">
                {tier} Member Exclusive Perks Applied
              </span>
              <span className="rounded-pill bg-volt-400 px-2.5 py-0.5 text-xs font-bold text-ink-900">
                {tierDiscount.percent}% OFF
              </span>
            </div>
            <p className="text-xs text-chalk/70 mt-0.5">
              Enjoy your automated club discount on all equipment, strings, grips, and apparel in the cart.
            </p>
          </div>
        </div>
        <div className="text-xs text-chalk/50 flex items-center gap-1.5 shrink-0 self-start sm:self-center">
          <ShieldCheck className="size-4 text-volt-400" />
          <span>Membership Active · {profile.memberId}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-chalk/14 bg-court-600/70 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-court-500 text-volt-400 border border-chalk/10 flex items-center justify-center shrink-0">
          <Sparkles className="size-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-chalk text-sm sm:text-base">
              Club Members Save 8% to 15% on All Gear
            </span>
          </div>
          <p className="text-xs text-chalk/70 mt-0.5">
            Gold (15%), Junior (10%), and Silver (8%) discounts apply automatically at checkout for members.
          </p>
        </div>
      </div>
      <AppLink
        to="/login"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-pill bg-white/10 hover:bg-white/18 text-chalk text-xs font-semibold border border-chalk/20 transition-all shrink-0 self-start sm:self-center"
      >
        <span>Member Sign In</span>
        <ArrowRight className="size-3.5" />
      </AppLink>
    </div>
  );
}
